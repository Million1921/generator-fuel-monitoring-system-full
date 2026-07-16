export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility, getRegionScope } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PostSchema = z.object({
  name: z.string().min(1),
  department: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  regionId: z.coerce.number().int().positive().optional().nullable(),
  userId: z.string().optional().nullable(),
})

// GET /api/technicians — list all technicians (optional ?regionId=)
export async function GET(req: NextRequest) {
  try {
    const { role } = await requireAbility("read", "Technician")
    const scopedRegion = await getRegionScope(role)
    const regionIdParam = req.nextUrl.searchParams.get("regionId")

    let whereClause: any = {}
    if (regionIdParam) {
      const parsedRegionId = parseInt(regionIdParam)
      if (isNaN(parsedRegionId)) return NextResponse.json({ error: "Invalid regionId" }, { status: 400 })
      whereClause.regionId = parsedRegionId
    }
    if (scopedRegion) {
      whereClause.region = { name: scopedRegion }
    }

    const technicians = await prisma.technician.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: { region: true, user: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(technicians)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/technicians")
  }
}

// POST /api/technicians — add a new technician
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    const technician = await prisma.technician.create({
      data: {
        name: data.name,
        department: data.department ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        regionId: data.regionId ?? null,
        userId: data.userId ?? null,
      },
    })
    return NextResponse.json(technician, { status: 201 })
  } catch (e) {
    return apiErrorResponse(e, "POST /api/technicians")
  }
}
