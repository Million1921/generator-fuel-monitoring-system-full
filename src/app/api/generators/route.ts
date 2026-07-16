export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility, getRegionScope } from "@/lib/auth"
import { apiErrorResponse, displayNumberFromId } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PostSchema = z.object({
  siteId: z.coerce.number().int().positive(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  capacityKVA: z.coerce.number().nonnegative().default(0),
  stdFuelConsumption: z.coerce.number().nonnegative().default(0),
  lastRunningHours: z.coerce.number().nonnegative().default(0),
})

// GET /api/generators — list all generators (optional ?siteId=)
export async function GET(req: NextRequest) {
  try {
    const { role } = await requireAbility("read", "Generator")
    const scopedRegion = await getRegionScope(role)
    const siteIdParam = req.nextUrl.searchParams.get("siteId")

    let whereClause: any = {}
    if (siteIdParam) {
      const parsedSiteId = parseInt(siteIdParam)
      if (isNaN(parsedSiteId)) return NextResponse.json({ error: "Invalid siteId" }, { status: 400 })
      whereClause.siteId = parsedSiteId
    }
    if (scopedRegion) {
      whereClause.site = { region: scopedRegion }
    }

    const generators = await prisma.generator.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: { site: true },
      orderBy: { genId: "asc" },
    })
    return NextResponse.json(generators)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/generators")
  }
}

// POST /api/generators — create a generator
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    // Create with a placeholder genId, then derive the display id from the
    // row's own DB-assigned autoincrement id (atomic, no count() race).
    const generator = await prisma.generator.create({
      data: {
        genId: `GEN-PENDING-${Date.now()}`,
        model: data.model ?? null,
        serialNumber: data.serialNumber ?? null,
        capacityKVA: data.capacityKVA,
        stdFuelConsumption: data.stdFuelConsumption,
        lastRunningHours: data.lastRunningHours,
        siteId: data.siteId,
      },
    })
    const genId = `GEN-${data.siteId}-${generator.id}`
    const finalGenerator = await prisma.generator.update({
      where: { id: generator.id },
      data: { genId },
    })
    return NextResponse.json(finalGenerator, { status: 201 })
  } catch (e) {
    return apiErrorResponse(e, "POST /api/generators")
  }
}
