export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility, getRegionScope } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PostSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  region: z.string().optional().nullable(),
  tankerCapacity: z.coerce.number().nonnegative().optional().nullable(),
  dgCapacity: z.string().optional().nullable(),
  dgType: z.string().optional().nullable(),
  gpsCoordinates: z.string().optional().nullable(),
  regionId: z.coerce.number().int().positive().optional().nullable(),
})

// GET /api/sites — list all sites (with optional region filter)
export async function GET(req: NextRequest) {
  try {
    const { role } = await requireAbility("read", "Site")
    const scopedRegion = await getRegionScope(role)
    const queryRegion = req.nextUrl.searchParams.get("region") ?? undefined
    const region = scopedRegion || queryRegion

    const sites = await prisma.site.findMany({
      where: region ? { region } : undefined,
      include: { generator: true, regionModel: true },
      orderBy: { siteId: "asc" },
    })
    return NextResponse.json(sites)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/sites")
  }
}

// POST /api/sites — create a new site
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    const site = await prisma.site.create({
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
    return NextResponse.json(site, { status: 201 })
  } catch (e) {
    return apiErrorResponse(e, "POST /api/sites")
  }
}
