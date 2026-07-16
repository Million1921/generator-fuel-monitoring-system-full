export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireRole, requireAbility, getRegionScope } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PostSchema = z.object({
  siteId: z.coerce.number().int().positive(),
  status: z.string().optional(),
  priority: z.string().optional().nullable(),
  literRequired: z.coerce.number().positive().optional().nullable(),
  technicianId: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/fuel-requests — list all (optional ?region=, ?status=)
export async function GET(req: NextRequest) {
  try {
    const { role } = await requireAbility("read", "FuelRequest")
    const scopedRegion = await getRegionScope(role)
    const queryRegion = req.nextUrl.searchParams.get("region") ?? undefined
    const region = scopedRegion || queryRegion

    const status = req.nextUrl.searchParams.get("status") ?? undefined
    const requests = await prisma.fuelRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(region ? { site: { region } } : {}),
      },
      include: { site: true, technician: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(requests)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/fuel-requests")
  }
}

// POST /api/fuel-requests — create a new fuel request
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "SUPERVISOR", "TECHNICIAN"])

    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data;

    // Create the record with a placeholder number, then derive the display
    // number from the row's own DB-assigned autoincrement id (atomic).
    const request = await prisma.fuelRequest.create({
      data: {
        siteId: data.siteId,
        status: data.status ?? "PENDING_SUPERVISOR",
        priority: data.priority ?? null,
        literRequired: data.literRequired ?? null,
        technicianId: data.technicianId ?? null,
        notes: data.notes ?? null,
      },
    })

    const workRequestNumber = `REQ-${1000 + request.id}`
    const finalRequest = await prisma.fuelRequest.update({
      where: { id: request.id },
      data: { workRequestNumber }
    })

    return NextResponse.json(finalRequest, { status: 201 })
  } catch (e) {
    return apiErrorResponse(e, "POST /api/fuel-requests")
  }
}
