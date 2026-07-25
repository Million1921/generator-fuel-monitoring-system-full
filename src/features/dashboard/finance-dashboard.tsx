import Link from "next/link"
import { Building2, MapPin, DollarSign, Wallet, ArrowRight, Activity, TrendingUp } from "lucide-react"
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

async function getFinanceDashboardData(region?: string) {
  const fuelRequestFilter = region ? { site: { region } } : {}

  const [
    pendingFinance,
    pendingFinanceList,
    totalReleasedFunds
  ] = await Promise.all([
    prisma.fuelRequest.count({
      where: { status: "PENDING_FINANCE", ...fuelRequestFilter },
    }),
    prisma.fuelRequest.findMany({
      where: { status: "PENDING_FINANCE", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { submittedAt: "asc" },
      take: 10,
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "DEPOSIT" } // Only money deposited by Finance to Fuel Admin Wallet
    })
  ])

  return {
    pendingFinance,
    pendingFinanceList,
    totalReleasedFunds: totalReleasedFunds._sum.amount ?? 0
  }
}

export async function FinanceDashboard({ region }: { region?: string }) {
  const data = await getFinanceDashboardData(region)

  const statCards = [
    {
      title: "Pending Funding",
      value: data.pendingFinance,
      sub: "Work Orders awaiting funds",
      icon: DollarSign,
      color: "text-amber-500",
      bg: "bg-amber-50",
      delta: -3,
    },
    {
      title: "Total Funds Released",
      value: data.totalReleasedFunds,
      formatValue: (v: number | string) => typeof v === 'number' ? `${v.toLocaleString()} ETB` : `${v} ETB`,
      sub: "Total deposited to Fuel Admin",
      icon: Wallet,
      color: "text-lime-600",
      bg: "bg-lime-50",
      delta: 10,
    },
    {
      title: "Financial Activity",
      value: "Healthy" as string | number,
      sub: "System reconciliation status",
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Finance Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Review approved Work Orders and release funds for fuel purchase
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
            formatValue={card.formatValue}
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
            <DollarSign className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Work Orders Awaiting Funding</h3>
          </div>
          <Link href="/dashboard/fuel-request">
            <Button variant="ghost" size="sm" className="gap-1 text-amber-700 hover:text-amber-800">
              Review & Release Funds <ArrowRight className="h-4 w-4" />
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
              {data.pendingFinanceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                    No approved work orders awaiting funding.
                  </TableCell>
                </TableRow>
              ) : (
                data.pendingFinanceList.map((r) => (
                  <TableRow key={r.id} className="h-8">
                    <TableCell className="px-4 font-mono text-[13px] text-slate-500">{r.workOrderNumber || `REQ-${r.id}`}</TableCell>
                    <TableCell className="px-4 font-normal text-slate-900">{r.site.name}</TableCell>
                    <TableCell className="px-4 text-slate-600">{r.site.region ?? "-"}</TableCell>
                    <TableCell className="text-right px-4 text-slate-600">{r.literRequired ?? r.requestedAmount ?? "-"} L</TableCell>
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
