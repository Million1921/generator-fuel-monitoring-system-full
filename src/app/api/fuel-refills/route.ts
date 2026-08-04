export const dynamic = "force-dynamic";
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { requireAbility, getRegionScope } from "@/lib/auth"
import { apiErrorResponse } from "@/lib/server-utils"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const PostSchema = z.object({
  siteId: z.coerce.number().int().positive(),
  fuelDelivered: z.coerce.number().positive(),
  beforeLevel: z.coerce.number().nonnegative(),
  afterLevel: z.coerce.number().nonnegative(),
  beforeHours: z.coerce.number().nonnegative(),
  afterHours: z.coerce.number().nonnegative(),
  refillDate: z.coerce.date().optional(),
  technicianId: z.coerce.number().int().positive().optional().nullable(),
  tankerVehicle: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
}).refine((data) => data.afterHours >= data.beforeHours, {
  message: "afterHours cannot be less than beforeHours",
  path: ["afterHours"],
})

// GET /api/fuel-refills — list all refills (optional ?siteId=, ?technicianId=)
export async function GET(req: NextRequest) {
  try {
    const { role } = await requireAbility("read", "FuelRefill")
    const scopedRegion = await getRegionScope(role)
    const siteIdParam = req.nextUrl.searchParams.get("siteId")
    const technicianIdParam = req.nextUrl.searchParams.get("technicianId")

    const siteId = siteIdParam ? parseInt(siteIdParam) : undefined
    const technicianId = technicianIdParam ? parseInt(technicianIdParam) : undefined
    if ((siteIdParam && isNaN(siteId!)) || (technicianIdParam && isNaN(technicianId!))) {
      return NextResponse.json({ error: "Invalid query params" }, { status: 400 })
    }

    const refills = await prisma.fuelRefill.findMany({
      where: {
        ...(siteId ? { siteId } : {}),
        ...(technicianId ? { technicianId } : {}),
        ...(scopedRegion ? { site: { region: scopedRegion } } : {}),
      },
      include: { site: true, technician: true },
      orderBy: { refillDate: "desc" },
    })
    return NextResponse.json(refills)
  } catch (e) {
    return apiErrorResponse(e, "GET /api/fuel-refills")
  }
}

// POST /api/fuel-refills — record a new refill and update generator's lastRunningHours
export async function POST(req: NextRequest) {
  try {
    await requireAbility("create", "FuelRefill")

    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const data = parsed.data

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create the refill record
      const refill = await tx.fuelRefill.create({
        data: {
          fuelDelivered: data.fuelDelivered,
          beforeLevel: data.beforeLevel,
          afterLevel: data.afterLevel,
          beforeHours: data.beforeHours,
          afterHours: data.afterHours,
          refillDate: data.refillDate ?? new Date(),
          siteId: data.siteId,
          technicianId: data.technicianId ?? null,
          tankerVehicle: data.tankerVehicle ?? null,
          driverName: data.driverName ?? null,
        },
      })

      // 2. Update the generator's last running hours for that site
      await tx.generator.update({
        where: { siteId: data.siteId },
        data: { lastRunningHours: data.afterHours },
      })

      return refill
    })

    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    return apiErrorResponse(e, "POST /api/fuel-refills")
  }
}
