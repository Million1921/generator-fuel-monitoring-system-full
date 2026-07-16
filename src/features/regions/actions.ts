"use server"

import prisma from "@/lib/db"
import { requireAbility } from "@/lib/auth"

export async function getRegions() {
  await requireAbility("read", "Site")
  return await prisma.region.findMany({
    orderBy: { name: 'asc' }
  })
}
