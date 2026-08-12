import { FuelDeliveryHeader } from "@/features/fuel-requests/components/FuelDeliveryHeader"
import { RegionFilter } from "@/components/ui/RegionFilter"
import prisma from "@/lib/db"
import { FuelDeliveryTable } from "@/features/fuel-requests/components/FuelDeliveryTable"
import { getRoleFromClerk, getRegionScope } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function FuelDeliveryPage(props: { 
  searchParams: Promise<{ 
    search?: string; 
    page?: string;
    from?: string;
    to?: string;
    region?: string;
  }> 
}) {
  const searchParams = await props.searchParams;
  const search = searchParams.search;
  const role = await getRoleFromClerk();
  const regionScope = await getRegionScope(role);
  let region = regionScope ?? searchParams.region;
  if (region === "ALL" || region === "undefined" || region === "null" || region === "") {
    region = undefined;
  }
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const from = searchParams.from;
  const to = searchParams.to;
  
  const limit = 10;
  const skip = (page - 1) * limit;

  // Build Prisma Where Clause using AND to avoid site field conflicts
  const andConditions: any[] = []

  if (region) {
    andConditions.push({ site: { region } })
  }

  if (search) {
    andConditions.push({
      OR: [
        { site: { name: { contains: search, mode: 'insensitive' } } },
        { site: { siteId: { contains: search, mode: 'insensitive' } } },
        { driverName: { contains: search, mode: 'insensitive' } },
        { technicianName: { contains: search, mode: 'insensitive' } },
        { workOrderNumber: { contains: search, mode: 'insensitive' } },
      ]
    })
  }

  if (from || to) {
    const refillDate: any = {}
    if (from) refillDate.gte = new Date(from)
    if (to) refillDate.lte = new Date(to)
    andConditions.push({ refillDate })
  }

  const where: any = andConditions.length > 0 ? { AND: andConditions } : {}

  const [deliveries, total] = await Promise.all([
    prisma.fuelRefill.findMany({
      orderBy: { refillDate: 'desc' },
      where,
      include: { site: true, technician: true, fuelRequest: { include: { technician: true } } },
      skip,
      take: limit,
    }),
    prisma.fuelRefill.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex flex-1 flex-col px-6 pb-6 bg-gray-50/30 overflow-x-auto overflow-y-hidden">
        <div className="flex items-center justify-end z-10 relative">
          <FuelDeliveryHeader deliveries={deliveries} />
        </div>
        <FuelDeliveryTable 
          deliveries={deliveries}
          total={total}
          page={page}
          totalPages={totalPages}
          search={search}
          dateFrom={from}
          dateTo={to}
        />
    </div>
  )
}


