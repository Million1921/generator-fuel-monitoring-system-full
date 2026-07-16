"use client"

import { Phone, Mail, MapPin, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableColumnHeader } from "@/components/ui/table-column-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/Pagination"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface TechnicianTableProps {
  technicians: any[]
  total: number
  page: number
  totalPages: number
  sortBy?: string
  sortOrder?: string
}

export function TechnicianTable({ 
  technicians, 
  total, 
  page, 
  totalPages,
  sortBy: currentSortBy,
  sortOrder: currentSortOrder
}: TechnicianTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const isAsc = currentSortBy === field && currentSortOrder === 'asc'
    params.set('sortBy', field)
    params.set('sortOrder', isAsc ? 'desc' : 'asc')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const SortableHeader = ({ field, label, align = 'left' }: { field: string, label: string, align?: 'left' | 'right' | 'center' }) => (
    <TableHead className="p-0 align-middle bg-white ">
      <TableColumnHeader 
        label={label}
        sortActive={currentSortBy === field}
        onSort={() => handleSort(field)}
        className={cn(
          "px-1 text-slate-900 font-bold",
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
        )}
      />
    </TableHead>
  )

  return (
    <div className="overflow-x-auto mb-10 custom-scrollbar pb-2">
      <div className="w-full rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
              <SortableHeader field="name" label="Technician Info" />
              <SortableHeader field="department" label="Department" align="center" />
              <SortableHeader field="region" label="Assigned Region" align="center" />
              <TableHead className="p-0 align-middle bg-white ">
                <TableColumnHeader label="Status" className="justify-center px-1 text-slate-900 font-bold" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center  text-gray-400 italic">
                  No technicians registered yet.
                </TableCell>
              </TableRow>
            ) : (
              technicians.map((tech: any) => (
                <TableRow key={tech.id} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-[22px]">
                  <TableCell className="px-1">
                    <div className="flex flex-col leading-none">
                      <span className="font-medium text-slate-900 leading-none">{tech.name || "Unnamed"}</span>
                      <div className="flex items-center gap-3 text-gray-400 text-[9px] leading-none">
                        <div className="flex items-center gap-0.5 font-normal">
                          <Phone className="h-2 w-2" /> {tech.phone || "---"}
                        </div>
                        <div className="flex items-center gap-0.5 font-normal">
                          <Mail className="h-2 w-2" /> {tech.email || "---"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-normal px-1">
                      <div className="flex items-center justify-center gap-1 text-gray-600 leading-none text-[11px]">
                          <Building2 className="h-3 w-3 text-gray-300" />
                          {tech.department}
                      </div>
                  </TableCell>
                  <TableCell className="text-center font-normal px-1">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="h-2.5 w-2.5 text-slate-400" />
                      <span className="text-slate-700 bg-slate-50 border border-slate-100 font-medium text-[9px] px-1 py-0 rounded-full uppercase leading-none">
                        {tech.region?.name || "Unassigned"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-normal px-1">
                    <span className="bg-slate-50 text-slate-700 border border-slate-100 px-1 py-0 rounded-full text-[9px] font-medium uppercase tracking-wider leading-none">
                      Active
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
            <span className="hidden sm:inline-block font-bold">{total} total technicians</span>
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
      {/* scrollbar appears here */}
    </div>
  )
}
