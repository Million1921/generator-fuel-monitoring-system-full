import Link from "next/link"
import { Fuel, ClipboardCheck, Wallet, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react"
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

async function getFuelAdminData(userId: string, region?: string) {
  const fuelRequestFilter = region ? { site: { region } } : {}

  const wallet = await prisma.fuelAdminWallet.findUnique({
    where: { userId }
  })
  
  const balance = wallet?.balance ?? 0

  const [
    approvedRequests,
    fundedRequests,
    deliveredRequests
  ] = await Promise.all([
    prisma.fuelRequest.findMany({
      where: { status: "APPROVED_REQUEST", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { submittedAt: "asc" },
      take: 8,
    }),
    prisma.fuelRequest.findMany({
      where: { status: "FUNDS_RELEASED", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.fuelRequest.findMany({
      where: { status: "DELIVERED", ...fuelRequestFilter },
      include: { site: true, technician: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    })
  ])

  return {
    balance,
    approvedRequests,
    fundedRequests,
    deliveredRequests
  }
}

export async function FuelAdminDashboard({ userId, region }: { userId: string, region?: string }) {
  const data = await getFuelAdminData(userId, region)

  const statCards = [
    {
      title: "Available Funds",
      value: data.balance,
      formatValue: (v: number | string) => typeof v === 'number' ? `${v.toLocaleString()} ETB` : `${v} ETB`,
      sub: "Current Wallet Balance",
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Approved Requests",
      value: data.approvedRequests.length,
      sub: "Needs Work Order Creation",
      icon: ClipboardCheck,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Funded Orders",
      value: data.fundedRequests.length,
      sub: "Ready for Fuel Purchase",
      icon: Fuel,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Deliveries to Verify",
      value: data.deliveredRequests.length,
      sub: "Awaiting final completion",
      icon: CheckCircle2,
      color: "text-lime-600",
      bg: "bg-lime-50",
    },
  ]

  const renderTable = (list: any[], emptyMsg: string) => (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow className=" h-8">
            <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">ID</TableHead>
            <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
            <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Region</TableHead>
            <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Liters</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                {emptyMsg}
              </TableCell>
            </TableRow>
          ) : (
            list.map((r) => (
              <TableRow key={r.id} className="h-8">
                <TableCell className="px-4 font-mono text-[13px] text-slate-500">{r.workOrderNumber || r.workRequestNumber || `REQ-${r.id}`}</TableCell>
                <TableCell className="px-4 font-normal text-slate-900">{r.site.name}</TableCell>
                <TableCell className="px-4 text-slate-600">{r.site.region ?? "-"}</TableCell>
                <TableCell className="text-right px-4 text-slate-600">{r.literRequired ?? r.requestedAmount ?? "-"} L</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Fuel Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Manage work orders, track funds, and coordinate deliveries
          </p>
        </div>
        <RegionFilter />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Approvals Queue */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col xl:col-span-1">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Create Work Order</h3>
            </div>
            <Link href="/dashboard/fuel-request">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-800">
                Manage <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {renderTable(data.approvedRequests, "No approved requests awaiting Work Order creation.")}
        </div>

        {/* Funded Queue */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col xl:col-span-1">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-blue-500" strokeWidth={2.5} />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Funded (Purchase Fuel)</h3>
            </div>
            <Link href="/dashboard/fuel-request">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-800">
                Manage <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {renderTable(data.fundedRequests, "No funded orders awaiting fuel purchase.")}
        </div>

        {/* Verification Queue */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col xl:col-span-1">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4 bg-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-lime-600" strokeWidth={2.5} />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Deliveries to Verify</h3>
            </div>
            <Link href="/dashboard/fuel-request">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-800">
                Manage <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {renderTable(data.deliveredRequests, "No deliveries awaiting verification.")}
        </div>
      </div>
    </div>
  )
}
