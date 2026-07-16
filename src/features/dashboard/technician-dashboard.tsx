import Link from "next/link"
import { ClipboardList, Fuel, MapPin, CheckCircle2, PlusCircle, Truck } from "lucide-react"
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

async function getTechnicianDashboardData(email: string | null) {
  if (!email) return null

  const technician = await prisma.technician.findFirst({
    where: { email },
    include: { region: true },
  })

  if (!technician) return { technician: null } as const

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [myPending, myCompletedThisMonth, myDeliveriesAgg, recentRequests, recentDeliveries] = await Promise.all([
    prisma.fuelRequest.count({
      where: {
        technicianId: technician.id,
        status: { in: ["PENDING_SUPERVISOR", "PENDING_MANAGER", "PENDING_ADMIN"] },
      },
    }),
    prisma.fuelRequest.count({
      where: {
        technicianId: technician.id,
        status: "COMPLETED",
        updatedAt: { gte: startOfMonth },
      },
    }),
    prisma.fuelRefill.aggregate({
      _sum: { fuelDelivered: true },
      where: { technicianId: technician.id, refillDate: { gte: startOfMonth } },
    }),
    prisma.fuelRequest.findMany({
      where: { technicianId: technician.id },
      include: { site: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.fuelRefill.findMany({
      where: { technicianId: technician.id },
      include: { site: true },
      orderBy: { refillDate: "desc" },
      take: 5,
    }),
  ])

  return {
    technician,
    myPending,
    myCompletedThisMonth,
    myDeliveredThisMonth: myDeliveriesAgg._sum.fuelDelivered ?? 0,
    recentRequests,
    recentDeliveries,
  } as const
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    COMPLETED: "bg-lime-50 text-lime-700 border-lime-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    APPROVED_FOR_FUEL: "bg-blue-50 text-blue-700 border-blue-200",
  }
  const cls = map[status] ?? "bg-amber-50 text-amber-700 border-amber-200"
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-tight ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

export async function TechnicianDashboard({ email }: { email: string | null }) {
  const data = await getTechnicianDashboardData(email)

  // Removed quick actions per request

  if (!data || !data.technician) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Your account isn&apos;t linked to a technician profile yet. You can still submit requests and record
            deliveries — ask your administrator to link your profile to see your personal activity here.
          </p>
        </div>
      </div>
    )
  }

  const { technician, myPending, myCompletedThisMonth, myDeliveredThisMonth, recentRequests, recentDeliveries } = data

  const statCards = [
    {
      title: "My Pending Requests",
      value: myPending.toString(),
      sub: "Awaiting approval at any stage",
      icon: ClipboardList,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Completed This Month",
      value: myCompletedThisMonth.toString(),
      sub: "Fuel requests fulfilled",
      icon: CheckCircle2,
      color: "text-lime-600",
      bg: "bg-lime-50",
    },
    {
      title: "Delivered This Month",
      value: `${myDeliveredThisMonth.toLocaleString()} L`,
      sub: "Fuel volume you recorded",
      icon: Fuel,
      color: "text-lime-500",
      bg: "bg-lime-50",
    },
    {
      title: "Assigned Region",
      value: technician.region?.name ?? "Unassigned",
      sub: technician.department ?? "No department on file",
      icon: MapPin,
      color: "text-lime-700",
      bg: "bg-lime-100/50",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Welcome back, {technician.name ?? "Technician"}</h2>
          <p className="text-sm text-muted-foreground">Here&apos;s your personal fuel request and delivery activity</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b px-5 py-4 bg-white">
            <ClipboardList className="h-5 w-5 text-lime-600" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">My Recent Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
                  <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                  <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Status</TableHead>
                  <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground italic">
                      You haven&apos;t submitted any fuel requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentRequests.map((r) => (
                    <TableRow key={r.id} className="h-8">
                      <TableCell className="px-4 font-normal text-slate-900">{r.site.name}</TableCell>
                      <TableCell className="px-4">{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-right px-4 text-slate-600">{r.literRequired ?? "-"} L</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b px-5 py-4 bg-white">
            <Truck className="h-5 w-5 text-lime-600" strokeWidth={2.5} />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">My Recent Deliveries</h3>
          </div>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
                  <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Site</TableHead>
                  <TableHead className="px-4 text-[13px] font-bold uppercase tracking-tight">Date</TableHead>
                  <TableHead className="text-right px-4 text-[13px] font-bold uppercase tracking-tight">Delivered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground italic">
                      No deliveries recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDeliveries.map((d) => (
                    <TableRow key={d.id} className="h-8">
                      <TableCell className="px-4 font-normal text-slate-900">{d.site.name}</TableCell>
                      <TableCell className="px-4 text-slate-600">{d.refillDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right px-4 text-slate-600">{d.fuelDelivered.toLocaleString()} L</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
