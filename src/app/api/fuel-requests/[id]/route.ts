export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PutSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional().nullable(),
  actualRefueled: z.coerce.number().nonnegative().optional(),
  technicianId: z.coerce.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  workOrderNumber: z.string().optional(),
})

// GET /api/fuel-requests/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("read", "FuelRequest")
    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const request = await prisma.fuelRequest.findUnique({
      where: { id: parsedId },
      include: { site: true, technician: true },
    })
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(request)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/fuel-requests/[id]")
  }
}

// PUT /api/fuel-requests/[id] — general update (status, approval, etc.)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"])

    const { id: paramId } = await params;
    const id = parseInt(paramId)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const body = await req.json()
    const parsed = PutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    // Auto-generate work order number when moving to APPROVED_FOR_FUEL.
    // Derived from the request's own (already unique) id — atomic, no
    // count()-based race or reuse on delete.
    const extra: Record<string, any> = {}
    if (data.status === "APPROVED_FOR_FUEL" && !data.workOrderNumber) {
      extra.workOrderNumber = `WO-${1000 + id}`
    }

    const updated = await prisma.fuelRequest.update({
      where: { id },
      data: {
        status: data.status ?? undefined,
        priority: data.priority ?? undefined,
        actualRefueled: data.actualRefueled,
        technicianId: data.technicianId,
        notes: data.notes ?? undefined,
        rejectionReason: data.rejectionReason ?? undefined,
        approvedAt: data.status?.startsWith("APPROVED") ? new Date() : undefined,
        rejectedAt: data.status === "REJECTED" ? new Date() : undefined,
        ...extra,
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    return apiErrorResponse(e, "PUT /api/fuel-requests/[id]")
  }
}

// DELETE /api/fuel-requests/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    await prisma.fuelRequest.delete({ where: { id: parsedId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return apiErrorResponse(e, "DELETE /api/fuel-requests/[id]")
  }
}
