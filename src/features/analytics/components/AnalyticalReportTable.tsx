"use client"

import * as React from "react"
import { TableColumnHeader } from "@/components/ui/table-column-header"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/ui/Pagination"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface AnalyticalReportData {
  siteNumber: string
  location: string
  totalRefueled: number
  totalRunningHours: number
  amountInBirr: number
  variance: number
}

interface AnalyticalReportTableProps {
  data: AnalyticalReportData[]
  total: number
  page: number
  sortBy?: string
  sortOrder?: string
}

export function AnalyticalReportTable({ 
  data, 
  total, 
  page,
  sortBy: currentSortBy,
  sortOrder: currentSortOrder 
}: AnalyticalReportTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const region = searchParams.get("region")
  const limit = 10
  const totalPages = Math.ceil(total / limit)

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const isAsc = currentSortBy === field && currentSortOrder === 'asc'
    params.set('sortBy', field)
    params.set('sortOrder', isAsc ? 'desc' : 'asc')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const SortableHeader = ({ field, label, align = 'left' }: { field: string, label: string, align?: 'left' | 'right' | 'center' }) => (
    <TableHead className="p-0 align-middle bg-white border-b border-gray-200">
      <TableColumnHeader 
        label={label}
        sortActive={currentSortBy === field}
        onSort={() => handleSort(field)}
        className={cn(
          "px-1 h-6 text-slate-900 font-bold",
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
        )}
      />
    </TableHead>
  )

  return (
    <div className="overflow-x-auto mb-10 custom-scrollbar pb-2">
      <div className="w-full rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white sticky top-0 z-10 border-b border-gray-200">
            <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
              <SortableHeader field="siteNumber" label="Site #" />
              <SortableHeader field="location" label="Location" />
              <SortableHeader field="totalRefueled" label="Total Refueled" align="right" />
              <SortableHeader field="totalRunningHours" label="Running Hours" align="right" />
              <SortableHeader field="amountInBirr" label="Amount (Birr)" align="right" />
              <TableHead className="p-0 align-middle bg-white border-b border-gray-200">
                <TableColumnHeader label="Variance" className="justify-end px-4 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400 italic">
                  No data found for this period.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={`${row.siteNumber}-${idx}`} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-[22px]">
                  <TableCell className="px-1 py-0 leading-none">
                    <span className="text-slate-700 font-medium ">
                      {row.siteNumber}
                    </span>
                  </TableCell>
                  <TableCell className="px-1 py-0 text-slate-900 leading-none">
                    {row.location}
                  </TableCell>
                  <TableCell className="px-1 py-0 text-right text-gray-600 tabular-nums font-normal leading-none">
                    {row.totalRefueled.toLocaleString()} L
                  </TableCell>
                  <TableCell className="px-1 py-0 text-right text-gray-600 tabular-nums font-normal leading-none">
                    {row.totalRunningHours.toLocaleString()} h
                  </TableCell>
                  <TableCell className="px-1 py-0 text-right text-slate-900 tabular-nums font-medium leading-none">
                    {row.amountInBirr.toLocaleString()} ETB
                  </TableCell>
                  <TableCell className="px-1 py-0 text-right tabular-nums text-slate-900 leading-none">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0 font-medium",
                      row.variance > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                    )}>
                      {row.variance > 0 ? "+" : ""}{row.variance.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer — inside min-w div so scrollbar appears below it */}
        <div className="flex items-center justify-between border-t border-slate-400 bg-white px-4 py-1.5 sm:px-6">
          <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
            <span className="hidden sm:inline-block font-bold">{total} total sites</span>
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
