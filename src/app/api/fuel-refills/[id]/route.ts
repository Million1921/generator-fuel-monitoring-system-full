export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { requireAbility } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { deleteFuelDelivery } from "@/features/fuel-requests/actions"

const PutSchema = z.object({
  fuelDelivered: z.coerce.number().positive().optional(),
  beforeLevel: z.coerce.number().nonnegative().optional(),
  afterLevel: z.coerce.number().nonnegative().optional(),
  beforeHours: z.coerce.number().nonnegative().optional(),
  afterHours: z.coerce.number().nonnegative().optional(),
  refillDate: z.coerce.date().optional(),
  technicianId: z.coerce.number().int().positive().optional().nullable(),
  tankerVehicle: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
})

// GET /api/fuel-refills/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("read", "FuelRefill")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const refill = await prisma.fuelRefill.findUnique({
      where: { id: parsedId },
      include: { site: true, technician: true },
    })
    if (!refill) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(refill)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/fuel-refills/[id]")
  }
}

// PUT /api/fuel-refills/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("update", "FuelRefill")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const body = await req.json()
    const parsed = PutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const refill = await tx.fuelRefill.update({
        where: { id: parsedId },
        data: {
          fuelDelivered: data.fuelDelivered,
          beforeLevel: data.beforeLevel,
          afterLevel: data.afterLevel,
          beforeHours: data.beforeHours,
          afterHours: data.afterHours,
          refillDate: data.refillDate,
          technicianId: data.technicianId ?? undefined,
          tankerVehicle: data.tankerVehicle ?? undefined,
          driverName: data.driverName ?? undefined,
        },
      })

      // If afterHours was updated, keep the generator's reading in sync.
      // Derive siteId from the persisted refill record — never from the
      // client payload — since the server already knows the authoritative value.
      if (data.afterHours !== undefined) {
        await tx.generator.update({
          where: { siteId: refill.siteId },
          data: { lastRunningHours: data.afterHours },
        })
      }

      return refill
    })

    return NextResponse.json(result)
  } catch (e) {
    return apiErrorResponse(e, "PUT /api/fuel-refills/[id]")
  }
}

// DELETE /api/fuel-refills/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    // deleteFuelDelivery action handles CASL/ability checks
    await deleteFuelDelivery(parsedId)
    return NextResponse.json({ success: true })
  } catch (e) {
    return apiErrorResponse(e, "DELETE /api/fuel-refills/[id]")
  }
}

