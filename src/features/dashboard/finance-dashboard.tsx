import Link from "next/link"
import { Building2, MapPin, DollarSign, Wallet, ArrowRight, Activity, TrendingUp, ShieldCheck, Truck } from "lucide-react"
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
import { RegionFilter } from "@/components/ui/RegionFilter"
import { MetricCard } from "@/components/ui/metric-card"

async function getFuelSupervisorData(region?: string) {
  const fuelRequestFilter = region ? { site: { region } } : {}

  const [
    pendingApproval,
    pendingApprovalList,
    totalApproved
  ] = await Promise.all([
    prisma.fuelRequest.count({
      where: { status: "PENDING_FUEL_SUPERVISOR", ...fuelRequestFilter },
    }),
    prisma.fuelRequest.findMany({
      where: { status: "PENDING_FUEL_SUPERVISOR", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { submittedAt: "asc" },
      take: 10,
    }),
    prisma.fuelRequest.count({
      where: { status: { in: ["PENDING_FUND_RELEASE_FL_MANAGER", "FUNDS_RELEASED_TO_FLEET_MANAGER", "FUNDS_RELEASED_TO_FLEET_ADMIN", "ASSIGNED_TO_TECH", "DELIVERED", "COMPLETED"] }, ...fuelRequestFilter },
    })
  ])

  return {
    pendingApproval,
    pendingApprovalList,
    totalApproved
  }
}

export async function FuelSupervisorDashboard({ region }: { region?: string }) {
  const data = await getFuelSupervisorData(region)

  const statCards = [
    {
      title: "Pending WO Approval",
      value: data.pendingApproval,
      sub: "Work Orders awaiting your approval",
      icon: <ShieldCheck />,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Total Approved",
      value: data.totalApproved,
      sub: "Work Orders you've processed",
      icon: <Activity />,
      color: "text-lime-600",
      bg: "bg-lime-50",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Fuel Supervisor Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve Work Orders before fund release
          </p>
        </div>
        <RegionFilter />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
        {statCards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            sub={card.sub}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
          />
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Work Orders Awaiting Approval</h3>
          </div>
          <Link href="/dashboard/fuel-request">
            <Button variant="ghost" size="sm" className="gap-1 text-amber-700 hover:text-amber-800">
              Review & Approve <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className=" h-8">
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Work Order #</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Region</TableHead>
                <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Requested Liters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pendingApprovalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                    No work orders awaiting your approval.
                  </TableCell>
                </TableRow>
              ) : (
                data.pendingApprovalList.map((r) => (
                  <TableRow key={r.id} className="h-8">
                    <TableCell className="px-4 font-mono text-[13px] text-slate-500">{r.workOrderNumber || `REQ-${r.id}`}</TableCell>
                    <TableCell className="px-4 font-normal text-slate-900">{r.site.name}</TableCell>
                    <TableCell className="px-4 text-slate-600">{r.site.region ?? "-"}</TableCell>
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

// --- F&L Country Manager Dashboard ---

async function getFLCountryManagerData(region?: string) {
  const fuelRequestFilter = region ? { site: { region } } : {}

  const [
    pendingRelease,
    pendingReleaseList,
    totalReleased
  ] = await Promise.all([
    prisma.fuelRequest.count({
      where: { status: "PENDING_FUND_RELEASE_FL_MANAGER", ...fuelRequestFilter },
    }),
    prisma.fuelRequest.findMany({
      where: { status: "PENDING_FUND_RELEASE_FL_MANAGER", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { submittedAt: "asc" },
      take: 10,
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "DEPOSIT" }
    })
  ])

  return {
    pendingRelease,
    pendingReleaseList,
    totalReleased: totalReleased._sum.amount ?? 0
  }
}

export async function FLCountryManagerDashboard({ region }: { region?: string }) {
  const data = await getFLCountryManagerData(region)

  const statCards = [
    {
      title: "Pending Fund Release",
      value: data.pendingRelease,
      sub: "Approved WOs awaiting fund release",
      icon: <DollarSign />,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Total Funds Released",
      value: data.totalReleased,
      valueSuffix: " ETB",
      sub: "Total funds released to Fleet Managers",
      icon: <Wallet />,
      color: "text-lime-600",
      bg: "bg-lime-50",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">F&L Country Manager Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Release funds to Fleet Managers for approved Work Orders
          </p>
        </div>
        <RegionFilter />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
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
          />
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Approved WOs Awaiting Fund Release</h3>
          </div>
          <Link href="/dashboard/fuel-request">
            <Button variant="ghost" size="sm" className="gap-1 text-amber-700 hover:text-amber-800">
              Review & Release <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className=" h-8">
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Work Order #</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Region</TableHead>
                <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Requested Liters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pendingReleaseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                    No approved work orders awaiting fund release.
                  </TableCell>
                </TableRow>
              ) : (
                data.pendingReleaseList.map((r) => (
                  <TableRow key={r.id} className="h-8">
                    <TableCell className="px-4 font-mono text-[13px] text-slate-500">{r.workOrderNumber || `REQ-${r.id}`}</TableCell>
                    <TableCell className="px-4 font-normal text-slate-900">{r.site.name}</TableCell>
                    <TableCell className="px-4 text-slate-600">{r.site.region ?? "-"}</TableCell>
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

// --- Fleet Manager Dashboard ---

async function getFleetManagerData(region?: string) {
  const fuelRequestFilter = region ? { site: { region } } : {}

  const [
    pendingRelease,
    pendingReleaseList,
    totalReleased
  ] = await Promise.all([
    prisma.fuelRequest.count({
      where: { status: "FUNDS_RELEASED_TO_FLEET_MANAGER", ...fuelRequestFilter },
    }),
    prisma.fuelRequest.findMany({
      where: { status: "FUNDS_RELEASED_TO_FLEET_MANAGER", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "DEPOSIT" }
    })
  ])

  return {
    pendingRelease,
    pendingReleaseList,
    totalReleased: totalReleased._sum.amount ?? 0
  }
}

export async function FleetManagerDashboard({ region }: { region?: string }) {
  const data = await getFleetManagerData(region)

  const statCards = [
    {
      title: "Funds Received",
      value: data.pendingRelease,
      sub: "Funds to release to Fleet Admin",
      icon: <DollarSign />,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Total Released",
      value: data.totalReleased,
      valueSuffix: " ETB",
      sub: "Total funds released to Fleet Admins",
      icon: <Wallet />,
      color: "text-lime-600",
      bg: "bg-lime-50",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Fleet Manager Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Release funds to Fleet Admins for fuel purchase
          </p>
        </div>
        <RegionFilter />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
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
          />
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-blue-500" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Funds to Release to Fleet Admin</h3>
          </div>
          <Link href="/dashboard/fuel-request">
            <Button variant="ghost" size="sm" className="gap-1 text-blue-700 hover:text-blue-800">
              Review & Release <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className=" h-8">
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Work Order #</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Region</TableHead>
                <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Requested Liters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pendingReleaseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                    No funds to release at this time.
                  </TableCell>
                </TableRow>
              ) : (
                data.pendingReleaseList.map((r) => (
                  <TableRow key={r.id} className="h-8">
                    <TableCell className="px-4 font-mono text-[13px] text-slate-500">{r.workOrderNumber || `REQ-${r.id}`}</TableCell>
                    <TableCell className="px-4 font-normal text-slate-900">{r.site.name}</TableCell>
                    <TableCell className="px-4 text-slate-600">{r.site.region ?? "-"}</TableCell>
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

// Keep backward-compatible export for existing imports
export { FuelSupervisorDashboard as FinanceDashboard }
