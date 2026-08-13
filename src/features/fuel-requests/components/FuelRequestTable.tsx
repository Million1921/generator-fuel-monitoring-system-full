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
import { approveFuelRequest, approveToFleetAdmin, createWorkOrder, deleteFuelRequest, approveWorkOrder, forwardToFLManager, releaseFundsToFleetManager, releaseFundsToFleetAdmin, purchaseAndAssignFuel, verifyAndCompleteDelivery } from "@/features/fuel-requests/actions"
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

  // Work Order form state
  const [openWODialog, setOpenWODialog] = useState<number | null>(null)
  const [woPlanner, setWoPlanner] = useState("")
  const [woAssetNumber, setWoAssetNumber] = useState("")
  const [woAssetGroup, setWoAssetGroup] = useState("GENERATOR")
  const [woWbClass, setWoWbClass] = useState("O&M_DIESEL")
  const [woScheduledStart, setWoScheduledStart] = useState("")
  const [woScheduledEnd, setWoScheduledEnd] = useState("")
  const [woDuration, setWoDuration] = useState("2")
  const [woType, setWoType] = useState("Preventive")
  const [woPriority, setWoPriority] = useState("Medium")
  const [woDescription, setWoDescription] = useState("")
  const [woDepartment, setWoDepartment] = useState("")
  const [woDeptDesc, setWoDeptDesc] = useState("")
  const [woAssetActivity, setWoAssetActivity] = useState("FUEL REFILL")
  const [woFirm, setWoFirm] = useState("No")
  const [woStatus, setWoStatus] = useState("Draft")

  // Verify Delivery form state
  const [openVerifyDialog, setOpenVerifyDialog] = useState<number | null>(null)
  const [verifyRemark, setVerifyRemark] = useState("")

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
        toast.success("Approved – forwarded to Manager")
      } catch (error) {
        toast.error("Approval failed")
      }
    })
  }

  const handleApproveToFleetAdmin = (id: number) => {
    startTransition(async () => {
      try {
        await approveToFleetAdmin(id)
        toast.success("Approved – forwarded to Fleet Admin")
      } catch (error) {
        toast.error("Approval failed")
      }
    })
  }

  const handleApproveWorkOrder = (id: number) => {
    startTransition(async () => {
      try {
        await approveWorkOrder(id)
        toast.success("Work Order Approved – forwarded to Fleet Manager")
      } catch (error) {
        toast.error("Approval failed")
      }
    })
  }

  const handleForwardToFLManager = (id: number) => {
    startTransition(async () => {
      try {
        await forwardToFLManager(id)
        toast.success("Work Order forwarded to F&L Country Manager")
      } catch (error) {
        toast.error("Forwarding failed")
      }
    })
  }

  const handleReleaseFundsToFleetManager = (id: number) => {
    if (!releaseAmount) return toast.error("Please enter an amount")
    
    startTransition(async () => {
      try {
        await releaseFundsToFleetManager(id, parseFloat(releaseAmount), releaseRemark)
        toast.success("Funds released to Fleet Manager successfully")
        setOpenFinanceDialog(null)
      } catch (error: any) {
        toast.error(error.message || "Failed to release funds")
      }
    })
  }

  const handleReleaseFundsToFleetAdmin = (id: number) => {
    if (!releaseAmount) return toast.error("Please enter an amount")
    
    startTransition(async () => {
      try {
        await releaseFundsToFleetAdmin(id, parseFloat(releaseAmount), releaseRemark, user?.id || "")
        toast.success("Funds released to Fleet Admin successfully")
        setOpenFinanceDialog(null)
      } catch (error: any) {
        toast.error(error.message || "Failed to release funds")
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
    setOpenVerifyDialog(id)
  }

  const handleSubmitVerification = (id: number) => {
    startTransition(async () => {
      try {
        await verifyAndCompleteDelivery(id, verifyRemark)
        toast.success("Delivery verified — Work Order COMPLETED")
        setOpenVerifyDialog(null)
        setVerifyRemark("")
      } catch (error) {
        toast.error("Verification failed")
      }
    })
  }

  const handleCreateWorkOrder = (id: number, req: any) => {
    // Pre-fill from existing request data
    setWoAssetNumber(req.site?.siteId || "")
    setWoDescription(`DG fuel required for site ${req.site?.siteId}, total amount ${req.literRequired || 0} liters.`)
    setWoDepartment(req.site?.region || "")
    const now = new Date().toISOString().slice(0, 16)
    setWoScheduledStart(now)
    setWoScheduledEnd(now)
    setOpenWODialog(id)
  }

  const handleSubmitWorkOrder = (id: number) => {
    startTransition(async () => {
      try {
        await createWorkOrder(id, {
          planner: woPlanner,
          assetNumber: woAssetNumber,
          assetGroup: woAssetGroup,
          wbAccountingClass: woWbClass,
          scheduledStart: woScheduledStart,
          scheduledEnd: woScheduledEnd,
          durationHrs: parseFloat(woDuration) || 2,
          workOrderType: woType,
          priority: woPriority,
          description: woDescription,
          department: woDepartment,
          departmentDescription: woDeptDesc,
          assetActivity: woAssetActivity,
          firm: woFirm,
          status: woStatus,
        })
        toast.success("Work Order created and sent to Fuel Supervisor")
        setOpenWODialog(null)
      } catch (error: any) {
        toast.error(error.message || "Failed to create Work Order")
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
                      {req.status === 'PENDING_FLEET_ADMIN' && (userRole === 'FLEET_ADMIN' || userRole === 'ADMIN') && (
                        <Dialog open={openWODialog === req.id} onOpenChange={(open) => { if (!open) setOpenWODialog(null); else handleCreateWorkOrder(req.id, req) }}>
                          <DialogTrigger asChild>
                            <Button size="sm"
                              className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                              Create WO
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="border-b pb-3">
                              <DialogTitle className="text-lg font-bold">Create Work Order</DialogTitle>
                              <DialogDescription className="text-xs text-gray-500">
                                Fields marked with <span className="text-red-500">*</span> are required.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5 py-3">
                              {/* Work Order Information */}
                              <div className="border border-gray-100 rounded-lg p-4 space-y-4">
                                <h3 className="text-xs font-bold text-lime-700 uppercase tracking-widest flex items-center gap-2">
                                  <span className="w-4 h-4 bg-lime-600 text-white rounded text-[10px] flex items-center justify-center">W</span>
                                  Work Order Information
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Work Order <span className="text-gray-400">(auto)</span></Label>
                                    <Input readOnly value={`WO-${1000 + req.id}`} className="h-8 text-sm bg-gray-50 font-mono" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Planner</Label>
                                    <Input value={woPlanner} onChange={e => setWoPlanner(e.target.value)} className="h-8 text-sm" placeholder="Planner name" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Asset Number <span className="text-red-500">*</span></Label>
                                    <Input value={woAssetNumber} onChange={e => setWoAssetNumber(e.target.value)} className="h-8 text-sm" placeholder="e.g. G-11186" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Description</Label>
                                    <Input value={woDescription} onChange={e => setWoDescription(e.target.value)} className="h-8 text-sm" placeholder="Brief description" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Asset Group <span className="text-red-500">*</span></Label>
                                    <Input value={woAssetGroup} onChange={e => setWoAssetGroup(e.target.value)} className="h-8 text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Department</Label>
                                    <Input value={woDepartment} onChange={e => setWoDepartment(e.target.value)} className="h-8 text-sm" placeholder="e.g. PA\T\OM" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">WB Accounting Class <span className="text-red-500">*</span></Label>
                                    <Input value={woWbClass} onChange={e => setWoWbClass(e.target.value)} className="h-8 text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Department Description</Label>
                                    <Input value={woDeptDesc} onChange={e => setWoDeptDesc(e.target.value)} className="h-8 text-sm" placeholder="e.g. NAAC O&M Group" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Scheduled Start <span className="text-red-500">*</span></Label>
                                    <Input type="datetime-local" value={woScheduledStart} onChange={e => setWoScheduledStart(e.target.value)} className="h-8 text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Asset Activity</Label>
                                    <Input value={woAssetActivity} onChange={e => setWoAssetActivity(e.target.value)} className="h-8 text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Scheduled Completion <span className="text-red-500">*</span></Label>
                                    <Input type="datetime-local" value={woScheduledEnd} onChange={e => setWoScheduledEnd(e.target.value)} className="h-8 text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Firm</Label>
                                    <select value={woFirm} onChange={e => setWoFirm(e.target.value)} className="w-full h-8 border border-gray-200 rounded-md px-2 text-sm bg-white">
                                      <option>No</option><option>Yes</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Duration (hrs)</Label>
                                    <Input type="number" value={woDuration} onChange={e => setWoDuration(e.target.value)} className="h-8 text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Status</Label>
                                    <select value={woStatus} onChange={e => setWoStatus(e.target.value)} className="w-full h-8 border border-gray-200 rounded-md px-2 text-sm bg-white">
                                      <option>Draft</option><option>Active</option><option>Complete</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Request Number</Label>
                                    <Input readOnly value={req.workRequestNumber || `REQ-${1000 + req.id}`} className="h-8 text-sm bg-gray-50 font-mono" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Work Order Type</Label>
                                    <select value={woType} onChange={e => setWoType(e.target.value)} className="w-full h-8 border border-gray-200 rounded-md px-2 text-sm bg-white">
                                      <option>Preventive</option><option>Corrective</option><option>Emergency</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Priority</Label>
                                    <select value={woPriority} onChange={e => setWoPriority(e.target.value)} className="w-full h-8 border border-gray-200 rounded-md px-2 text-sm bg-white">
                                      <option>Low</option><option>Medium</option><option>High</option><option>Emergency</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="border-t pt-4">
                              <Button variant="outline" onClick={() => setOpenWODialog(null)} className="uppercase tracking-tight">Cancel</Button>
                              <Button onClick={() => handleSubmitWorkOrder(req.id)} disabled={isPending} className="bg-lime-600 hover:bg-lime-700 text-white uppercase tracking-tight">
                                {isPending ? "Creating..." : "Save & Send to Fuel Supervisor"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {req.status === 'PENDING_MANAGER' && (userRole === 'MANAGER' || userRole === 'ADMIN') && (
                        <Button size="sm" onClick={() => handleApproveToFleetAdmin(req.id)} disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                          Approve
                        </Button>
                      )}
                      {req.status === 'PENDING_FUEL_SUPERVISOR' && (userRole === 'FUEL_SUPERVISOR' || userRole === 'ADMIN') && (
                        <Button size="sm" onClick={() => handleApproveWorkOrder(req.id)} disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                          Approve WO
                        </Button>
                      )}
                      {req.status === 'PENDING_FLEET_MANAGER_FORWARD' && (userRole === 'FLEET_MANAGER' || userRole === 'ADMIN') && (
                        <Button size="sm" onClick={() => handleForwardToFLManager(req.id)} disabled={isPending}
                          className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                          Forward to F&L Manager
                        </Button>
                      )}
                      {req.status === 'PENDING_FUND_RELEASE_FL_MANAGER' && (userRole === 'FL_COUNTRY_MANAGER' || userRole === 'ADMIN') && (
                        <Dialog open={openFinanceDialog === req.id} onOpenChange={(open) => setOpenFinanceDialog(open ? req.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="h-7 px-3 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-semibold uppercase tracking-tight shadow-none">
                              Release to Fleet Manager
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Release Funds for Work Order {req.workOrderNumber}</DialogTitle>
                              <DialogDescription>
                                Specify the amount to release to the Fleet Manager.
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
                              <Button onClick={() => handleReleaseFundsToFleetManager(req.id)} disabled={isPending} className="bg-lime-600 hover:bg-lime-700 text-white">Confirm Release</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {req.status === 'FUNDS_RELEASED_TO_FLEET_MANAGER' && (userRole === 'FLEET_MANAGER' || userRole === 'ADMIN') && (
                        <Dialog open={openFinanceDialog === req.id} onOpenChange={(open) => setOpenFinanceDialog(open ? req.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="h-7 px-3 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-semibold uppercase tracking-tight shadow-none">
                              Release to Fleet Admin
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Release Funds to Fleet Admin</DialogTitle>
                              <DialogDescription>
                                Specify the amount to release to the Fleet Admin's wallet for fuel purchase.
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
                              <Button onClick={() => handleReleaseFundsToFleetAdmin(req.id)} disabled={isPending} className="bg-lime-600 hover:bg-lime-700 text-white">Confirm Release</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {req.status === 'FUNDS_RELEASED_TO_FLEET_ADMIN' && (userRole === 'FLEET_ADMIN' || userRole === 'ADMIN') && (
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
                        <Dialog open={openVerifyDialog === req.id} onOpenChange={(open) => { if (!open) { setOpenVerifyDialog(null); setVerifyRemark("") } else setOpenVerifyDialog(req.id) }}>
                          <DialogTrigger asChild>
                            <Button size="sm"
                              className="h-7 px-3 text-[11px] bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-none">
                              Verify &amp; Close
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader className="border-b pb-3">
                              <DialogTitle className="text-base font-bold">Verify Delivery &amp; Close Work Order</DialogTitle>
                              <DialogDescription className="text-xs text-gray-500">
                                Review delivery details and close this Work Order as COMPLETED.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-3">
                              {/* Delivery Summary */}
                              <div className="bg-lime-50 border border-lime-100 rounded-lg p-4 space-y-2">
                                <p className="text-[11px] font-bold text-lime-700 uppercase tracking-widest">Delivery Summary</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-gray-500 text-xs">Work Order</span><p className="font-mono font-semibold">{req.workOrderNumber || "N/A"}</p></div>
                                  <div><span className="text-gray-500 text-xs">Site</span><p className="font-semibold">{req.site?.siteId} – {req.site?.name}</p></div>
                                  <div><span className="text-gray-500 text-xs">Fuel Requested</span><p className="font-semibold">{req.literRequired ?? "–"} L</p></div>
                                  <div><span className="text-gray-500 text-xs">Fuel Purchased</span><p className="font-semibold">{req.purchasedAmount ?? "–"} L</p></div>
                                  <div><span className="text-gray-500 text-xs">Technician</span><p className="font-semibold">{req.technician?.name || "–"}</p></div>
                                  <div><span className="text-gray-500 text-xs">Fuel Station</span><p className="font-semibold">{req.fuelStation || "–"}</p></div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold">Closing Remark (Optional)</Label>
                                <textarea
                                  value={verifyRemark}
                                  onChange={e => setVerifyRemark(e.target.value)}
                                  placeholder="Add any closing notes or observations..."
                                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-lime-500 outline-none resize-y min-h-[70px]"
                                />
                              </div>
                            </div>
                            <DialogFooter className="border-t pt-4">
                              <Button variant="outline" onClick={() => { setOpenVerifyDialog(null); setVerifyRemark("") }} className="uppercase tracking-tight">Cancel</Button>
                              <Button onClick={() => handleSubmitVerification(req.id)} disabled={isPending} className="bg-lime-600 hover:bg-lime-700 text-white uppercase tracking-tight">
                                {isPending ? "Closing..." : "Confirm &amp; Close"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {(req.status === 'ASSIGNED_TO_TECH' || req.status === 'FUNDS_RELEASED_TO_FLEET_ADMIN') && (userRole === 'TECHNICIAN' || userRole === 'ADMIN') && (
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
