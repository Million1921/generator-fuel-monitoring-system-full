export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireAbility } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PutSchema = z.object({
  siteId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  region: z.string().optional().nullable(),
  tankerCapacity: z.coerce.number().nonnegative().optional().nullable(),
  dgCapacity: z.string().optional().nullable(),
  dgType: z.string().optional().nullable(),
  gpsCoordinates: z.string().optional().nullable(),
  regionId: z.coerce.number().int().positive().optional().nullable(),
})

// GET /api/sites/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("read", "Site")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const site = await prisma.site.findUnique({
      where: { id: parsedId },
      include: { generator: true, regionModel: true, fuelRequests: true, fuelRefills: true },
    })
    if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(site)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/sites/[id]")
  }
}

// PUT /api/sites/[id]
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
    const data = parsed.data

    const site = await prisma.site.update({
      where: { id: parsedId },
      data: {
        siteId: data.siteId,
        name: data.name,
        region: data.region ?? null,
        tankerCapacity: data.tankerCapacity ?? null,
        dgCapacity: data.dgCapacity ?? null,
        dgType: data.dgType ?? null,
        gpsCoordinates: data.gpsCoordinates ?? null,
        regionId: data.regionId ?? null,
      },
    })
    return NextResponse.json(site)
  } catch (e) {
    return apiErrorResponse(e, "PUT /api/sites/[id]")
  }
}

// DELETE /api/sites/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAbility("delete", "Site")

    const { id } = await params;
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    await prisma.site.delete({ where: { id: parsedId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return apiErrorResponse(e, "DELETE /api/sites/[id]")
  }
}
