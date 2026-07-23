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
      value: data.pendingFinance.toString(),
      sub: "Work Orders awaiting funds",
      icon: DollarSign,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Total Funds Released",
      value: `${data.totalReleasedFunds.toLocaleString()} ETB`,
      sub: "Total deposited to Fuel Admin",
      icon: Wallet,
      color: "text-lime-600",
      bg: "bg-lime-50",
    },
    {
      title: "Financial Activity",
      value: "Healthy",
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
          <div key={card.title} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)]">
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
