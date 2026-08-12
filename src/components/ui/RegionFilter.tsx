"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ADDIS_ABABA_REGIONS, OUTSIDE_ADDIS_REGIONS } from "@/lib/constants"
import { useCallback, Suspense } from "react"
import { Filter } from "lucide-react"
import { useAppRole } from "@/components/providers/role-provider"

function RegionFilterContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentRegion = searchParams.get('region') || "ALL"

  const setRegion = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "ALL") {
      params.set('region', value)
    } else {
      params.delete('region')
    }
    router.push(pathname + '?' + params.toString())
    router.refresh()
  }, [pathname, router, searchParams])

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by Region:</span>
      <Select value={currentRegion} onValueChange={setRegion}>
        <SelectTrigger className="w-[180px] bg-slate-50/50 h-9 rounded-md border-slate-200 shadow-sm focus:ring-lime-500 transition-all hover:bg-white focus:bg-white">
          <SelectValue placeholder="All Regions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Regions</SelectItem>
          <SelectGroup>
            <SelectLabel>Addis Ababa</SelectLabel>
            {ADDIS_ABABA_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Outside Addis Ababa</SelectLabel>
            {OUTSIDE_ADDIS_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function RegionFilter() {
  const userRole = useAppRole()
  const isGlobal = userRole === "ADMIN" || userRole === "FINANCE"
  if (!isGlobal) {
    return null
  }

  return (
    <Suspense fallback={<div className="h-9 w-[180px] bg-slate-50 rounded-md border border-slate-100 shadow-sm animate-pulse" />}>
      <RegionFilterContent />
    </Suspense>
  )
}
