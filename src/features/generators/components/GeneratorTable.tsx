"use client"

import { Zap, CheckCircle2, AlertCircle, Clock, Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/Pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useAppRole } from "@/components/providers/role-provider"
import { useTransition } from "react"
import { toast } from "sonner"
import { deleteGenerator } from "@/features/generators/actions"
import { EditGeneratorSheet } from "./EditGeneratorSheet"

interface GeneratorTableProps {
  generators: any[]
  total: number
  page: number
  totalPages: number
  region?: string
  avgConsumption: number
  sortBy?: string
  sortOrder?: string
}

function StatusBadge({ consumption, avg }: { consumption: number | null; avg: number }) {
  if (!consumption || consumption === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0  font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-tight text-[11px]">
        <Clock className="h-3 w-3" />
        Idle
      </span>
    )
  }
  if (consumption > avg * 1.2) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0  font-medium text-red-700 border border-red-100 uppercase tracking-tight text-[11px]">
        <AlertCircle className="h-3 w-3" />
        High Cons.
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-0 text-[11px] font-medium text-slate-600 border border-slate-200 uppercase tracking-tight">
      <CheckCircle2 className="h-3 w-3" />
      Normal
    </span>
  )
}

export function GeneratorTable({ 
  generators, 
  total, 
  page, 
  totalPages, 
  region, 
  avgConsumption,
  sortBy: currentSortBy,
  sortOrder: currentSortOrder
}: GeneratorTableProps) {
  const { user } = useUser()
  const userRole = useAppRole()
  const canEdit = userRole === "ADMIN"
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const limit = 10

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const isAsc = currentSortBy === field && currentSortOrder === 'asc'
    params.set('sortBy', field)
    params.set('sortOrder', isAsc ? 'desc' : 'asc')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleDelete = (id: number) => {
    startTransition(async () => {
      try {
        await deleteGenerator(id)
        toast.success("Generator deleted successfully")
      } catch (error) {
        toast.error("Failed to delete generator. It might be linked to other records.")
        console.error(error)
      }
    })
  }

  const SortableHeader = ({ field, label, align = 'left' }: { field: string, label: string, align?: 'left' | 'right' | 'center' }) => (
    <TableHead className="p-0 align-middle bg-white ">
      <TableColumnHeader 
        label={label}
        sortActive={currentSortBy === field}
        onSort={() => handleSort(field)}
        className={cn(
          "px-4 text-slate-900 font-bold",
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
        )}
      />
    </TableHead>
  )

  return (
    <div className="overflow-x-auto mb-10 custom-scrollbar pb-2 relative z-0">
      <div className="min-w-[1400px] rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white sticky top-0 z-10 border-b border-gray-200">
            <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">

              <SortableHeader field="siteId" label="Site ID" />
              <SortableHeader field="siteName" label="Site Name" />
              <SortableHeader field="region" label="Region" />
              <SortableHeader field="model" label="Model / Type" />
              <SortableHeader field="serialNumber" label="Serial No." />
              <SortableHeader field="capacityKVA" label="Capacity (KVA)" align="right" />
              <SortableHeader field="stdFuelConsumption" label="Std Cons." align="right" />
              <SortableHeader field="lastRunningHours" label="Running Hrs" align="right" />
              <TableHead className="p-0 align-middle bg-white ">
                <TableColumnHeader label="Status" className="justify-center px-4 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle bg-white ">
                {canEdit && <TableColumnHeader label="Actions" className="justify-end px-4 text-slate-900 font-bold whitespace-nowrap" />}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center  text-gray-400 italic">
                  No generators found.
                </TableCell>
              </TableRow>
            ) : (
              generators.map((gen: any, i: number) => (
                <TableRow key={gen.id} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-[22px]">

                  <TableCell className="px-4">
                    <span className="text-slate-700 font-medium  px-1.5 py-0 rounded leading-none">
                      {gen.site.siteId}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-900 font-normal px-4">
                    {gen.site.name}
                  </TableCell>
                  <TableCell className=" text-gray-500 font-normal px-4">{gen.site.region || '-'}</TableCell>
                  <TableCell className=" text-gray-600 font-normal px-4">{gen.model}</TableCell>
                  <TableCell className="font-mono  text-gray-500 px-4">{gen.serialNumber ?? '-'}</TableCell>
                  <TableCell className="text-right  text-gray-900 tabular-nums px-4">
                    {gen.capacityKVA?.toLocaleString() ?? '-'}
                  </TableCell>
                  <TableCell className="text-right  text-gray-600 tabular-nums font-normal px-4">
                    {gen.stdFuelConsumption ? gen.stdFuelConsumption.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell className="text-right  text-gray-500 tabular-nums font-normal px-4">
                    {gen.lastRunningHours?.toLocaleString() ?? '-'}
                  </TableCell>
                  <TableCell className="text-center px-4">
                    <StatusBadge consumption={gen.stdFuelConsumption} avg={avgConsumption} />
                  </TableCell>
                  <TableCell className=" text-right px-4">
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1">
                        <EditGeneratorSheet generator={gen} />
                        <button 
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this generator? This cannot be undone.")) {
                              handleDelete(gen.id)
                            }
                          }}
                          className="h-8 w-8 inline-flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
                          title="Delete generator"
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer — inside min-w div so scrollbar appears below it */}
        <div className="flex items-center justify-between border-t border-slate-400 bg-white px-4 py-1.5 sm:px-6">
          <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
            <span className="hidden sm:inline-block font-bold">{total} total generators</span>
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
