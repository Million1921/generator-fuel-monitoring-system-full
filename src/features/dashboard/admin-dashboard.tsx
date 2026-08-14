import Link from "next/link"
import { Building2, MapPin, Users, Fuel, Zap, ShieldCheck, Wallet, ArrowRight } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/db"
import { APP_CONFIG } from "@/lib/config"
import { RegionFilter } from "@/components/ui/RegionFilter"
import { MetricCard } from "@/components/ui/metric-card"

async function getAdminDashboardData(region?: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const siteFilter = region ? { region } : {}
  const fuelRequestFilter = region ? { site: { region } } : {}
  const fuelRefillFilter = region ? { site: { region } } : {}
  const generatorFilter = region ? { site: { region } } : {}
  const technicianFilter = region ? { region: { name: region } } : {}
  const transactionFilter = region ? { site: { region } } : {}

  const [
    totalSites,
    regionsRaw,
    totalTechnicians,
    pendingFinalApproval,
    finalApprovalList,
    refueledThisMonthAgg,
    allGenerators,
    transactionsThisMonthAgg,
    transactionsThisMonthCount,
  ] = await Promise.all([
    prisma.site.count({ where: siteFilter }),
    prisma.site.findMany({ select: { region: true }, distinct: ["region"], where: siteFilter }),
    prisma.technician.count({ where: technicianFilter }),
    prisma.fuelRequest.count({ where: { status: "PENDING_ADMIN", ...fuelRequestFilter } }),
    prisma.fuelRequest.findMany({
      where: { status: "PENDING_ADMIN", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { submittedAt: "asc" },
      take: 8,
    }),
    prisma.fuelRefill.aggregate({
      _sum: { fuelDelivered: true },
      where: { refillDate: { gte: startOfMonth }, ...fuelRefillFilter },
    }),
    prisma.generator.findMany({
      select: { stdFuelConsumption: true },
      where: { stdFuelConsumption: { gt: 0 }, ...generatorFilter },
    }),
    prisma.transaction.aggregate({
      _sum: { paidAmount: true },
      where: { createdAt: { gte: startOfMonth }, ...transactionFilter },
    }),
    prisma.transaction.count({
      where: { createdAt: { gte: startOfMonth }, ...transactionFilter },
    }),
  ])

  const totalRegions = regionsRaw.filter((r) => r.region).length

  const avgConsumption = allGenerators.length > 0
    ? allGenerators.reduce((s, g) => s + (g.stdFuelConsumption ?? 0), 0) / allGenerators.length
    : 0

  const highConsumptionCount = await prisma.generator.count({
    where: {
      stdFuelConsumption: { gt: avgConsumption * APP_CONFIG.HIGH_CONSUMPTION_THRESHOLD_MULTIPLIER },
      ...generatorFilter,
    },
  })

  const monthlyTrend: { month: string; liters: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const monthlySum = await prisma.fuelRefill.aggregate({
      _sum: { fuelDelivered: true },
      where: { refillDate: { gte: monthStart, lte: monthEnd }, ...fuelRefillFilter },
    })

    monthlyTrend.push({
      month: d.toLocaleString("default", { month: "short" }),
      liters: monthlySum._sum.fuelDelivered ?? 0,
    })
  }

  return {
    totalSites,
    totalRegions,
    totalTechnicians,
    pendingFinalApproval,
    finalApprovalList,
    refueledThisMonth: refueledThisMonthAgg._sum.fuelDelivered ?? 0,
    highConsumptionCount,
    paidThisMonth: transactionsThisMonthAgg._sum.paidAmount ?? 0,
    transactionsThisMonthCount,
    monthlyTrend,
  }
}

export async function AdminDashboard({ region }: { region?: string }) {
  const data = await getAdminDashboardData(region)

  const statCards = [
    {
      title: "Total Sites",
      value: data.totalSites,
      sub: "Monitored generator sites",
      icon: <Building2 />,
      color: "text-lime-600",
      bg: "bg-lime-50",
      delta: 4, // placeholder trend
    },
    {
      title: "Total Regions",
      value: data.totalRegions,
      sub: "Coverage regions",
      icon: <MapPin />,
      color: "text-lime-700",
      bg: "bg-lime-100/50",
    },
    {
      title: "Total Technicians",
      value: data.totalTechnicians,
      sub: "Registered field staff",
      icon: <Users />,
      color: "text-lime-600",
      bg: "bg-lime-50",
      delta: 12,
    },
    {
      title: "Pending Final Approval",
      value: data.pendingFinalApproval,
      sub: "Requests awaiting admin sign-off",
      icon: <ShieldCheck />,
      color: "text-amber-500",
      bg: "bg-amber-50",
      delta: -2,
    },
    {
      title: "Paid This Month",
      value: data.paidThisMonth,
      valueSuffix: " ETB",
      sub: `${data.transactionsThisMonthCount} transactions logged`,
      icon: <Wallet />,
      color: "text-lime-700",
      bg: "bg-lime-100/50",
      delta: 8,
    },
    {
      title: "High Consumption Alerts",
      value: data.highConsumptionCount,
      sub: "Generators above average",
      icon: <Zap />,
      color: "text-red-500",
      bg: "bg-red-50",
      sparklineData: data.monthlyTrend,
      sparklineKey: "liters",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">System Administration</h2>
          <p className="text-sm text-muted-foreground">
            Company-wide accountability, final approvals, and financial reconciliation
          </p>
        </div>
        <RegionFilter />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            valueSuffix={card.valueSuffix}
            sub={card.sub}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
            delta={card.delta}
            sparklineData={card.sparklineData}
            sparklineKey={card.sparklineKey}
          />
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-lime-600" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Awaiting Final Admin Approval</h3>
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
              <TableRow className=" h-8">
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Request #</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Technician</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Region</TableHead>
                <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Liters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.finalApprovalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                    No requests are currently awaiting final approval.
                  </TableCell>
                </TableRow>
              ) : (
                data.finalApprovalList.map((r) => (
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
    </div>
  )
}

