export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireAbility } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PutSchema = z.object({
  name: z.string().min(1).optional(),
})

// GET /api/regions/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("read", "Site")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const region = await prisma.region.findUnique({
      where: { id: parsedId },
      include: { sites: true, technicians: true },
    })
    if (!region) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(region)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/regions/[id]")
  }
}

// PUT /api/regions/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("update", "Site")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const body = await req.json()
    const parsed = PutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const region = await prisma.region.update({
      where: { id: parsedId },
      data: { name: parsed.data.name ?? undefined },
    })
    return NextResponse.json(region)
  } catch (e) {
    return apiErrorResponse(e, "PUT /api/regions/[id]")
  }
}

// DELETE /api/regions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("delete", "Site")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    await prisma.region.delete({ where: { id: parsedId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return apiErrorResponse(e, "DELETE /api/regions/[id]")
  }
}
