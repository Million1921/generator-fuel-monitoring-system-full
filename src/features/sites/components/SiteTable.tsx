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
import { cn } from "@/lib/utils"
import { TableColumnHeader } from "@/components/ui/table-column-header"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { EditSiteSheet } from "./EditSiteSheet"
import { deleteSite } from "@/features/sites/actions"
import { toast } from "sonner"
import { useTransition } from "react"
import { Pagination } from "@/components/ui/Pagination"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useAppRole } from "@/components/providers/role-provider"

interface Site {
  id: number
  siteId: string
  name: string
  region: string | null
  tankerCapacity: number | null
  gpsCoordinates?: string | null
}

interface SiteTableProps {
  sites: Site[]
  total: number
  page: number
  sortBy?: string
  sortOrder?: string
}

export function SiteTable({ sites, total, page, sortBy: currentSortBy, sortOrder: currentSortOrder }: SiteTableProps) {
  const { user } = useUser()
  const userRole = useAppRole()
  const canEdit = userRole === "ADMIN"
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const region = searchParams.get("region")
  const search = searchParams.get("search")
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
    <TableHead className="p-0 align-middle ">
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

  const handleDelete = (id: number) => {
    startTransition(async () => {
      try {
        await deleteSite(id)
        toast.success("Site deleted successfully")
      } catch (error) {
        toast.error("Failed to delete site. It might be linked to other records.")
        console.error(error)
      }
    })
  }

  return (
    <div className="overflow-x-auto mb-10 custom-scrollbar pb-2 relative z-0">
      <div className="rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden w-full">
        <Table className="w-full">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className=" h-8">
              <SortableHeader field="siteId" label="Site ID" />
              <SortableHeader field="name" label="Site Name" />
              <SortableHeader field="region" label="Region" />
              <SortableHeader field="tankerCapacity" label="Capacity (L)" align="center" />
              <TableHead className="p-0 align-middle ">
                <TableColumnHeader label="Status" className="justify-center px-1 text-slate-900 font-bold whitespace-nowrap" />
              </TableHead>
              <TableHead className="p-0 align-middle ">
                {canEdit && <TableColumnHeader label="Actions" className="justify-end px-1 text-slate-900 font-bold whitespace-nowrap" />}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center  text-gray-400 italic">
                  No sites found in the database.
                </TableCell>
              </TableRow>
            ) : (
              sites.map((site) => (
                <TableRow key={site.id} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-[22px]">
                  <TableCell className="px-1">
                    <span className="text-slate-700 font-medium px-1 py-0 rounded leading-none">
                      {site.siteId}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-900 font-normal px-1 leading-none">
                    {site.name}
                  </TableCell>
                  <TableCell className="text-gray-500 font-normal px-1 leading-none">
                    {site.region || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-gray-900 text-center tabular-nums font-normal px-1 leading-none">
                    {site.tankerCapacity?.toLocaleString() ?? "-"}
                  </TableCell>
                  <TableCell className="text-center font-normal px-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1 py-0 font-medium text-gray-700 uppercase tracking-tight text-[11px] leading-none">
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-1">
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1">
                        <EditSiteSheet site={site} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the 
                              site and remove all associated generators.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(site.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Yes, delete site
                            </AlertDialogAction>
                          </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
            <span className="hidden sm:inline-block font-bold">{total} total rows</span>
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
