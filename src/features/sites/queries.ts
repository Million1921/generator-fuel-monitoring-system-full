import prisma from "@/lib/db"

export async function getAllSites() {
  return await prisma.site.findMany({
    orderBy: { siteId: 'asc' },
    select: { id: true, siteId: true, name: true }
  })
}

export async function getSitesWithLocation() {
  return await prisma.site.findMany({
    orderBy: { siteId: 'asc' },
    select: {
      id: true,
      siteId: true,
      name: true,
      region: true,
      gpsCoordinates: true,
      tankerCapacity: true,
      dgCapacity: true,
      dgType: true,
      generator: {
        select: {
          id: true,
          genId: true,
          model: true,
          capacity: true,
          capacityKVA: true,
          serialNumber: true,
          lastRunningHours: true,
        }
      }
    }
  })
}

export async function getSites(
  region?: string, 
  search?: string, 
  page: number = 1, 
  limit: number = 5,
  sortBy: string = 'siteId',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const skip = (page - 1) * limit

  const where = {
    AND: [
      region ? { region } : {},
      search ? {
        OR: [
          { siteId: { contains: search } },
          { name: { contains: search } },
        ]
      } : {}
    ]
  }

  const [sites, total] = await Promise.all([
    prisma.site.findMany({
      where,
      select: {
        id: true,
        siteId: true,
        name: true,
        region: true,
        tankerCapacity: true,
        gpsCoordinates: true,
        generator: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.site.count({ where })
  ])

  return { sites, total }
}
