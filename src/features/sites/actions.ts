"use server"

import { revalidatePath } from "next/cache"
import { requireRole, requireAbility, getRegionScope } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

export async function getSites(region?: string) {
  const { role } = await requireAbility("read", "Site")
  const scopedRegion = await getRegionScope(role)
  const effectiveRegion = scopedRegion || region
  return await prisma.site.findMany({
    where: effectiveRegion ? { region: effectiveRegion } : undefined,
    orderBy: { siteId: 'asc' }
  })
}

const SiteSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  region: z.string().optional(),
  tankerCapacity: z.coerce.number().nonnegative(),
  dgCapacity: z.string().optional(),
  dgType: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  regionId: z.string().optional(),
})

export async function createSite(data: { siteId: string; name: string; region: string; tankerCapacity: string; dgCapacity?: string; dgType?: string; gpsCoordinates?: string; regionId?: string }) {
  await requireRole(["ADMIN", "MANAGER"])

  const parsed = SiteSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid site data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  let actualRegionId = validated.regionId ? parseInt(validated.regionId) : undefined;
  if (actualRegionId !== undefined && isNaN(actualRegionId)) actualRegionId = undefined;

  if (!actualRegionId && validated.region) {
    const regionRecord = await prisma.region.findUnique({
      where: { name: validated.region }
    });
    if (regionRecord) {
      actualRegionId = regionRecord.id;
    }
  }

  const site = await prisma.site.create({
    data: {
      siteId: validated.siteId,
      name: validated.name,
      region: validated.region,
      tankerCapacity: validated.tankerCapacity,
      dgCapacity: validated.dgCapacity,
      dgType: validated.dgType,
      gpsCoordinates: validated.gpsCoordinates,
      regionId: actualRegionId,
    }
  })
  revalidatePath("/dashboard/sites")
  return site
}

export async function updateSite(id: number, data: { siteId: string; name: string; region: string; tankerCapacity: string; dgCapacity?: string; dgType?: string; gpsCoordinates?: string; regionId?: string }) {
  await requireRole(["ADMIN", "MANAGER"])

  const parsed = SiteSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid site data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  let actualRegionId = validated.regionId ? parseInt(validated.regionId) : undefined;
  if (actualRegionId !== undefined && isNaN(actualRegionId)) actualRegionId = undefined;

  if (!actualRegionId && validated.region) {
    const regionRecord = await prisma.region.findUnique({
      where: { name: validated.region }
    });
    if (regionRecord) {
      actualRegionId = regionRecord.id;
    }
  }

  const site = await prisma.site.update({
    where: { id },
    data: {
      siteId: validated.siteId,
      name: validated.name,
      region: validated.region,
      tankerCapacity: validated.tankerCapacity,
      dgCapacity: validated.dgCapacity,
      dgType: validated.dgType,
      gpsCoordinates: validated.gpsCoordinates,
      regionId: actualRegionId,
    }
  })
  revalidatePath("/dashboard/sites")
  return site
}

export async function deleteSite(id: number) {
  await requireRole(["ADMIN", "MANAGER"])

  await prisma.site.delete({ where: { id } })
  revalidatePath("/dashboard/sites")
}
