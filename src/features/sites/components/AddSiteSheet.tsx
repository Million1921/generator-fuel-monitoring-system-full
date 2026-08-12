"use client"

import * as React from "react"
import { Plus, MapPin, Building2, Gauge, Navigation } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ADDIS_ABABA_REGIONS, OUTSIDE_ADDIS_REGIONS } from "@/lib/constants"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createSite } from "@/features/sites/actions"
import { formatGpsCoordinates } from "@/lib/utils"
import { useAppRole } from "@/components/providers/role-provider"

export function AddSiteSheet() {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const [lat, setLat] = React.useState("")
  const [lng, setLng] = React.useState("")
  const router = useRouter()
  const userRole = useAppRole()

  if (userRole !== "ADMIN") return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)

    const formData = new FormData(event.currentTarget)

    const latVal = parseFloat(lat)
    const lngVal = parseFloat(lng)
    const gpsCoordinates =
      !Number.isNaN(latVal) && !Number.isNaN(lngVal)
        ? formatGpsCoordinates(latVal, lngVal)
        : undefined

    const data = {
      siteId: formData.get("siteId") as string,
      name: formData.get("name") as string,
      region: formData.get("region") as string,
      tankerCapacity: formData.get("tankerCapacity") as string,
      gpsCoordinates,
    }

    try {
      await createSite(data)
      toast.success("Site created successfully")
      setOpen(false)
      setLat("")
      setLng("")
      router.refresh()
    } catch (error) {
      toast.error("Failed to create site")
      console.error(error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2 bg-lime-600 hover:bg-lime-700 text-white font-bold uppercase tracking-tight">
          <Plus className="h-4 w-4" />
          Add New Site
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl p-0 border-none overflow-y-auto bg-gray-50/50">
        <SheetHeader className="bg-gradient-to-r from-lime-600 to-lime-500 p-6 shadow-sm sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 opacity-90" />
            Add New Site
          </SheetTitle>
          <SheetDescription className="text-lime-50 text-sm mt-1 font-medium italic opacity-90">
            Register a new generator site with location and capacity information.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Section 1: Site Identity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building2 className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">1. Site Identity</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="siteId" className="text-sm font-semibold text-gray-700">
                  Site ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="siteId"
                  name="siteId"
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Site Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="region" className="text-sm font-semibold text-gray-700">
                  Region <span className="text-red-500">*</span>
                </Label>
                <Select name="region" required>
                  <SelectTrigger id="region" className="h-10 border-gray-200 focus:ring-lime-500 text-left">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectGroup>
                      <SelectLabel className="font-semibold text-lime-700">Addis Ababa</SelectLabel>
                      {ADDIS_ABABA_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="font-semibold text-lime-700">Outside Addis Ababa</SelectLabel>
                      {OUTSIDE_ADDIS_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Capacity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Gauge className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">2. Capacity</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tankerCapacity" className="text-sm font-semibold text-gray-700">
                Tanker Capacity (Liters) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tankerCapacity"
                name="tankerCapacity"
                type="number"
                step="0.1"
                required
                className="h-10 border-gray-200 focus:ring-lime-500"
              />
            </div>
          </div>

          {/* Section 3: GPS Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Navigation className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">3. GPS Location <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span></h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="lat" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Latitude
                </Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Longitude
                </Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
            </div>
            {lat && lng && !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng)) && (
              <div className="rounded-lg bg-lime-50 border border-lime-200 px-4 py-3 text-sm text-lime-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-lime-600 shrink-0" />
                Will be pinned on the Site Map at {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="px-6 h-10 font-semibold text-gray-500 hover:bg-gray-50 uppercase tracking-tight">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="px-8 h-10 bg-lime-600 hover:bg-lime-700 text-white font-bold uppercase tracking-tight shadow-sm">
              {isPending ? "Creating..." : "Create Site"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
