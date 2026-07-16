export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PutSchema = z.object({
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  capacityKVA: z.coerce.number().nonnegative().optional(),
  stdFuelConsumption: z.coerce.number().nonnegative().optional(),
  lastRunningHours: z.coerce.number().nonnegative().optional(),
})

// GET /api/generators/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("read", "Generator")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const generator = await prisma.generator.findUnique({
      where: { id: parsedId },
      include: { site: true },
    })
    if (!generator) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(generator)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/generators/[id]")
  }
}

// PUT /api/generators/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const body = await req.json()
    const parsed = PutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    const generator = await prisma.generator.update({
      where: { id: parsedId },
      data: {
        model: data.model ?? null,
        serialNumber: data.serialNumber ?? null,
        capacityKVA: data.capacityKVA,
        stdFuelConsumption: data.stdFuelConsumption,
        lastRunningHours: data.lastRunningHours,
      },
    })
    return NextResponse.json(generator)
  } catch (e) {
    return apiErrorResponse(e, "PUT /api/generators/[id]")
  }
}

// DELETE /api/generators/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    await prisma.generator.delete({ where: { id: parsedId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return apiErrorResponse(e, "DELETE /api/generators/[id]")
  }
}
