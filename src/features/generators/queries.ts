import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function getGenerators(
  region?: string, 
  page: number = 1, 
  limit: number = 5,
  sortBy: string = 'genId',
  sortOrder: 'asc' | 'desc' = 'asc',
  search?: string
) {
  const skip = (page - 1) * limit
  
  // Validate sortBy to prevent arbitrary SQL or Prisma field injection
  const ALLOWED_SORT = ['genId', 'capacityKVA', 'stdFuelConsumption', 'lastRunningHours', 'siteName', 'siteId'] as const;
  const safeSortBy = ALLOWED_SORT.includes(sortBy as any) ? sortBy : 'genId';

  // Map UI sort keys to Prisma fields if necessary
  let orderBy: Prisma.GeneratorOrderByWithRelationInput;
  if (safeSortBy === 'siteName') {
    orderBy = { site: { name: sortOrder } };
  } else if (safeSortBy === 'siteId') {
    orderBy = { site: { siteId: sortOrder } };
  } else {
    orderBy = { [safeSortBy]: sortOrder } as Prisma.GeneratorOrderByWithRelationInput;
  }

  const whereClause: Prisma.GeneratorWhereInput = {
    ...(region && { site: { region } }),
    ...(search && {
      OR: [
        { genId: { contains: search, mode: 'insensitive' } },
        { site: { name: { contains: search, mode: 'insensitive' } } },
        { site: { siteId: { contains: search, mode: 'insensitive' } } },
      ]
    })
  };

  const [generators, total, allGenerators] = await Promise.all([
    prisma.generator.findMany({
      where: whereClause,
      include: {
        site: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.generator.count({ where: whereClause }),
    prisma.generator.findMany({
      where: whereClause,
      select: {
        stdFuelConsumption: true,
      }
    })
  ])

  // Calculate summary stats from ALL generators
  const withConsumption = allGenerators.filter((g: any) => g.stdFuelConsumption && g.stdFuelConsumption > 0)
  const avgConsumption = withConsumption.length > 0
    ? withConsumption.reduce((s: number, g: any) => s + (g.stdFuelConsumption ?? 0), 0) / withConsumption.length
    : 0

  const highCount = allGenerators.filter((g: any) => (g.stdFuelConsumption ?? 0) > avgConsumption * 1.2).length
  const normalCount = allGenerators.filter((g: any) => {
    const c = g.stdFuelConsumption ?? 0
    return c > 0 && c <= avgConsumption * 1.2
  }).length
  const idleCount = allGenerators.filter((g: any) => !g.stdFuelConsumption || g.stdFuelConsumption === 0).length

  return { 
    generators, 
    total,
    stats: {
      avgConsumption,
      highCount,
      normalCount,
      idleCount
    }
  }
}
