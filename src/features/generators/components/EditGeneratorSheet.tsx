"use client"

import * as React from "react"
import { Pencil, Cpu, Zap, Clock, Hash, Gauge } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { updateGenerator } from "@/features/generators/actions"

export function EditGeneratorSheet({ generator }: { generator: any }) {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      model: formData.get("model") as string,
      serialNumber: formData.get("serialNumber") as string,
      capacityKVA: formData.get("capacityKVA") as string,
      stdFuelConsumption: formData.get("stdFuelConsumption") as string,
      lastRunningHours: formData.get("lastRunningHours") as string,
    }

    try {
      await updateGenerator(generator.id, data)
      toast.success("Generator updated successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update generator")
      console.error(error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-lime-600 hover:bg-lime-50 hover:text-lime-700">
          <Pencil className="h-3 w-3" />
          <span className="sr-only">Edit</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl p-0 border-none overflow-y-auto bg-gray-50/50">
        <SheetHeader className="bg-gradient-to-r from-lime-600 to-lime-500 p-6 shadow-sm sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 opacity-90" />
            Edit Generator
          </SheetTitle>
          <SheetDescription className="text-lime-50 text-sm mt-1 font-medium italic opacity-90">
            Update details for generator <span className="font-bold not-italic">{generator.genId}</span> — {generator.model || "No model"}.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Section 1: Generator Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Cpu className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">1. Generator Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-gray-400" /> Model / Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="model"
                  name="model"
                  defaultValue={generator.model || ""}
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-gray-400" /> Serial Number
                </Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  defaultValue={generator.serialNumber || ""}
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Performance Specs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Zap className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">2. Performance Specs</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="capacityKVA" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-gray-400" /> Capacity (KVA) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacityKVA"
                  name="capacityKVA"
                  type="number"
                  step="0.1"
                  defaultValue={generator.capacityKVA?.toString() || "0"}
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stdFuelConsumption" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-gray-400" /> Std Fuel (L/hr) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stdFuelConsumption"
                  name="stdFuelConsumption"
                  type="number"
                  step="0.01"
                  defaultValue={generator.stdFuelConsumption?.toString() || "0"}
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastRunningHours" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> Running Hours <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastRunningHours"
                  name="lastRunningHours"
                  type="number"
                  step="0.1"
                  defaultValue={generator.lastRunningHours?.toString() || "0"}
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="px-6 h-10 font-bold text-gray-500 hover:bg-gray-50 uppercase tracking-tight">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="px-8 h-10 bg-lime-600 hover:bg-lime-700 text-white font-bold uppercase tracking-tight shadow-sm">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
