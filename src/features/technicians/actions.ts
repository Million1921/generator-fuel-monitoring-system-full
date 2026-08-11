"use server"

import { revalidatePath } from "next/cache"
import { requireAbility, getRegionScope } from "@/lib/auth"
import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"
import { logger } from "@/lib/server-utils"
import { z } from "zod"

export async function getTechnicians(
  region?: string, 
  page: number = 1, 
  limit: number = 5,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  search?: string
) {
  const { role } = await requireAbility("read", "Technician")
  const scopedRegion = await getRegionScope(role)
  region = scopedRegion || region

  const skip = (page - 1) * limit
  const where: any = {
    AND: [
      region ? { region: { name: region } } : {},
      search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      } : {}
    ]
  }

  // Validate sortBy to prevent arbitrary SQL or Prisma field injection
  const ALLOWED_SORT = ['name', 'email', 'phone', 'department', 'region'] as const;
  const safeSortBy = ALLOWED_SORT.includes(sortBy as any) ? sortBy : 'name';

  const [technicians, total] = await Promise.all([
    prisma.technician.findMany({
      where,
      include: {
        user: true,
        region: true,
      },
      orderBy: safeSortBy === 'region' 
        ? { region: { name: sortOrder } } 
        : ({ [safeSortBy]: sortOrder } as Prisma.TechnicianOrderByWithRelationInput),
      skip,
      take: limit,
    }),
    prisma.technician.count({ where })
  ])

  return { technicians, total }
}

const TechnicianSchema = z.object({
  name: z.string().min(1),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  regionId: z.string().optional(),
})

export async function createTechnician(data: {
  name: string
  department: string
  phone: string
  email: string
  regionId?: string
}) {
  await requireAbility("create", "Technician")

  const parsed = TechnicianSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid technician data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  try {
    let finalRegionId: number | null = null;
    if (validated.regionId) {
      const parsedInt = parseInt(validated.regionId);
      if (!isNaN(parsedInt)) {
        finalRegionId = parsedInt;
      } else {
        const regionRecord = await prisma.region.findUnique({
          where: { name: validated.regionId }
        });
        if (regionRecord) {
          finalRegionId = regionRecord.id;
        }
      }
    }

    const technician = await prisma.technician.create({
      data: {
        name: validated.name,
        department: validated.department,
        phone: validated.phone,
        email: validated.email,
        regionId: finalRegionId,
      }
    })
    revalidatePath("/dashboard/technicians")
    return technician
  } catch (error: any) {
    logger.error("createTechnician failed", { data, error: error?.message });
    throw new Error("Failed to create technician");
  }
}

export async function updateTechnician(id: number, data: {
  name: string
  department: string
  phone: string
  email: string
  regionId?: string
}) {
  await requireAbility("update", "Technician")

  const parsed = TechnicianSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid technician data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  try {
    let finalRegionId: number | null = null;
    if (validated.regionId) {
      const parsedInt = parseInt(validated.regionId);
      if (!isNaN(parsedInt)) {
        finalRegionId = parsedInt;
      } else {
        const regionRecord = await prisma.region.findUnique({
          where: { name: validated.regionId }
        });
        if (regionRecord) {
          finalRegionId = regionRecord.id;
        }
      }
    }

    const technician = await prisma.technician.update({
      where: { id },
      data: {
        name: validated.name,
        department: validated.department,
        phone: validated.phone,
        email: validated.email,
        regionId: finalRegionId,
      }
    })
    revalidatePath("/dashboard/technicians")
    return technician
  } catch (error: any) {
    logger.error("updateTechnician failed", { id, data, error: error?.message });
    throw new Error("Failed to update technician");
  }
}

export async function deleteTechnician(id: number) {
  await requireAbility("delete", "Technician")

  try {
    await prisma.technician.delete({ where: { id } })
    revalidatePath("/dashboard/technicians")
    return { success: true }
  } catch (error: any) {
    logger.error("deleteTechnician failed", { id, error: error?.message });
    if (error?.code === "P2003" || error?.message?.includes("foreign key")) {
      throw new Error("Cannot delete technician: this technician has linked fuel requests, refills, or transactions.");
    }
    throw new Error("Failed to delete technician");
  }
}

export async function completeTechnicianProfile(userId: string, data: { phone: string; department: string; regionId: number; employeeId: string; jobTitle: string; name: string }) {
  try {
    const technician = await prisma.technician.updateMany({
      where: { userId },
      data: {
        name: data.name,
        phone: data.phone,
        department: data.department,
        regionId: data.regionId,
        employeeId: data.employeeId,
        jobTitle: data.jobTitle,
      }
    });
    revalidatePath('/dashboard');
    return { success: true, technician };
  } catch (error: any) {
    logger.error("completeTechnicianProfile failed", { userId, error: error?.message });
    throw new Error("Failed to complete technician profile");
  }
}
