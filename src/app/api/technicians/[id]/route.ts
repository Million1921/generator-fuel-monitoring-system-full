export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PutSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  regionId: z.coerce.number().int().positive().optional().nullable(),
  userId: z.string().optional().nullable(),
})

// GET /api/technicians/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("read", "Technician")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const technician = await prisma.technician.findUnique({
      where: { id: parsedId },
      include: { region: true, user: true, fuelRequests: true, fuelRefills: true },
    })
    if (!technician) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(technician)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/technicians/[id]")
  }
}

// PUT /api/technicians/[id]
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

    const technician = await prisma.technician.update({
      where: { id: parsedId },
      data: {
        name: data.name ?? undefined,
        department: data.department ?? undefined,
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        regionId: data.regionId ?? undefined,
        userId: data.userId ?? undefined,
      },
    })
    return NextResponse.json(technician)
  } catch (e) {
    return apiErrorResponse(e, "PUT /api/technicians/[id]")
  }
}

// DELETE /api/technicians/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    await prisma.technician.delete({ where: { id: parsedId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return apiErrorResponse(e, "DELETE /api/technicians/[id]")
  }
}
