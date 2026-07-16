"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ClipboardList, Truck, Fuel, MessageSquare, Shield, Clock, MapPin, Phone, User, CalendarClock } from "lucide-react"
import { createFuelRequest } from "@/features/fuel-requests/actions"
import { getSites } from "@/features/sites/actions"
import { getTechnicians } from "@/features/technicians/actions"
import { toast } from "sonner"
import { FuelRequestFormSchema, FuelRequestFormValues } from "@/schemas/fuel"

interface Site {
  id: number;
  siteId: string;
  name: string;
}

interface Technician {
  id: number;
  name: string | null;
}

export function FuelRequestSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [sites, setSites] = React.useState<Site[]>([])
  const [technicians, setTechnicians] = React.useState<Technician[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FuelRequestFormValues>({
    resolver: zodResolver(FuelRequestFormSchema),
    defaultValues: {
      priority: "ROUTINE",
      notifyUser: true,
      requesterEmail: "million.tesfahun@ethiotelecom.et",
      contactPreference: "email",
      driverType: "employ",
      siteId: "",
      department: "",
      requestedForId: "",
      requestDescription: "",
      additionalDescription: "",
      requesterPhone: "",
      driverName: "",
      technicianId: "",
      literRequired: 0,
      remark: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      getSites().then(setSites)
      getTechnicians().then(res => {
        if (res && res.technicians) {
          setTechnicians(res.technicians.map(t => ({
            id: Number(t.id),
            name: t.name || "Unnamed Technician", // FIXED: References t.name directly instead of the empty t.user?.name
          })))
        }
      })
    }
  }, [open])

  async function onSubmit(data: FuelRequestFormValues) {
    setIsSubmitting(true)

    // Build the request matching backend Action interface
    const requestData = {
      siteId: data.siteId,
      priority: data.priority,
      literRequired: data.literRequired,
      technicianId: data.technicianId || undefined,
      remark: data.remark || undefined,
      runningHour: data.runningHour || undefined,
      securityName: data.securityName || undefined,
      route: data.route || undefined,
      driverName: data.driverName || undefined,
      driverType: data.driverType || undefined,
      driverPhone: data.driverPhone || undefined,
      employeeId: data.employeeId || undefined,
    }

    try {
      await createFuelRequest(requestData)
      toast.success("Work request submitted successfully")
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to submit request")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get current date time for display
  const [currentDateTime, setCurrentDateTime] = React.useState("")
  React.useEffect(() => {
    const now = new Date()
    setCurrentDateTime(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`)
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl p-0 border-none overflow-y-auto bg-gray-50/50 dark:bg-neutral-900" side="right">
        <SheetHeader className="bg-gradient-to-r from-lime-600 to-lime-500 p-6 shadow-sm sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 opacity-90" />
            Generator Fuel Request
          </SheetTitle>
          <SheetDescription className="text-lime-50 text-sm mt-1 font-medium italic opacity-90">
            Submit a new fuel request, assign drivers, and outline delivery requirements.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          {/* Section 1: CREATE WORK REQUEST */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <ClipboardList className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">1. Descriptive Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="siteId" className="text-sm font-semibold text-gray-700">Site Number <span className="text-red-500">*</span></Label>
                <Controller
                  name="siteId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10 border-gray-200 focus:ring-lime-500">
                        <SelectValue placeholder="Select site..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id.toString()}>
                            {site.siteId} - {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.siteId && (
                  <p className="text-xs text-red-500 font-medium">{errors.siteId.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-semibold text-gray-700">Assign Department</Label>
                <Input id="department" {...register("department")} placeholder="e.g. Facilities" className="h-10 border-gray-200 focus:ring-lime-500" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Requested Date & Time</Label>
                <Input value={currentDateTime} disabled className="h-10 bg-gray-50 border-gray-100 text-gray-500 italic" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedForId" className="text-sm font-semibold text-gray-700">Requested For ID <span className="text-red-500">*</span></Label>
                <Input id="requestedForId" {...register("requestedForId")} placeholder="e.g. ETHIO19492" className="h-10 border-gray-200 focus:ring-lime-500" />
                {errors.requestedForId && (
                  <p className="text-xs text-red-500 font-medium">{errors.requestedForId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">Priority Level</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10 border-gray-200 focus:ring-lime-500">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="EMERGENCY" className="text-red-600 font-bold">Emergency</SelectItem>
                        <SelectItem value="HIGH" className="text-orange-600 font-semibold">High</SelectItem>
                        <SelectItem value="MEDIUM" className="text-lime-600">Medium</SelectItem>
                        <SelectItem value="LOW" className="text-gray-600">Low</SelectItem>
                        <SelectItem value="ROUTINE">Routine</SelectItem>
                        <SelectItem value="URGENT" className="text-red-500">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2 flex flex-col justify-end pb-1">
                <div className="flex items-center gap-3 bg-lime-50/50 p-2 rounded-lg border border-lime-100/50">
                  <Controller
                    name="notifyUser"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="notifyUser"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="notifyUser" className="text-xs font-semibold text-lime-700 uppercase cursor-pointer">Notify User via SMS/Email</Label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="employeeId" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400"/> Employee ID No.</Label>
                <Input id="employeeId" {...register("employeeId")} placeholder="e.g. ETHIO19492" className="h-9 text-sm border-gray-200 focus:ring-lime-500 bg-gray-50/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="runningHour" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400"/> Running Hr</Label>
                <Input id="runningHour" type="number" step="0.1" {...register("runningHour")} placeholder="Current hours" className="h-9 text-sm border-gray-200 focus:ring-lime-500 bg-gray-50/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="securityName" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-gray-400"/> Security Name</Label>
                <Input id="securityName" {...register("securityName")} placeholder="Site security name" className="h-9 text-sm border-gray-200 focus:ring-lime-500 bg-gray-50/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="route" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400"/> Route</Label>
                <Input id="route" {...register("route")} placeholder="Delivery route" className="h-9 text-sm border-gray-200 focus:ring-lime-500 bg-gray-50/50" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="requestDescription" className="text-xs font-bold text-gray-600 uppercase">Request Description</Label>
                <Textarea id="requestDescription" {...register("requestDescription")} placeholder="Main purpose of this request..." rows={2} className="border-gray-200 focus:ring-lime-500 text-sm resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="additionalDescription" className="text-xs font-bold text-gray-600 uppercase">Additional Details</Label>
                <Textarea id="additionalDescription" {...register("additionalDescription")} placeholder="Extra information..." rows={2} className="border-gray-200 focus:ring-lime-500 text-sm resize-none" />
              </div>
            </div>
          </div>

          {/* Section 2: Requester & Driver Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Truck className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">2. Requester & Personnel</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="requesterEmail" className="text-sm font-semibold text-gray-700">Email Address</Label>
                <Input id="requesterEmail" type="email" {...register("requesterEmail")} className="h-10 border-gray-200" />
                {errors.requesterEmail && (
                  <p className="text-xs text-red-500 font-medium">{errors.requesterEmail.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="requesterPhone" className="text-sm font-semibold text-gray-700">Phone Number <span className="text-red-500">*</span></Label>
                <Input id="requesterPhone" type="tel" {...register("requesterPhone")} placeholder="+251..." className="h-10 border-gray-200" />
                {errors.requesterPhone && (
                  <p className="text-xs text-red-500 font-medium">{errors.requesterPhone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Contact Preference</Label>
                <Controller
                  name="contactPreference"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center gap-6 h-10">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="c-email" />
                        <Label htmlFor="c-email" className="text-xs font-semibold text-gray-600 uppercase">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="c-phone" />
                        <Label htmlFor="c-phone" className="text-xs font-semibold text-gray-600 uppercase">Phone</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>
            </div>

            <div className="bg-lime-50/50 p-5 rounded-xl border border-lime-100/60 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="driverType" className="text-xs font-bold text-gray-600 uppercase">Driver Type</Label>
                  <Controller
                    name="driverType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-9 bg-white border-lime-200 focus:ring-lime-500 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="employ">Employee</SelectItem>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="third_party">Third Party</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="driverName" className="text-xs font-bold text-gray-600 uppercase">Driver Name</Label>
                  <Input id="driverName" {...register("driverName")} className="h-9 bg-white border-lime-200 focus:ring-lime-500 text-sm" />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="driverPhone" className="text-xs font-bold text-gray-600 uppercase">Driver / Fuel Admin Phone No</Label>
                  <Input id="driverPhone" {...register("driverPhone")} placeholder="+251..." className="h-9 bg-white border-lime-200 focus:ring-lime-500 text-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="space-y-1.5">
                  <Label htmlFor="technicianId" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400"/> Technician Name</Label>
                  <Controller
                    name="technicianId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="technicianId" className="h-9 bg-white border-gray-200 focus:ring-lime-500 text-sm">
                          <SelectValue placeholder="Select technician..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id.toString()}>
                              {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="literRequired" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-red-500"/> Liter Required <span className="text-red-500">*</span></Label>
                  <Input id="literRequired" type="number" step="0.01" {...register("literRequired")} className="h-9 bg-white border-gray-200 focus:ring-lime-500 font-bold text-lime-700 text-sm" />
                  {errors.literRequired && (
                    <p className="text-xs text-red-500 font-medium">{errors.literRequired.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mt-5">
                <Label htmlFor="remark" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-gray-400"/> Remark</Label>
                <Textarea id="remark" {...register("remark")} placeholder="Any final comments..." rows={2} className="border-gray-200 focus:ring-lime-500 text-sm resize-none bg-gray-50/50" />
              </div>
            </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 -mx-6 -mb-6 p-4 px-6 flex flex-col sm:flex-row items-center justify-between shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">
            <p className="text-xs text-gray-500 font-medium hidden sm:block">Please verify all required fields (*) before submitting.</p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none px-6 h-10 font-semibold text-gray-600 border-gray-300 hover:bg-gray-100 uppercase tracking-tight text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none px-8 h-10 bg-lime-600 hover:bg-lime-700 text-white font-semibold uppercase tracking-tight shadow-md text-xs transition-colors">
                {isSubmitting ? "Submitting..." : "Apply Request"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
