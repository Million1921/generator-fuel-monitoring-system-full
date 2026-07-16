"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const GeneratorSchema = z.object({
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  capacityKVA: z.coerce.number().nonnegative(),
  stdFuelConsumption: z.coerce.number().nonnegative(),
  lastRunningHours: z.coerce.number().nonnegative(),
  siteId: z.coerce.number().int().positive(),
})

export async function createGenerator(data: {
  model: string
  serialNumber: string
  capacityKVA: string
  stdFuelConsumption: string
  lastRunningHours: string
  siteId: string
}) {
  await requireRole(["ADMIN", "MANAGER"])

  const parsed = GeneratorSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid generator data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  // Create with a placeholder genId, then derive the display id from the
  // row's own DB-assigned autoincrement id (atomic, no count() race).
  const generator = await prisma.generator.create({
    data: {
      genId: `GEN-PENDING-${Date.now()}`,
      model: validated.model,
      serialNumber: validated.serialNumber,
      capacityKVA: validated.capacityKVA,
      stdFuelConsumption: validated.stdFuelConsumption,
      lastRunningHours: validated.lastRunningHours,
      siteId: validated.siteId,
    }
  })
  const finalGenerator = await prisma.generator.update({
    where: { id: generator.id },
    data: { genId: `GEN-${validated.siteId}-${generator.id}` },
  })
  revalidatePath("/dashboard/generators")
  return finalGenerator
}

const GeneratorUpdateSchema = z.object({
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  capacityKVA: z.coerce.number().nonnegative().optional(),
  stdFuelConsumption: z.coerce.number().nonnegative().optional(),
  lastRunningHours: z.coerce.number().nonnegative().optional(),
})

export async function updateGenerator(id: number, data: {
  model?: string
  serialNumber?: string
  capacityKVA?: string
  stdFuelConsumption?: string
  lastRunningHours?: string
}) {
  await requireRole(["ADMIN", "MANAGER"])

  const parsed = GeneratorUpdateSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid generator data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  const generator = await prisma.generator.update({
    where: { id },
    data: {
      model: validated.model,
      serialNumber: validated.serialNumber,
      capacityKVA: validated.capacityKVA,
      stdFuelConsumption: validated.stdFuelConsumption,
      lastRunningHours: validated.lastRunningHours,
    }
  })
  revalidatePath("/dashboard/generators")
  return generator
}

export async function deleteGenerator(id: number) {
  await requireRole(["ADMIN", "MANAGER"])

  await prisma.generator.delete({ where: { id } })
  revalidatePath("/dashboard/generators")
  return { success: true }
}
