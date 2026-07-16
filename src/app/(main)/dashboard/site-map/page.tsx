import { getSitesWithLocation } from "@/features/sites/queries"
import { SiteMap } from "@/features/sites/components/SiteMap"

export const dynamic = "force-dynamic"

export default async function SiteMapPage() {
  const sites = await getSitesWithLocation()

  return (
    <div className="flex flex-1 flex-col gap-2 px-6 pb-6 pt-5 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-tight text-slate-800">
            Site Map
          </h1>
          <p className="text-sm text-gray-500">
            Search and locate generator sites. Edit a site to add or update its GPS coordinates.
          </p>
        </div>
      </div>

      {/* Map takes all remaining vertical space */}
      <div className="flex-1 min-h-0">
        <SiteMap sites={sites} />
      </div>
    </div>
  )
}
