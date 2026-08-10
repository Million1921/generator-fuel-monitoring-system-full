export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireAbility } from "@/lib/auth"
import { subject } from "@casl/ability"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { 
  approveFuelRequest,
  createWorkOrder,
  approveToFinance,
  releaseFunds,
  purchaseAndAssignFuel,
  verifyAndCompleteDelivery,
  deleteFuelRequest
} from "@/features/fuel-requests/actions"

const PutSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional().nullable(),
  actualRefueled: z.coerce.number().nonnegative().optional(),
  technicianId: z.coerce.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  workOrderNumber: z.string().optional(),
  
  // Extra fields needed for specific state transitions
  amount: z.coerce.number().positive().optional(),
  financeRemark: z.string().optional(),
  fuelStation: z.string().optional(),
  purchasedAmount: z.coerce.number().positive().optional(),
})

// GET /api/fuel-requests/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ability } = await requireAbility("read", "FuelRequest")
    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const request = await prisma.fuelRequest.findUnique({
      where: { id: parsedId },
      include: { site: true, technician: true },
    })
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    if (!ability.can('read', subject('FuelRequest', request) as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(request)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/fuel-requests/[id]")
  }
}

// PUT /api/fuel-requests/[id] — general update (status, approval, etc.)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const body = await req.json()
    const parsed = PutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    const oldRequest = await prisma.fuelRequest.findUnique({ where: { id } })
    if (!oldRequest) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { ability, session } = await requireAbility("update", "FuelRequest")
    if (!ability.can('update', subject('FuelRequest', oldRequest) as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If status is changing, enforce the specific state transition logic
    if (data.status && data.status !== oldRequest.status) {
      if (data.status === "PENDING_MANAGER_APPROVAL") {
        // Supervisor approves → Manager
        await approveFuelRequest(id)
      } else if (data.status === "APPROVED_REQUEST") {
        // Manager approves → Fleet Admin
        await approveToFinance(id)
      } else if (data.status === "PENDING_FINANCE") {
        // Fleet Admin creates Work Order → Finance
        await createWorkOrder(id)
      } else if (data.status === "FUNDS_RELEASED") {
        if (!data.amount || !data.financeRemark) {
          return NextResponse.json({ error: "Missing amount or financeRemark for FUNDS_RELEASED" }, { status: 400 })
        }
        await releaseFunds(id, data.amount, data.financeRemark, session.user.id)
      } else if (data.status === "ASSIGNED_TO_TECH") {
        if (!data.technicianId || !data.fuelStation || !data.purchasedAmount) {
          return NextResponse.json({ error: "Missing technicianId, fuelStation, or purchasedAmount for ASSIGNED_TO_TECH" }, { status: 400 })
        }
        await purchaseAndAssignFuel(id, session.user.id, data.technicianId, data.fuelStation, data.purchasedAmount)
      } else if (data.status === "COMPLETED") {
        await verifyAndCompleteDelivery(id)
      } else {
        // SAFETY: This fallback handles statuses with NO financial side-effects
        // (no wallet transactions, no balance changes). If a new status is added
        // that touches money, it MUST get its own dedicated branch above that
        // delegates to a server action with proper $transaction logic.
        const SAFE_FALLBACK_STATUSES = [
          "REJECTED",
          "PENDING_SUPERVISOR",
          "PENDING",
          "APPROVED_FOR_FUEL",
        ] as const;

        if (!(SAFE_FALLBACK_STATUSES as readonly string[]).includes(data.status!)) {
          return NextResponse.json(
            { error: `Status '${data.status}' requires a dedicated workflow action and cannot be set directly.` },
            { status: 400 }
          )
        }

        const extra: Record<string, any> = {}
        if (data.status === "APPROVED_FOR_FUEL" && !oldRequest.workOrderNumber && !data.workOrderNumber) {
          extra.workOrderNumber = `WO-${1000 + id}`
        }

        await prisma.fuelRequest.update({
          where: { id },
          data: {
            status: data.status,
            approvedAt: data.status?.startsWith("APPROVED") ? new Date() : undefined,
            rejectedAt: data.status === "REJECTED" ? new Date() : undefined,
            rejectionReason: data.status === "REJECTED" ? data.rejectionReason : undefined,
            ...extra,
          }
        })
      }
    }

    // After state transition (if any), update other editable fields if provided
    const updateData: Record<string, any> = {}
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.actualRefueled !== undefined) updateData.actualRefueled = data.actualRefueled
    // If not transitioning to ASSIGNED_TO_TECH, allow general technicianId update
    if (data.technicianId !== undefined && data.status !== "ASSIGNED_TO_TECH") {
      updateData.technicianId = data.technicianId
    }
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.workOrderNumber !== undefined) updateData.workOrderNumber = data.workOrderNumber

    let updated = await prisma.fuelRequest.findUnique({ where: { id } })
    if (Object.keys(updateData).length > 0) {
      updated = await prisma.fuelRequest.update({
        where: { id },
        data: updateData
      })
    }
    
    return NextResponse.json(updated)
  } catch (e) {
    return apiErrorResponse(e, "PUT /api/fuel-requests/[id]")
  }
}

// DELETE /api/fuel-requests/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    // deleteFuelRequest action handles CASL/ability checks
    await deleteFuelRequest(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return apiErrorResponse(e, "DELETE /api/fuel-requests/[id]")
  }
}
