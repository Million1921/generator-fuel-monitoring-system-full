"use client"

import { Trash2, Search, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableColumnHeader } from "@/components/ui/table-column-header"
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
import { toast } from "sonner"
import { useTransition } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/Pagination"
import { RegionFilter } from "@/components/ui/RegionFilter"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { approveFuelRequest, approveToFinance, createWorkOrder, deleteFuelRequest, releaseFunds, purchaseAndAssignFuel, verifyAndCompleteDelivery } from "@/features/fuel-requests/actions"
import { useUser } from "@clerk/nextjs"
import { useAppRole } from "@/components/providers/role-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface FuelRequestTableProps {
  requests: any[]
  title: string
  total: number
  page: number
  totalPages: number
  region?: string
  actionType?: 'supervisor' | 'admin'
  sortBy?: string
  sortOrder?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export function FuelRequestTable({
  requests,
  title,
  total,
  page,
  totalPages,
  region,
  actionType,
  sortBy: currentSortBy,
  sortOrder: currentSortOrder,
  dateFrom,
  dateTo,
  search
}: FuelRequestTableProps) {
  const { user } = useUser()
  const userRole = useAppRole()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [releaseAmount, setReleaseAmount] = useState("")
  const [releaseRemark, setReleaseRemark] = useState("")
  const [openFinanceDialog, setOpenFinanceDialog] = useState<number | null>(null)

  const [purchaseAmount, setPurchaseAmount] = useState("")
  const [purchaseStation, setPurchaseStation] = useState("")
  const [purchaseTech, setPurchaseTech] = useState("")
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState<number | null>(null)

  const handleDelete = (id: number) => {
    startTransition(async () => {
      try {
        await deleteFuelRequest(id)
        toast.success("Fuel request deleted successfully")
      } catch (error) {
        toast.error("Failed to delete fuel request")
        console.error(error)
      }
    })
  }

  const handleApproveFuelRequest = (id: number) => {
    startTransition(async () => {
      try {
        await approveFuelRequest(id)
        toast.success("Approved Fuel Request")
      } catch (error) {
        toast.error("Approval failed")
      }
    })


  const handleApproveToFinance = (id: number) => {
    startTransition(async () => {
      try {
        await approveToFinance(id)
        toast.success("Approved and forwarded to Finance")
      } catch (error) {
        toast.error("Approval failed")
      }
    })
  }

  const handleReleaseFunds = (id: number) => {
    if (!releaseAmount) return toast.error("Please enter an amount")
    
    startTransition(async () => {
      try {
        await releaseFunds(id, parseFloat(releaseAmount), releaseRemark, user?.id || "")
        toast.success("Funds released successfully")
        setOpenFinanceDialog(null)
      } catch (error) {
        toast.error("Failed to release funds")
      }
    })
  }

  const handlePurchaseAndAssign = (id: number) => {
    if (!purchaseAmount || !purchaseStation || !purchaseTech) return toast.error("Please fill all fields")
    
    startTransition(async () => {
      try {
        await purchaseAndAssignFuel(id, user?.id || "", parseInt(purchaseTech), purchaseStation, parseFloat(purchaseAmount))
        toast.success("Fuel purchased and assigned")
        setOpenPurchaseDialog(null)
      } catch (error: any) {
        toast.error(error.message || "Failed to purchase fuel")
      }
    })
  }

  const handleVerifyDelivery = (id: number) => {
    startTransition(async () => {
      try {
        await verifyAndCompleteDelivery(id)
        toast.success("Delivery verified and Work Order completed")
      } catch (error) {
        toast.error("Verification failed")
      }
    })
  }

  const handleCreateWorkOrder = (id: number) => {
    startTransition(async () => {
      try {
        await createWorkOrder(id)
        toast.success("Work Order created successfully")
      } catch (error) {
        toast.error("Failed to create Work Order")
      }
    })
  }

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
          "px-4 text-slate-900 font-bold",
          align === 'right' ? 'justify-end text-right' : align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
        )}
      />
    </TableHead>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 mb-10 overflow-hidden">
      {title && (
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <ClipboardList className="w-4 h-4 text-lime-600" />
          <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[1400px]">
          <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className=" border-b border-gray-100 h-10">
              <SortableHeader field="siteId" label="Site ID" />
              <SortableHeader field="siteName" label="Site Name" />
              <SortableHeader field="createdAt" label="Date" />
              <SortableHeader field="technician.name" label="Req. By" />
              <SortableHeader field="workOrderNumber" label="Ref / Order #" />
              <SortableHeader field="priority" label="Priority" />
              <SortableHeader field="literRequired" label="Req (L)" align="right" />
              <SortableHeader field="status" label="Status" align="center" />
              <TableHead className="p-0 align-middle ">
                <TableColumnHeader label="Actions" className="justify-end px-4 text-slate-900 font-bold" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-gray-400 italic">
                  No {title.toLowerCase()} found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="border-b-gray-50 hover:bg-gray-50/50 transition-colors h-[22px]">
                  <TableCell className="px-4">
                    <span className="text-slate-700 font-medium px-1.5 py-0 rounded leading-none">
                      {req.site.siteId}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-900 px-4 leading-none">{req.site.name}</TableCell>
                  <TableCell className="text-gray-500 whitespace-nowrap px-4 leading-none">
                    {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-gray-900 px-4 leading-none whitespace-nowrap">
                    {req.technician?.name || '-'}
                  </TableCell>
                  <TableCell className="text-gray-500 font-mono px-4 leading-none">
                    {req.workOrderNumber ? req.workOrderNumber : (req.workRequestNumber || 'N/A')}
                  </TableCell>
                  <TableCell className="px-4 leading-none">
                    <span className={`inline-flex items-center rounded px-1.5 py-0 font-medium uppercase tracking-tight ${
                      req.priority === 'EMERGENCY' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                      req.priority === 'URGENT' ? 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20' :
                      req.priority === 'HIGH' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20' :
                      'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-600/10'
                    }`}>
                      {req.priority || 'NORMAL'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-900 text-right tabular-nums px-4 leading-none">
                    {req.literRequired ? req.literRequired.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-center text-[11px] text-gray-500 font-medium uppercase tracking-tight px-4 leading-none">
                    {req.status.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-right px-4 leading-none">
                    <div className="flex justify-end items-center gap-2 pr-2">
                      {req.status === 'PENDING_SUPERVISOR' && (userRole === 'SUPERVISOR' || userRole === 'ADMIN') && (
                        <Button size="sm" onClick={() => handleApproveFuelRequest(req.id)} disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                          Approve
                        </Button>
                      )}
                      {req.status === 'APPROVED_REQUEST' && (userRole === 'FLEET_ADMIN' || userRole === 'ADMIN') && (
                        <Button size="sm" onClick={() => handleCreateWorkOrder(req.id)} disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                          Create WO
                        </Button>
                      )}
                      {req.status === 'PENDING_MANAGER_APPROVAL' && (userRole === 'MANAGER' || userRole === 'ADMIN') && (
                        <Button size="sm" onClick={() => handleApproveToFinance(req.id)} disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                          Approve
                        </Button>
                      )}
                      {req.status === 'PENDING_FINANCE' && (userRole === 'FINANCE' || userRole === 'ADMIN') && (
                        <Dialog open={openFinanceDialog === req.id} onOpenChange={(open) => setOpenFinanceDialog(open ? req.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="h-7 px-3 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-semibold uppercase tracking-tight shadow-none">
                              Release Funds
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Release Funds for Work Order {req.workOrderNumber}</DialogTitle>
                              <DialogDescription>
                                Specify the amount to release to the Fuel Admin's wallet.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Amount (ETB)</Label>
                                <Input type="number" value={releaseAmount} onChange={(e) => setReleaseAmount(e.target.value)} placeholder="0.00" />
                              </div>
                              <div className="grid gap-2">
                                <Label>Remark</Label>
                                <Input value={releaseRemark} onChange={(e) => setReleaseRemark(e.target.value)} placeholder="Optional remark" />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleReleaseFunds(req.id)} disabled={isPending} className="bg-lime-600 hover:bg-lime-700 text-white">Confirm Release</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {req.status === 'FUNDS_RELEASED' && (userRole === 'FLEET_ADMIN' || userRole === 'ADMIN') && (
                        <Dialog open={openPurchaseDialog === req.id} onOpenChange={(open) => setOpenPurchaseDialog(open ? req.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="h-7 px-3 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-semibold uppercase tracking-tight shadow-none">
                              Purchase & Assign
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Purchase Fuel & Assign Technician</DialogTitle>
                              <DialogDescription>
                                Enter purchase details to deduct from your wallet and assign a technician for delivery.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Purchased Amount (ETB)</Label>
                                <Input type="number" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} placeholder="0.00" />
                              </div>
                              <div className="grid gap-2">
                                <Label>Fuel Station</Label>
                                <Input value={purchaseStation} onChange={(e) => setPurchaseStation(e.target.value)} placeholder="e.g. NOC Station" />
                              </div>
                              <div className="grid gap-2">
                                <Label>Technician ID (e.g. 1)</Label>
                                <Input type="number" value={purchaseTech} onChange={(e) => setPurchaseTech(e.target.value)} placeholder="Technician DB ID" />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handlePurchaseAndAssign(req.id)} disabled={isPending} className="bg-lime-600 hover:bg-lime-700 text-white">Confirm Purchase</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {req.status === 'DELIVERED' && (userRole === 'FLEET_ADMIN' || userRole === 'ADMIN') && (
                        <Button size="sm" onClick={() => handleVerifyDelivery(req.id)} disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                          Verify Delivery
                        </Button>
                      )}
                      {req.status === 'ASSIGNED_TO_TECH' && (userRole === 'TECHNICIAN' || userRole === 'ADMIN') && (
                        <Button 
                          size="sm" 
                          onClick={() => router.push(`/dashboard/fuel-delivery?siteId=${req.siteId}&requestId=${req.id}&workOrder=${req.workOrderNumber}&open=true`)}
                          disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-semibold uppercase tracking-tight shadow-none"
                        >
                          Deliver
                        </Button>
                      )}
                      {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
                              disabled={isPending}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this fuel request record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(req.id)}
                                className="bg-red-600 hover:bg-red-700 text-white">
                                Yes, delete it
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-gray-100 bg-white pt-4 mt-2 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
              <span className="hidden sm:inline-block font-bold">{total} total requests</span>
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
