import Link from "next/link"
import { ClipboardCheck, Building2, Users, Zap, ArrowRight } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table"
import { priorityBadge } from "./components/priority-badge"
import { MetricCard } from "@/components/ui/metric-card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/db"
import { APP_CONFIG } from "@/lib/config"
import { RegionFilter } from "@/components/ui/RegionFilter"

async function getSupervisorDashboardData(region?: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const siteFilter = region ? { region } : {}
  const fuelRequestFilter = region ? { site: { region } } : {}
  const fuelRefillFilter = region ? { site: { region } } : {}
  const generatorFilter = region ? { site: { region } } : {}
  const technicianFilter = region ? { region: { name: region } } : {}

  const [
    pendingMyApproval,
    pendingApprovalList,
    totalSites,
    totalTechnicians,
    refueledThisMonthAgg,
    allGenerators,
  ] = await Promise.all([
    prisma.fuelRequest.count({
      where: { status: "PENDING_SUPERVISOR", ...fuelRequestFilter },
    }),
    prisma.fuelRequest.findMany({
      where: { status: "PENDING_SUPERVISOR", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { submittedAt: "asc" },
      take: 8,
    }),
    prisma.site.count({ where: siteFilter }),
    prisma.technician.count({ where: technicianFilter }),
    prisma.fuelRefill.aggregate({
      _sum: { fuelDelivered: true },
      where: { refillDate: { gte: startOfMonth }, ...fuelRefillFilter },
    }),
    prisma.generator.findMany({
      select: { stdFuelConsumption: true },
      where: { stdFuelConsumption: { gt: 0 }, ...generatorFilter },
    }),
  ])

  const avgConsumption = allGenerators.length > 0
    ? allGenerators.reduce((s, g) => s + (g.stdFuelConsumption ?? 0), 0) / allGenerators.length
    : 0

  const highConsumptionCount = await prisma.generator.count({
    where: {
      stdFuelConsumption: { gt: avgConsumption * APP_CONFIG.HIGH_CONSUMPTION_THRESHOLD_MULTIPLIER },
      ...generatorFilter,
    },
  })

  return {
    pendingMyApproval,
    pendingApprovalList,
    totalSites,
    totalTechnicians,
    refueledThisMonth: refueledThisMonthAgg._sum.fuelDelivered ?? 0,
    highConsumptionCount,
  }
}

function priorityBadge(priority: string | null) {
  const map: Record<string, string> = {
    EMERGENCY: "bg-red-50 text-red-700 border-red-200",
    URGENT: "bg-orange-50 text-orange-700 border-orange-200",
    HIGH: "bg-amber-50 text-amber-700 border-amber-200",
  }
  const cls = priority ? (map[priority] ?? "bg-slate-50 text-slate-700 border-slate-200") : "bg-slate-50 text-slate-700 border-slate-200"
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-tight ${cls}`}>
      {priority ?? "ROUTINE"}
    </span>
  )
}

export async function SupervisorDashboard({ region }: { region?: string }) {
  const data = await getSupervisorDashboardData(region)

  const statCards = [
    {
      title: "Pending My Approval",
      value: data.pendingMyApproval,
      sub: region ? `In ${region}` : "Across all regions",
      icon: ClipboardCheck,
      color: "text-amber-500",
      bg: "bg-amber-50",
      delta: 3,
    },
    {
      title: "Sites in View",
      value: data.totalSites,
      sub: region ? `Sites in ${region}` : "All monitored sites",
      icon: Building2,
      color: "text-lime-600",
      bg: "bg-lime-50",
    },
    {
      title: "Technicians",
      value: data.totalTechnicians,
      sub: region ? `Assigned to ${region}` : "All technicians",
      icon: Users,
      color: "text-lime-700",
      bg: "bg-lime-100/50",
    },
    {
      title: "High Consumption Alerts",
      value: data.highConsumptionCount,
      sub: "Generators above regional average",
      icon: Zap,
      color: "text-red-500",
      bg: "bg-red-50",
      delta: -1,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Regional Oversight</h2>
          <p className="text-sm text-muted-foreground">
            Fuel requests, sites, and technicians {region ? `in ${region}` : "across your regions"}
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
            sub={card.sub}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
            delta={card.delta}
          />
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
              <TableRow className=" h-8">
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Request #</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Technician</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Priority</TableHead>
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
                    <TableCell className="px-4">{priorityBadge(r.priority)}</TableCell>
                    <TableCell className="text-right px-4 text-slate-600">{r.literRequired ?? "-"} L</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
