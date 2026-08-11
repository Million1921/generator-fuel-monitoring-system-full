"use client"

import * as React from "react"
import { PlusCircle, Truck, Fuel, User, Wrench, ClipboardCheck, BarChart3, BadgeDollarSign } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { createFuelDelivery, getDeliverySites, getApprovedRequests } from "@/features/fuel-requests/actions"

export function FuelDeliverySheet() {
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [sites, setSites] = React.useState<any[]>([])
  const [approvedRequests, setApprovedRequests] = React.useState<any[]>([])
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>("")
  const [begRunningHour, setBegRunningHour] = React.useState<string>("")
  const [endRunningHour, setEndRunningHour] = React.useState<string>("")
  const [actualRefueled, setActualRefueled] = React.useState<string>("")
  const [workOrderNumber, setWorkOrderNumber] = React.useState<string>("")
  const [requestId, setRequestId] = React.useState<string>("")
  const [technicianName, setTechnicianName] = React.useState<string>("")
  const [technicianIdInput, setTechnicianIdInput] = React.useState<string>("")
  const [department, setDepartment] = React.useState<string>("")
  const [driverName, setDriverName] = React.useState<string>("")
  const [driverIdInput, setDriverIdInput] = React.useState<string>("")
  const router = useRouter()

  const selectedSite = sites.find((s: any) => s.id.toString() === selectedSiteId)
  const stdConsumption = selectedSite?.generator?.stdFuelConsumption || 0
  const tankerCapacity = selectedSite?.tankerCapacity || 0

  const selectedRequest = approvedRequests.find((r: any) => r.id.toString() === requestId)

  const diffHours = (parseFloat(endRunningHour) || 0) - (parseFloat(begRunningHour) || 0)
  const expectedFuel = diffHours > 0 ? (diffHours * stdConsumption) : 0

  React.useEffect(() => {
    const siteIdParam = searchParams.get("siteId")
    const requestIdParam = searchParams.get("requestId")
    const workOrderParam = searchParams.get("workOrder")
    const openParam = searchParams.get("open")

    if (siteIdParam || requestIdParam || workOrderParam || openParam === "true") {
      if (siteIdParam) setSelectedSiteId(siteIdParam)
      if (requestIdParam) setRequestId(requestIdParam)
      if (workOrderParam) setWorkOrderNumber(workOrderParam)
      setOpen(true)
    }
  }, [searchParams])

  React.useEffect(() => {
    if (open) {
      getDeliverySites().then(setSites)
      getApprovedRequests().then((reqs) => {
        setApprovedRequests(reqs)
        const reqId = searchParams.get("requestId")
        if (reqId) {
          const req = reqs.find((r: any) => r.id.toString() === reqId)
          if (req?.technician) {
            setTechnicianName(req.technician.name || "")
            setTechnicianIdInput(req.technician.userId || req.technician.id.toString() || "")
            setDepartment(req.technician.department || "")
          }
          if (req) {
            if (req.driverName) setDriverName(req.driverName)
            if (req.employeeId) setDriverIdInput(req.employeeId)
          }
        }
      })
      if (!searchParams.get("siteId") && !searchParams.get("workOrder")) {
        setSelectedSiteId("")
        setBegRunningHour("")
        setEndRunningHour("")
        setActualRefueled("")
        setWorkOrderNumber("")
        setRequestId("")
        setTechnicianName("")
        setTechnicianIdInput("")
        setDepartment("")
        setDriverName("")
        setDriverIdInput("")
      }
    }
  }, [open, searchParams])

  const handleWorkOrderChange = (value: string) => {
    setRequestId(value)
    const req = approvedRequests.find((r: any) => r.id.toString() === value)
    if (req) {
      setWorkOrderNumber(req.workOrderNumber)
      setSelectedSiteId(req.siteId.toString())
      if (req.technician) {
        setTechnicianName(req.technician.name || "")
        setTechnicianIdInput(req.technician.userId || req.technician.id.toString() || "")
        setDepartment(req.technician.department || "")
      }
      if (req.driverName) setDriverName(req.driverName)
      if (req.employeeId) setDriverIdInput(req.employeeId)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      siteId: selectedSiteId,
      begRunningHour: parseFloat(begRunningHour),
      endRunningHour: parseFloat(endRunningHour),
      actualRefueled: parseFloat(actualRefueled),
      fuelBeforeRefuel: parseFloat(formData.get("fuelBeforeRefuel") as string),
      unitPrice: parseFloat(formData.get("unitPrice") as string),
      driverName: formData.get("driverName") as string || undefined,
      driverId: formData.get("driverId") as string || undefined,
      technicianName: formData.get("technicianName") as string || undefined,
      technicianId: formData.get("technicianId") as string || undefined,
      employmentType: formData.get("employmentType") as string || undefined,
      workOrderNumber: workOrderNumber,
      requestId: requestId || undefined,
      eepu: formData.get("eepu") ? parseFloat(formData.get("eepu") as string) : undefined,
      remark: formData.get("remark") as string || undefined,
      department: formData.get("department") as string || undefined,
    }

    try {
      await createFuelDelivery(data)
      toast.success("Fuel delivery recorded successfully")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to record: ${error.message || error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-lime-500 hover:bg-lime-600 text-white shadow-sm text-sm h-9">
          <PlusCircle className="mr-2 h-4 w-4" />
          Log Delivery
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl p-0 border-none overflow-y-auto bg-gray-50/50" side="right">
        <SheetHeader className="bg-gradient-to-r from-lime-600 to-lime-500 p-6 shadow-sm sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 opacity-90" />
            Record Fuel Delivery
          </SheetTitle>
          <SheetDescription className="text-lime-50 text-sm mt-1 font-medium italic opacity-90">
            Log the details of a fuel delivery for a pending work request.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="p-6 space-y-6">

          {/* Section 1: Work Order & Site */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <ClipboardCheck className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">1. Work Order & Site</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requestId" className="text-sm font-semibold text-gray-700">
                  Select Approved Work Order <span className="text-red-500">*</span>
                </Label>
                <Select value={requestId} onValueChange={handleWorkOrderChange} required>
                  <SelectTrigger className="h-10 border-gray-200 focus:ring-lime-500">
                    <SelectValue placeholder="Select a pending Work Order" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {approvedRequests.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 italic">No approved work orders found</div>
                    ) : (
                      approvedRequests.map((req: any) => (
                        <SelectItem key={req.id} value={req.id.toString()}>
                          {req.workOrderNumber} - Site: {req.site.siteId} ({req.literRequired}L)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedRequest && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-tight">Request Details</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">Requested: <span className="font-bold text-gray-900">{selectedRequest.literRequired} Liters</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-tight">Priority</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedRequest.priority}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="siteId" className="text-sm font-semibold text-gray-700">
                  Site <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId} disabled={!!requestId} required>
                  <SelectTrigger className="h-10 border-gray-200 focus:ring-lime-500 bg-gray-50">
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {sites.map((site: any) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.siteId} - {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSite && (
                <div className="bg-lime-50/70 p-4 rounded-xl border border-lime-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-lime-600">Std Consumption</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{stdConsumption} L/hr</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-lime-600">Tanker Capacity</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{tankerCapacity} L</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Delivery Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <BarChart3 className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">2. Delivery Metrics</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="begRunningHour" className="text-sm font-semibold text-gray-700">Beginning Running Hour <span className="text-red-500">*</span></Label>
                <Input
                  id="begRunningHour"
                  value={begRunningHour}
                  onChange={(e) => setBegRunningHour(e.target.value)}
                  type="number" step="0.1" placeholder="0.0" required className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endRunningHour" className="text-sm font-semibold text-gray-700">Ending Running Hour <span className="text-red-500">*</span></Label>
                <Input
                  id="endRunningHour"
                  value={endRunningHour}
                  onChange={(e) => setEndRunningHour(e.target.value)}
                  type="number" step="0.1" placeholder="0.0" required className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>

              {diffHours !== 0 && (
                <div className="sm:col-span-2 bg-lime-50/70 p-4 rounded-xl border border-lime-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-lime-600">Total Run Hours</p>
                    <p className="text-base font-bold text-lime-800 mt-0.5">{diffHours.toFixed(1)} hrs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-lime-600">Expected Fuel Usage</p>
                    <p className="text-base font-bold text-lime-800 mt-0.5">{expectedFuel.toFixed(2)} L</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fuelBeforeRefuel" className="text-sm font-semibold text-gray-700">Fuel Before Refuel (L) <span className="text-red-500">*</span></Label>
                <Input id="fuelBeforeRefuel" name="fuelBeforeRefuel" type="number" step="0.1" placeholder="0.0" required className="h-10 border-gray-200 focus:ring-lime-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualRefueled" className="text-sm font-semibold text-gray-700">Actual Refueled (L) <span className="text-red-500">*</span></Label>
                <Input
                  id="actualRefueled"
                  value={actualRefueled}
                  onChange={(e) => setActualRefueled(e.target.value)}
                  type="number" step="0.1" placeholder="0.0" required className="h-10 border-gray-200 focus:ring-lime-500 font-bold"
                />
              </div>

              {parseFloat(actualRefueled) > 0 && expectedFuel > 0 && (
                <div className={cn(
                  "sm:col-span-2 p-4 rounded-xl border flex items-center justify-between",
                  Math.abs(parseFloat(actualRefueled) - expectedFuel) > (expectedFuel * 0.2)
                    ? "bg-red-50 border-red-100"
                    : "bg-lime-50 border-lime-100"
                )}>
                  <p className="text-xs font-semibold text-gray-700">
                    {Math.abs(parseFloat(actualRefueled) - expectedFuel) > (expectedFuel * 0.2)
                      ? "⚠️ High deviation from expected consumption."
                      : "✅ Within normal consumption range."}
                  </p>
                  <p className="text-xs font-bold text-gray-900">
                    Diff: {Math.abs(parseFloat(actualRefueled) - expectedFuel).toFixed(1)} L
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <BadgeDollarSign className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">3. Pricing & Readings</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="unitPrice" className="text-sm font-semibold text-gray-700">Unit Price (Birr) <span className="text-red-500">*</span></Label>
                <Input id="unitPrice" name="unitPrice" type="number" step="0.01" defaultValue="70.50" required className="h-10 border-gray-200 focus:ring-lime-500 font-medium text-lime-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eepu" className="text-sm font-semibold text-gray-700">EEPU Reading</Label>
                <Input id="eepu" name="eepu" type="number" step="0.1" placeholder="Optional grid power reading" className="h-10 border-gray-200 focus:ring-lime-500" />
              </div>
            </div>
          </div>

          {/* Section 4: Personnel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <User className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">4. Personnel Details</h3>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Employment Type</Label>
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="employmentType" value="EMPLOYEE" className="text-lime-600 focus:ring-lime-500" defaultChecked />
                    <span className="text-sm font-medium text-gray-700">Employee</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="employmentType" value="CONTRACT" className="text-lime-600 focus:ring-lime-500" />
                    <span className="text-sm font-medium text-gray-700">Contract</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="technicianName" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-gray-400" /> Technician Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="technicianName" name="technicianName" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} placeholder="Full name" className="h-10 border-gray-200 focus:ring-lime-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technicianId" className="text-sm font-semibold text-gray-700">Technician ID <span className="text-red-500">*</span></Label>
                  <Input id="technicianId" name="technicianId" value={technicianIdInput} onChange={(e) => setTechnicianIdInput(e.target.value)} placeholder="e.g. TECH-01" className="h-10 border-gray-200 focus:ring-lime-500" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driverName" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-gray-400" /> Driver Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="driverName" name="driverName" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Full name" className="h-10 border-gray-200 focus:ring-lime-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverId" className="text-sm font-semibold text-gray-700">Driver ID / License <span className="text-red-500">*</span></Label>
                  <Input id="driverId" name="driverId" value={driverIdInput} onChange={(e) => setDriverIdInput(e.target.value)} placeholder="e.g. DRV-01" className="h-10 border-gray-200 focus:ring-lime-500" required />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="department" className="text-sm font-semibold text-gray-700">Department</Label>
                  <Input id="department" name="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. NAZO&M" className="h-10 border-gray-200 focus:ring-lime-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Remarks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Fuel className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">5. Additional Remarks</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark" className="text-sm font-semibold text-gray-700">Remark / Notes</Label>
              <textarea
                id="remark"
                name="remark"
                placeholder="Enter any additional details or remarks..."
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none resize-y min-h-[80px] text-sm text-gray-700 bg-gray-50/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="px-6 h-10 font-semibold text-gray-500 hover:bg-gray-50 uppercase tracking-tight">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-8 h-10 bg-lime-600 hover:bg-lime-700 text-white font-bold uppercase tracking-tight shadow-sm">
              {isSubmitting ? "Recording..." : "Record Delivery"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
