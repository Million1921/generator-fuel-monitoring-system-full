"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { createFuelDelivery, getPendingRequests, getDeliverySites } from "@/features/fuel-requests/actions"
import { getTransactions } from "@/features/transactions/actions"
import { toast } from "sonner"
import { FuelDeliveryFormSchema, FuelDeliveryFormValues } from "@/schemas/fuel"

export default function NewFuelDeliveryPage() {
  const router = useRouter()
  const [requests, setRequests] = React.useState<any[]>([])
  const [sites, setSites] = React.useState<any[]>([])
  const [transactions, setTransactions] = React.useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FuelDeliveryFormValues>({
    resolver: zodResolver(FuelDeliveryFormSchema),
    defaultValues: {
      siteId: "",
      workOrderNumber: "",
      begRunningHour: 0,
      endRunningHour: 0,
      fuelBeforeRefuel: 0,
      actualRefueled: 0,
      unitPrice: 76.5,
      guardName: "",
      guardSource: "",
      requestId: "",
    },
  })

  // Watch fields for custom triggers
  const actualRefueledValue = watch("actualRefueled")
  const unitPriceValue = watch("unitPrice")

  React.useEffect(() => {
    getPendingRequests().then(setRequests)
    getDeliverySites().then(setSites)
    getTransactions().then(res => {
      setTransactions(res)
      
      // Auto-fill if tx param exists in URL
      const params = new URLSearchParams(window.location.search);
      const txId = params.get("tx");
      if (txId) {
        const tx = res.find(t => t.id.toString() === txId);
        if (tx) {
          if (tx.siteId) setValue("siteId", tx.siteId.toString());
          if (tx.paidAmount) setValue("actualRefueled", tx.paidAmount);
          setValue("unitPrice", 92.5);
          toast.success(`Integrated data from Transaction #${tx.receiptNo}`);
        }
      }
    })
  }, [setValue])

  const handleTransactionChange = (txId: string) => {
    if (txId === "none") return;
    const tx = transactions.find(t => t.id.toString() === txId);
    if (tx) {
      if (tx.siteId) setValue("siteId", tx.siteId.toString());
      if (tx.paidAmount) setValue("actualRefueled", tx.paidAmount);
      setValue("unitPrice", 92.5); // Default unit price if not in transaction
      toast.info(`Auto-filled from transaction #${tx.receiptNo}`);
    }
  }

  async function onSubmit(data: FuelDeliveryFormValues) {
    setIsSubmitting(true)

    const deliveryPayload = {
      siteId: data.siteId,
      requestId: data.requestId !== "none" ? data.requestId : undefined,
      workOrderNumber: data.workOrderNumber,
      begRunningHour: data.begRunningHour,
      endRunningHour: data.endRunningHour,
      actualRefueled: data.actualRefueled,
      fuelBeforeRefuel: data.fuelBeforeRefuel,
      unitPrice: data.unitPrice,
      driverName: data.guardName || undefined,
      driverId: data.guardSource || undefined,
    }

    try {
      await createFuelDelivery(deliveryPayload)
      toast.success("Fuel delivery recorded successfully")
      router.refresh()
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(`Failed to record: ${error.message || error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between px-2">
        <h1 className="text-2xl font-bold tracking-tight">Record Fuel Delivery</h1>
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 ml-5">
          
          <div className="space-y-2 mb-6 p-4 bg-lime-50/50 rounded-lg border border-lime-100">
            <Label htmlFor="transactionId" className="text-lime-700 font-bold flex items-center gap-2">
              <span className="bg-lime-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase">Step 1</span> 
              Import from Transaction (Original Data)
            </Label>
            <Select onValueChange={handleTransactionChange}>
              <SelectTrigger className="bg-white border-lime-200 focus:ring-lime-500">
                <SelectValue placeholder="Select a transaction to auto-fill..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Manual Entry (No Transaction)</SelectItem>
                {transactions.map((tx) => (
                  <SelectItem key={tx.id} value={tx.id.toString()}>
                    {tx.receiptNo || "N/A"} - {tx.payerName || "Unknown"} ({tx.paidAmount} L)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-lime-600 italic">Select a transaction to automatically populate site and fuel data.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requestId">Select Work Request (Optional)</Label>
              <Controller
                name="requestId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to a pending request" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Manual Entry</SelectItem>
                      {requests.map((req) => (
                        <SelectItem key={req.id} value={req.id.toString()}>
                          {req.workOrderNumber} - {req.site.siteId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteId">Select Site <span className="text-red-500">*</span></Label>
              <Controller
                name="siteId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target site" />
                    </SelectTrigger>
                    <SelectContent>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="workOrderNumber">Work Order Number <span className="text-red-500">*</span></Label>
            <Input 
              id="workOrderNumber" 
              placeholder="Enter WO number (e.g. WO-1234)" 
              {...register("workOrderNumber")}
            />
            {errors.workOrderNumber && (
              <p className="text-xs text-red-500 font-medium">{errors.workOrderNumber.message}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Generator Hours</h2>
              <div className="space-y-2">
                <Label htmlFor="begRunningHour">Beginning Running Hour</Label>
                <Input id="begRunningHour" type="number" step="0.1" {...register("begRunningHour")} />
                {errors.begRunningHour && (
                  <p className="text-xs text-red-500 font-medium">{errors.begRunningHour.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endRunningHour">Ending Running Hour</Label>
                <Input id="endRunningHour" type="number" step="0.1" {...register("endRunningHour")} />
                {errors.endRunningHour && (
                  <p className="text-xs text-red-500 font-medium">{errors.endRunningHour.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Fuel Details</h2>
              <div className="space-y-2">
                <Label htmlFor="fuelBeforeRefuel">Fuel Before Refuel (L)</Label>
                <Input id="fuelBeforeRefuel" type="number" step="0.1" {...register("fuelBeforeRefuel")} />
                {errors.fuelBeforeRefuel && (
                  <p className="text-xs text-red-500 font-medium">{errors.fuelBeforeRefuel.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualRefueled">Actual Refueled amount (L) <span className="text-red-500">*</span></Label>
                <Input 
                  id="actualRefueled" 
                  type="number" 
                  step="0.1" 
                  {...register("actualRefueled")} 
                />
                {errors.actualRefueled && (
                  <p className="text-xs text-red-500 font-medium">{errors.actualRefueled.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (Birr) <span className="text-red-500">*</span></Label>
                <Input 
                  id="unitPrice" 
                  type="number" 
                  step="0.01" 
                  {...register("unitPrice")} 
                />
                {errors.unitPrice && (
                  <p className="text-xs text-red-500 font-medium">{errors.unitPrice.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Security Info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guardName">Guard Name</Label>
                <Input id="guardName" placeholder="Enter guard name" {...register("guardName")} />
                {errors.guardName && (
                  <p className="text-xs text-red-500 font-medium">{errors.guardName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardSource">Guard Source</Label>
                <Input id="guardSource" placeholder="e.g. SEC-01" {...register("guardSource")} />
                {errors.guardSource && (
                  <p className="text-xs text-red-500 font-medium">{errors.guardSource.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Delivery"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
