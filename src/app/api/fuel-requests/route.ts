export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import { requireAbility, getRegionScope } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createFuelRequest } from "@/features/fuel-requests/actions"

const PostSchema = z.object({
  siteId: z.coerce.string(),
  status: z.string().optional(),
  priority: z.string().optional().nullable(),
  literRequired: z.union([z.number(), z.string()]).optional().nullable(),
  technicianId: z.coerce.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  runningHour: z.coerce.number().optional().nullable(),
  securityName: z.string().optional(),
  route: z.string().optional(),
  driverName: z.string().optional(),
  driverType: z.string().optional(),
  driverPhone: z.string().optional(),
  employeeId: z.string().optional(),
})

// GET /api/fuel-requests — list all (optional ?region=, ?status=)
export async function GET(req: NextRequest) {
  try {
    const { role } = await requireAbility("read", "FuelRequest")
    const scopedRegion = await getRegionScope(role)
    const queryRegion = req.nextUrl.searchParams.get("region") ?? undefined
    let region = scopedRegion ?? queryRegion
    if (region === "ALL" || region === "" || region === "undefined" || region === "null") region = undefined

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
    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data;

    const finalRequest = await createFuelRequest({
      siteId: data.siteId,
      priority: data.priority || undefined,
      literRequired: data.literRequired || undefined,
      technicianId: data.technicianId || undefined,
      remark: data.notes || undefined,
      runningHour: data.runningHour || undefined,
      securityName: data.securityName || undefined,
      route: data.route || undefined,
      driverName: data.driverName || undefined,
      driverType: data.driverType || undefined,
      driverPhone: data.driverPhone || undefined,
      employeeId: data.employeeId || undefined,
    })

    return NextResponse.json(finalRequest, { status: 201 })
  } catch (e) {
    return apiErrorResponse(e, "POST /api/fuel-requests")
  }
}
