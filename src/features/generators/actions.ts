"use server"

import { revalidatePath } from "next/cache"
import { requireAbility } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/server-utils"
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
  await requireAbility("create", "Generator")

  const parsed = GeneratorSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid generator data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  try {
    // Wrap creation and display ID update in a transaction to prevent partial GEN-PENDING records.
    const finalGenerator = await prisma.$transaction(async (tx) => {
      const generator = await tx.generator.create({
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
      return await tx.generator.update({
        where: { id: generator.id },
        data: { genId: `GEN-${validated.siteId}-${generator.id}` },
      })
    })

    revalidatePath("/dashboard/generators")
    return finalGenerator
  } catch (error: any) {
    logger.error("createGenerator failed", { data, error: error?.message })
    throw new Error("Failed to create generator")
  }
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
  await requireAbility("update", "Generator")

  const parsed = GeneratorUpdateSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid generator data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  try {
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
  } catch (error: any) {
    logger.error("updateGenerator failed", { id, data, error: error?.message })
    throw new Error("Failed to update generator")
  }
}

export async function deleteGenerator(id: number) {
  await requireAbility("delete", "Generator")

  try {
    await prisma.generator.delete({ where: { id } })
    revalidatePath("/dashboard/generators")
    return { success: true }
  } catch (error: any) {
    logger.error("deleteGenerator failed", { id, error: error?.message })
    if (error?.code === "P2003" || error?.message?.includes("foreign key")) {
      throw new Error("Cannot delete generator: this generator is linked to dependent records (like fuel refills or requests).")
    }
    throw new Error("Failed to delete generator")
  }
}
