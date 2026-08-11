"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { completeTechnicianProfile } from "@/features/technicians/actions"
import { UserCircle } from "lucide-react"

interface Region {
  id: number;
  name: string;
}

export function TechnicianOnboardingForm({ userId, initialName, regions }: { userId: string, initialName?: string, regions: Region[] }) {
  const [isPending, setIsPending] = React.useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get("name") as string,
      employeeId: formData.get("employeeId") as string,
      jobTitle: formData.get("jobTitle") as string,
      phone: formData.get("phone") as string,
      department: formData.get("department") as string,
      regionId: parseInt(formData.get("regionId") as string, 10),
    }

    try {
      await completeTechnicianProfile(userId, data)
      toast.success("Profile completed successfully!")
      router.refresh()
    } catch (error) {
      toast.error("Failed to complete profile.")
      console.error(error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <UserCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Complete Your Profile</h2>
          <p className="text-sm text-slate-500">
            Please provide your contact and assignment details to start receiving work orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" defaultValue={initialName || ""} placeholder="e.g. John Doe" required />
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="employeeId">ID NO <span className="text-red-500">*</span></Label>
              <Input id="employeeId" name="employeeId" placeholder="e.g. EMP-001" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="jobTitle">Title <span className="text-red-500">*</span></Label>
              <Input id="jobTitle" name="jobTitle" placeholder="e.g. Senior Technician" required />
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
              <Input id="phone" name="phone" placeholder="e.g. 0911234567" required />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
            <Input id="department" name="department" placeholder="e.g. Maintenance" required />
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="regionId">Assigned Region <span className="text-red-500">*</span></Label>
            <Select name="regionId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </div>
    </div>
  )
}
