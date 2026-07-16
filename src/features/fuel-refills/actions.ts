"use server"

import { revalidatePath } from "next/cache"
import { requireRole, requireAbility, getRegionScope } from "@/lib/auth"
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

const FuelRefillSchema = z.object({
  siteId: z.coerce.number().int().positive(),
  fuelDelivered: z.coerce.number().positive(),
  beforeLevel: z.coerce.number().nonnegative(),
  afterLevel: z.coerce.number().nonnegative(),
  beforeHours: z.coerce.number().nonnegative(),
  afterHours: z.coerce.number().nonnegative(),
  tankerVehicle: z.string().optional(),
  driverName: z.string().optional(),
  technicianId: z.coerce.number().int().positive().optional(),
}).refine((data) => data.afterHours >= data.beforeHours, {
  message: "afterHours cannot be less than beforeHours",
  path: ["afterHours"],
})

export async function createFuelRefill(data: {
  siteId: number;
  fuelDelivered: number;
  beforeLevel: number;
  afterLevel: number;
  beforeHours: number;
  afterHours: number;
  tankerVehicle?: string;
  driverName?: string;
  technicianId?: number;
}) {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR", "TECHNICIAN"])

  const parsed = FuelRefillSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid fuel refill data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  const refill = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const refill = await tx.fuelRefill.create({
      data: {
        siteId: validated.siteId,
        fuelDelivered: validated.fuelDelivered,
        beforeLevel: validated.beforeLevel,
        afterLevel: validated.afterLevel,
        beforeHours: validated.beforeHours,
        afterHours: validated.afterHours,
        tankerVehicle: validated.tankerVehicle,
        driverName: validated.driverName,
        technicianId: validated.technicianId,
      }
    });

    await tx.generator.update({
      where: { siteId: validated.siteId },
      data: { lastRunningHours: validated.afterHours }
    });

    return refill;
  });

  revalidatePath("/dashboard/fuel-journal");
  revalidatePath("/dashboard/analytical-report");
  revalidatePath("/dashboard/fuel-refill");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return refill;
}

export async function getFuelRefills(
  region?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'refillDate',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const { role } = await requireAbility("read", "FuelRefill")
  const scopedRegion = await getRegionScope(role)
  region = scopedRegion || region

  const skip = (page - 1) * limit;
  const where = region ? { site: { region } } : undefined;

  let orderBy: any = { [sortBy]: sortOrder };
  if (sortBy === 'siteId' || sortBy === 'siteName') {
    orderBy = { site: { [sortBy === 'siteId' ? 'siteId' : 'name']: sortOrder } };
  }

  const [data, total] = await Promise.all([
    prisma.fuelRefill.findMany({
      where,
      include: {
        site: true,
        technician: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.fuelRefill.count({ where })
  ]);

  return { data, total };
}
