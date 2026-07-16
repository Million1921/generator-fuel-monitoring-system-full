import Link from "next/link"
import { Fuel, Building2, MapPin, TrendingUp, Zap, ClipboardCheck, ArrowRight } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table"
import prisma from "@/lib/db"
import { ConsumptionChart } from "@/features/analytics/components/ConsumptionChart"
import { APP_CONFIG } from "@/lib/config"
import { Pagination } from "@/components/ui/Pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RegionFilter } from "@/components/ui/RegionFilter"

async function getManagerDashboardData(region?: string, topSitesPage: number = 1) {
  const topSitesLimit = 10
  const skip = (topSitesPage - 1) * topSitesLimit

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const siteFilter = region ? { region } : {}
  const fuelRequestFilter = region ? { site: { region } } : {}
  const fuelRefillFilter = region ? { site: { region } } : {}
  const generatorFilter = region ? { site: { region } } : {}

  const totalSites = await prisma.site.count({ where: siteFilter })

  const regionsRaw = await prisma.site.findMany({
    select: { region: true },
    distinct: ['region'],
    where: siteFilter,
  })
  const totalRegions = regionsRaw.filter(r => r.region).length

  const refueledThisMonthAgg = await prisma.fuelRefill.aggregate({
    _sum: { fuelDelivered: true },
    where: {
      refillDate: { gte: startOfMonth },
      ...fuelRefillFilter,
    },
  })
  const refueledThisMonth = refueledThisMonthAgg._sum.fuelDelivered ?? 0

  const pendingMyApproval = await prisma.fuelRequest.count({
    where: {
      status: "PENDING_MANAGER",
      ...fuelRequestFilter,
    },
  })

  const pendingApprovalList = await prisma.fuelRequest.findMany({
    where: {
      status: "PENDING_MANAGER",
      ...fuelRequestFilter,
    },
    include: { site: true, technician: true },
    orderBy: { submittedAt: "asc" },
    take: 8,
  })

  const allGenerators = await prisma.generator.findMany({
    select: { stdFuelConsumption: true },
    where: {
      stdFuelConsumption: { gt: 0 },
      ...generatorFilter,
    },
  })
  const avgConsumption = allGenerators.length > 0
    ? allGenerators.reduce((s, g) => s + (g.stdFuelConsumption ?? 0), 0) / allGenerators.length
    : 0

  const highConsumptionCount = await prisma.generator.count({
    where: {
      stdFuelConsumption: { gt: avgConsumption * APP_CONFIG.HIGH_CONSUMPTION_THRESHOLD_MULTIPLIER },
      ...generatorFilter,
    },
  })

  const topSitesRaw = await prisma.fuelRefill.groupBy({
    by: ['siteId'],
    _count: { id: true },
    _sum: { fuelDelivered: true },
    where: {
      ...fuelRefillFilter,
    },
    orderBy: { _count: { id: 'desc' } },
    take: topSitesLimit,
    skip: skip,
  })

  const totalTopSitesGroups = await prisma.fuelRefill.groupBy({
    by: ['siteId'],
    where: {
      ...fuelRefillFilter,
    },
  })
  const totalTopSites = totalTopSitesGroups.length
  const topSitesTotalPages = Math.ceil(totalTopSites / topSitesLimit)

  const topSiteIds = topSitesRaw.map(r => r.siteId)
  const topSiteDetails = await prisma.site.findMany({
    where: {
      id: { in: topSiteIds },
      ...siteFilter,
    },
    select: { id: true, siteId: true, name: true, region: true },
  })

  const topSites = topSitesRaw.map(r => {
    const site = topSiteDetails.find(s => s.id === r.siteId)
    return {
      siteId: site?.siteId ?? '-',
      name: site?.name ?? 'Unknown',
      region: site?.region ?? '-',
      requestCount: r._count.id,
      totalFueled: r._sum.fuelDelivered ?? 0,
    }
  })

  const monthlyTrend: { month: string, liters: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const monthlySum = await prisma.fuelRefill.aggregate({
      _sum: { fuelDelivered: true },
      where: {
        refillDate: { gte: monthStart, lte: monthEnd },
        ...fuelRefillFilter,
      },
    })

    monthlyTrend.push({
      month: d.toLocaleString('default', { month: 'short' }),
      liters: monthlySum._sum.fuelDelivered ?? 0,
    })
  }

  return {
    totalSites,
    totalRegions,
    refueledThisMonth,
    pendingMyApproval,
    pendingApprovalList,
    highConsumptionCount,
    avgConsumption,
    topSites,
    topSitesTotal: totalTopSites,
    topSitesTotalPages,
    monthlyTrend,
  }
}

export async function ManagerDashboard({ region, topSitesPage }: { region?: string, topSitesPage: number }) {
  const data = await getManagerDashboardData(region, topSitesPage)

  const statCards = [
    {
      title: "Total Sites",
      value: data.totalSites.toString(),
      sub: "Monitored generator sites",
      icon: Building2,
      color: "text-lime-600",
      bg: "bg-lime-50 dark:bg-lime-900/20",
    },
    {
      title: "Total Regions",
      value: data.totalRegions.toString(),
      sub: "Coverage regions",
      icon: MapPin,
      color: "text-lime-700",
      bg: "bg-lime-100/50 dark:bg-lime-900/30",
    },
    {
      title: "Refueled This Month",
      value: `${data.refueledThisMonth.toLocaleString()} L`,
      sub: "Liters delivered (completed)",
      icon: Fuel,
      color: "text-lime-500",
      bg: "bg-lime-50 dark:bg-blue-950",
    },
    {
      title: "Pending My Approval",
      value: data.pendingMyApproval.toString(),
      sub: "Requests awaiting manager approval",
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "High Consumption Generators",
      value: data.highConsumptionCount.toString(),
      sub: `Above avg ${data.avgConsumption.toFixed(1)} L/hr`,
      icon: Zap,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Manager Overview</h2>
          <p className="text-sm text-muted-foreground">Regional performance, approvals, and fuel accountability summary</p>
        </div>
        <RegionFilter />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.title} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)]">
            {/* Decorative background glow */}
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-30 blur-2xl transition-all duration-300 group-hover:scale-150 group-hover:opacity-50 ${card.bg}`} />
            
            <div className="flex flex-row items-center justify-between pb-4 relative z-10">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{card.title}</h3>
              <div className={`rounded-xl p-3 ${card.bg} ring-4 ring-white shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                <card.icon className={`h-5 w-5 ${card.color}`} strokeWidth={2.5} />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-black tracking-tight text-gray-900">{card.value}</div>
              <p className="mt-2 text-xs font-medium text-gray-500 line-clamp-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-lime-600" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Requests Awaiting Your Approval</h3>
          </div>
          <Link href="/dashboard/fuel-request">
            <Button variant="ghost" size="sm" className="gap-1 text-lime-700 hover:text-lime-800">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Request #</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Technician</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Region</TableHead>
                <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Liters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pendingApprovalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                    No requests are currently awaiting your approval.
                  </TableCell>
                </TableRow>
              ) : (
                data.pendingApprovalList.map((r) => (
                  <TableRow key={r.id} className="h-8">
                    <TableCell className="px-4 font-mono text-[13px] text-slate-500">{r.workRequestNumber ?? "-"}</TableCell>
                    <TableCell className="px-4 font-normal text-slate-900">{r.site.name}</TableCell>
                    <TableCell className="px-4 text-slate-600">{r.technician?.name ?? "Unassigned"}</TableCell>
                    <TableCell className="px-4 text-slate-600">{r.site.region ?? "-"}</TableCell>
                    <TableCell className="text-right px-4 text-slate-600">{r.literRequired ?? "-"} L</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-4">
        <ConsumptionChart data={data.monthlyTrend} />
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b px-5 py-4 bg-white">
            <TrendingUp className="h-6 w-6 text-lime-600" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Frequently Fueled Sites</h3>
          </div>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-white sticky top-0 z-10 border-b border-gray-200">
                <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
                  <TableHead className="px-4 font-bold text-slate-900 text-[13px] uppercase tracking-tight">Site Name</TableHead>
                  <TableHead className="px-4 font-bold text-slate-900 text-[13px] uppercase tracking-tight">Site ID</TableHead>
                  <TableHead className="px-4 font-bold text-slate-900 text-[13px] uppercase tracking-tight">Region</TableHead>
                  <TableHead className="text-right px-4 font-bold text-slate-900 text-[13px] uppercase tracking-tight">Deliveries</TableHead>
                  <TableHead className="text-right px-4 font-bold text-slate-900 text-[13px] uppercase tracking-tight">Total Fuel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                      No completed deliveries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topSites.map((site) => (
                    <TableRow key={site.siteId} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-8">
                      <TableCell className="font-normal text-slate-900 px-4">{site.name}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-[13px] px-4">{site.siteId}</TableCell>
                      <TableCell className="text-slate-500 px-4">{site.region}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700 px-4">{site.requestCount}x</TableCell>
                      <TableCell className="text-right font-normal text-slate-600 px-4">{site.totalFueled.toLocaleString()} L</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-400 bg-white px-4 py-1.5 sm:px-6">
            <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
              <span className="hidden sm:inline-block font-bold">{data.topSitesTotal} total sites</span>
              <span className="hidden sm:inline-block">|</span>
              <div className="flex items-center gap-2">
                <span>Go to:</span>
                <form action="" method="get" className="flex items-center gap-2">
                  {region && <input type="hidden" name="region" value={region} />}
                  <Input
                    name="page"
                    type="number"
                    defaultValue={topSitesPage}
                    className="h-7 w-12 text-center font-bold bg-gray-50 border-gray-200 p-0 focus-visible:ring-1 focus-visible:ring-lime-500 shadow-none"
                  />
                </form>
              </div>
            </div>
            <Pagination totalPages={data.topSitesTotalPages} currentPage={topSitesPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
