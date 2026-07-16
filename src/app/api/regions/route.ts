export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PostSchema = z.object({
  name: z.string().min(1),
})

// GET /api/regions — list all regions
export async function GET() {
  try {
    await requireAbility("read", "Site")
    const regions = await prisma.region.findMany({
      include: { sites: true, technicians: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(regions)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/regions")
  }
}

// POST /api/regions — add a new region
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"])

    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const region = await prisma.region.create({
      data: { name: parsed.data.name },
    })
    return NextResponse.json(region, { status: 201 })
  } catch (e) {
    return apiErrorResponse(e, "POST /api/regions")
  }
}
