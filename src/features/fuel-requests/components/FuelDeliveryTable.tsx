"use client"

import { cn } from "@/lib/utils"
import { TableColumnHeader } from "@/components/ui/table-column-header"
import { Fuel, LucideIcon, Search, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { deleteFuelDelivery } from "../actions"
import { EditFuelDeliveryDialog } from "./EditFuelDeliveryDialog"
import { FuelDeliveryExportButtons } from "./FuelDeliveryExportButtons"
import { RegionFilter } from "@/components/ui/RegionFilter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pagination } from "@/components/ui/Pagination"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect } from "react"

interface FuelDeliveryTableProps {
  deliveries: any[]
  total: number
  page: number
  totalPages: number
  region?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export function FuelDeliveryTable({ 
  deliveries, 
  total, 
  page, 
  totalPages, 
  region,
  search,
  dateFrom,
  dateTo
}: FuelDeliveryTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search ?? "")

  // Keep input in sync when URL changes (e.g. clear button)
  useEffect(() => {
    setSearchValue(search ?? "")
  }, [search])

  const applySearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val.trim()) params.set("search", val.trim())
    else params.delete("search")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const SortableHeader = ({ field, label, align = 'left' }: { field: string, label: string, align?: 'left' | 'right' | 'center' }) => (
    <TableHead className="p-0 align-middle ">
      <TableColumnHeader 
        label={label}
        className={cn(
          "px-4 text-slate-900 font-bold whitespace-nowrap",
          align === 'right' ? 'justify-end text-right' : align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
        )}
      />
    </TableHead>
  )

  return (
    <div className="-mt-10 space-y-2 mb-10">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch(searchValue)
            }}
            placeholder="Search by site, driver, technician, work order..."
            className="pl-9 pr-20 h-9 border-gray-200 bg-white focus:ring-lime-500 text-sm"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => { setSearchValue(""); applySearch("") }}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => applySearch(searchValue)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-lime-500 hover:bg-lime-600 text-white rounded px-2 py-0.5 text-xs font-bold transition-colors"
          >
            Go
          </button>
        </div>
        <RegionFilter />
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-2">
      <div className="min-w-[1950px] rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="h-8">
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap border-r border-slate-400 w-[40px] text-center">#</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Site ID</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Site Name</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Work Order</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Region</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Date</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap text-right">Liters</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-2 align-middle whitespace-nowrap text-center">Run (B)</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-2 align-middle whitespace-nowrap text-center">Run (A)</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-2 align-middle whitespace-nowrap text-center">Level (B)</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-2 align-middle whitespace-nowrap text-center">Level (A)</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Requested By</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Delivered By</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap">Driver</TableHead>
              <TableHead className="font-bold uppercase tracking-tight text-[11px] px-4 align-middle whitespace-nowrap text-right border-l border-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="h-24 text-center text-gray-400 italic">
                  No delivery records found.
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery, idx) => (
                <TableRow key={delivery.id} className="hover:bg-gray-50/50 border-b-gray-50 transition-colors h-[22px]">
                  <TableCell className="text-center text-[11px] text-gray-400 font-normal border-r border-slate-400 px-1 py-0">
                    {(page - 1) * 50 + idx + 1}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-slate-700 font-medium text-[14px] leading-none">
                    {delivery.site.siteId}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-gray-900 font-normal text-[14px] leading-none">
                    {delivery.site.name}
                  </TableCell>
                  <TableCell className="px-1 py-0 font-mono text-slate-700 font-normal text-[14px] leading-none">
                    {delivery.workOrderNumber || '-'}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-slate-500 font-normal text-[14px] leading-none">
                    {delivery.site.region || '-'}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-gray-500 text-[14px] leading-none">
                    {new Date(delivery.refillDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-slate-900 text-right font-medium tabular-nums text-[14px] leading-none">
                    {delivery.fuelDelivered.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-center text-gray-500 tabular-nums text-[14px] leading-none">
                    {delivery.beforeHours ?? '-'}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-center text-gray-500 tabular-nums text-[14px] leading-none">
                    {delivery.afterHours ?? '-'}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-center text-gray-500 tabular-nums text-[14px] leading-none">
                    {delivery.beforeLevel ?? '-'}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-center text-gray-500 tabular-nums text-[14px] leading-none">
                    {delivery.afterLevel ?? '-'}
                  </TableCell>
                  {/* REQUESTED BY */}
                  <TableCell className="px-1 py-0 text-[14px] leading-none">
                    <span className="text-gray-900 font-medium">{delivery.fuelRequest?.technician?.name || '-'}</span>
                    {delivery.fuelRequest?.technician?.employeeId && (
                      <span className="text-gray-400 text-[11px] ml-1">({delivery.fuelRequest.technician.employeeId})</span>
                    )}
                  </TableCell>
                  {/* DELIVERED BY */}
                  <TableCell className="px-1 py-0 text-[14px] leading-none">
                    <span className="text-gray-900 font-medium">{delivery.technicianName || '-'}</span>
                    {(() => {
                      const empId = delivery.technician?.employeeId
                      const storedId = delivery.technicianIdStr && delivery.technicianIdStr.length <= 20 ? delivery.technicianIdStr : null
                      const displayId = empId || storedId
                      return displayId ? (
                        <span className="text-gray-400 text-[11px] ml-1">({displayId})</span>
                      ) : null
                    })()}
                  </TableCell>
                  {/* DRIVER */}
                  <TableCell className="px-1 py-0 text-[14px] leading-none">
                    <span className="text-gray-900 font-medium">{delivery.driverName || '-'}</span>
                    {delivery.driverId && (
                      <span className="text-gray-400 text-[11px] ml-1">({delivery.driverId})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-1 py-0 border-l border-slate-400">
                    <div className="flex items-center justify-end gap-1">
                      <EditFuelDeliveryDialog delivery={delivery} />
                      <button 
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this delivery record? This cannot be undone.")) {
                            try {
                              await deleteFuelDelivery(delivery.id);
                              toast.success("Delivery deleted successfully");
                            } catch (e: any) {
                              toast.error(`Failed to delete: ${e.message || e}`);
                            }
                          }
                        }}
                        className="h-6 w-6 inline-flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer — inside min-w div so scrollbar appears below it */}
        <div className="flex items-center justify-between border-t border-slate-400 bg-white px-4 py-1.5 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
              <span className="hidden sm:inline-block font-bold">{total} total deliveries</span>
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

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded border border-slate-300">
              <span className="text-slate-500 text-[12px] font-bold uppercase tracking-tight">From:</span>
              <input
                type="date"
                defaultValue={dateFrom}
                className="h-8 w-[130px] bg-white border border-slate-200 rounded p-1 text-[12px] font-medium focus:ring-blue-500 outline-hidden"
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) params.set("from", e.target.value);
                  else params.delete("from");
                  params.set("page", "1");
                  router.push(`${pathname}?${params.toString()}`);
                }}
              />
              <span className="text-slate-500 text-[12px] font-bold uppercase tracking-tight ml-1">To:</span>
              <input
                type="date"
                defaultValue={dateTo}
                className="h-8 w-[130px] bg-white border border-slate-200 rounded p-1 text-[12px] font-medium focus:ring-blue-500 outline-hidden"
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) params.set("to", e.target.value);
                  else params.delete("to");
                  params.set("page", "1");
                  router.push(`${pathname}?${params.toString()}`);
                }}
              />
            </div>
          </div>
          <Pagination totalPages={totalPages} currentPage={page} />
        </div>
      </div>
    </div>
    </div>
  )
}
