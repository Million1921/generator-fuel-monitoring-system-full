"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import { Pagination } from "@/components/ui/Pagination"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface FuelUsageTableProps {
  refills: any[]
  total: number
  page: number
  totalPages: number
}

export function FuelUsageTable({
  refills,
  total,
  page,
  totalPages,
}: FuelUsageTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div className="overflow-x-auto mb-10 custom-scrollbar pb-2 relative z-0">
      <div className="min-w-[1200px] rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white sticky top-0 z-10 border-b border-gray-200">
            <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
              {[
                "Date", "Site No", "Site Name", "Delivered (L)", "Level Before (L)", "Level After (L)", 
                "Beginning Hour", "Current Hour", "Technician", "Vehicle/Driver"
              ].map((label) => (
                <TableHead key={label} className="font-bold text-sm text-slate-900 uppercase tracking-tight p-0 align-middle bg-white border-b border-gray-100">
                  <div className="flex items-center gap-1.5 px-4 h-9 select-none justify-start">
                    <span className="whitespace-nowrap">{label}</span>
                    <div className="flex items-center gap-0.5 opacity-30">
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {refills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-gray-400 italic">
                  No fuel usage records found.
                </TableCell>
              </TableRow>
            ) : (
              refills.map((refill: any) => (
                <TableRow key={refill.id} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-[22px]">
                  <TableCell className="font-medium text-sm px-4 py-1">
                    {new Date(refill.refillDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-lime-600 font-bold text-sm px-4 py-1">
                    {refill.site.siteId}
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium text-sm px-4 py-1">
                    {refill.site.name}
                  </TableCell>
                  <TableCell className="px-4 py-1">
                    <Badge variant="outline" className="bg-lime-50 text-lime-700 border-lime-200 text-xs px-2 py-0.5">
                      {refill.fuelDelivered} L
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground px-4 py-1 tabular-nums text-right">
                    {refill.beforeLevel}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground px-4 py-1 tabular-nums text-right">
                    {refill.afterLevel}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground px-4 py-1 tabular-nums text-right">
                    {refill.beforeHours}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground px-4 py-1 tabular-nums text-right">
                    {refill.afterHours}
                  </TableCell>
                  <TableCell className="text-sm px-4 py-1">{refill.technician?.name || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground px-4 py-1 leading-tight">
                    {refill.tankerVehicle || "-"}<br/>
                    {refill.driverName || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer — inside min-w div so scrollbar appears below it */}
        <div className="flex items-center justify-between border-t border-slate-400 bg-white px-4 py-1.5 sm:px-6">
          <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
            <span className="hidden sm:inline-block font-bold">{total} total records</span>
            <span className="hidden sm:inline-block">|</span>
            <div className="flex items-center gap-2">
              <span>Go to:</span>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const p = formData.get("page");
                if (p) {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", p.toString());
                  router.push(`${pathname}?${params.toString()}`);
                }
              }} className="flex items-center gap-2">
                <Input
                  name="page"
                  type="number"
                  defaultValue={page}
                  className="h-7 w-12 text-center font-bold bg-gray-50 border-gray-200 p-0 focus-visible:ring-1 focus-visible:ring-lime-500 shadow-none"
                />
              </form>
            </div>
          </div>
          <Pagination totalPages={totalPages} currentPage={page} />
        </div>
      </div>
    </div>
  )
}
