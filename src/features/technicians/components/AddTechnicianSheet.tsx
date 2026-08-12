"use client"

import * as React from "react"
import { Plus, UserCheck, Phone, Mail, MapPin, Briefcase, ShieldCheck } from "lucide-react"
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
import { createTechnician } from "@/features/technicians/actions"
import { useAppRole } from "@/components/providers/role-provider"

interface Region {
  id: number;
  name: string;
}

export function AddTechnicianSheet({ regions }: { regions: Region[] }) {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const router = useRouter()
  const userRole = useAppRole()

  if (userRole !== "ADMIN") return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get("name") as string,
      department: formData.get("department") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      regionId: formData.get("regionId") as string,
    }

    try {
      await createTechnician(data)
      toast.success("Technician registered successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to register technician")
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
          Register Technician
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl p-0 border-none overflow-y-auto bg-gray-50/50">
        <SheetHeader className="bg-gradient-to-r from-lime-600 to-lime-500 p-6 shadow-sm sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 opacity-90" />
            Add New Technician
          </SheetTitle>
          <SheetDescription className="text-lime-50 text-sm mt-1 font-medium italic opacity-90">
            Register a new field engineer or technician to the system.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Section 1: Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserCheck className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">1. Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  required
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Assignment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Briefcase className="w-4 h-4 text-lime-600" />
              <h3 className="font-bold text-sm text-lime-700 uppercase tracking-widest">2. Assignment & Role</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="region" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Region <span className="text-red-500">*</span>
                </Label>
                <Select name="region" required>
                  <SelectTrigger id="region" className="h-10 border-gray-200 focus:ring-lime-500 text-left">
                    <SelectValue placeholder="Select region" />
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

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Role
                </Label>
                <Select name="role" defaultValue="TECHNICIAN">
                  <SelectTrigger id="role" className="h-10 border-gray-200 focus:ring-lime-500 text-left">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="department" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" /> Department
                </Label>
                <Input
                  id="department"
                  name="department"
                  className="h-10 border-gray-200 focus:ring-lime-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="px-6 h-10 font-semibold text-gray-500 hover:bg-gray-50 uppercase tracking-tight">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="px-8 h-10 bg-lime-600 hover:bg-lime-700 text-white font-bold uppercase tracking-tight shadow-sm">
              {isPending ? "Registering..." : "Save Technician"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
