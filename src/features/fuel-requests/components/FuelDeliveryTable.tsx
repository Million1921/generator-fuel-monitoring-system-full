"use client"

import { cn } from "@/lib/utils"
import { TableColumnHeader } from "@/components/ui/table-column-header"
import { Fuel, LucideIcon, Search, Trash2 } from "lucide-react"
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

  const handleSort = (field: string) => {
    // Keeping minimal setup for now
  }

  const SortableHeader = ({ field, label, align = 'left' }: { field: string, label: string, align?: 'left' | 'right' | 'center' }) => (
    <TableHead className="p-0 align-middle bg-white ">
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
          <form onSubmit={(e) => {
            e.preventDefault()
            const val = (e.currentTarget.elements.namedItem("search") as HTMLInputElement)?.value ?? ""
            const params = new URLSearchParams(searchParams.toString())
            if (val) params.set("search", val)
            else params.delete("search")
            params.set("page", "1")
            router.push(`${pathname}?${params.toString()}`)
          }}>
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by site, driver, technician, work order..."
              className="pl-9 h-9 border-gray-200 bg-white focus:ring-lime-500 text-sm"
            />
          </form>
        </div>
        {search && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete("search")
              params.set("page", "1")
              router.push(`${pathname}?${params.toString()}`)
            }}
            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-tight"
          >
            ✕ Clear
          </button>
        )}
        <RegionFilter />
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-2">
      <div className="min-w-[1950px] rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white sticky top-0 z-10 border-b border-gray-200">
            <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
              <SortableHeader field="siteId" label="Site ID" />
              <SortableHeader field="name" label="Site Name" />
              <SortableHeader field="workOrder" label="Work Order" />
              <SortableHeader field="region" label="Region" />
              <SortableHeader field="date" label="Date" />
              <SortableHeader field="liters" label="Liters" align="right" />
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Run (B)" className="justify-center px-2 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Run (A)" className="justify-center px-2 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Level (B)" className="justify-center px-2 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Level (A)" className="justify-center px-2 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Requested By" className="justify-start px-4 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Delivered By" className="justify-start px-4 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Driver Details" className="justify-start px-4 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white h-8">
                <TableColumnHeader label="Actions" className="justify-end px-4 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
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
              deliveries.map((delivery) => (
                <TableRow key={delivery.id} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-[22px]">
                  <TableCell className="px-4">
                    <span className="text-slate-700 font-medium px-1.5 py-0 rounded leading-none">
                      {delivery.site.siteId}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 text-gray-900 font-normal">
                    {delivery.site.name}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-slate-700 font-normal">
                    {delivery.workOrderNumber || '-'}
                  </TableCell>
                  <TableCell className="px-4 text-slate-500 font-normal">
                    {delivery.site.region || '-'}
                  </TableCell>
                  <TableCell className="px-4 text-gray-500">
                    {new Date(delivery.refillDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-slate-900 text-right px-4 font-medium tabular-nums">
                    {delivery.fuelDelivered.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-gray-500 tabular-nums">
                    {delivery.beforeHours ?? '-'}
                  </TableCell>
                  <TableCell className="text-center text-gray-500 tabular-nums">
                    {delivery.afterHours ?? '-'}
                  </TableCell>
                  <TableCell className="text-center text-gray-500 tabular-nums">
                    {delivery.beforeLevel ?? '-'}
                  </TableCell>
                  <TableCell className="text-center text-gray-500 tabular-nums">
                    {delivery.afterLevel ?? '-'}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-gray-900">{delivery.fuelRequest?.technician?.name || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-gray-900">{delivery.technicianName || '-'}</span>
                      <span className="text-[10px] uppercase tracking-tight text-gray-500 font-normal">
                        {delivery.technicianIdStr ? `ID: ${delivery.technicianIdStr}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-gray-900">{delivery.driverName || '-'}</span>
                      <span className="text-[10px] uppercase tracking-tight text-gray-500 font-normal">
                        {delivery.driverId ? `ID: ${delivery.driverId}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-4">
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
                        className="h-8 w-8 inline-flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
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
