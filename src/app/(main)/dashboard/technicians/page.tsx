import { getTechnicians } from "@/features/technicians/actions"
import { getRegions } from "@/features/regions/actions"
import { Users } from "lucide-react"
import { AddTechnicianSheet } from "@/features/technicians/components/AddTechnicianSheet"
import { TechnicianTable } from "@/features/technicians/components/TechnicianTable"
import { SearchInput } from "@/components/ui/SearchInput"
import { RegionFilter } from "@/components/ui/RegionFilter"

export const dynamic = "force-dynamic"

export default async function TechniciansPage(props: { 
  searchParams: Promise<{ 
    region?: string; 
    page?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }> 
}) {
  const searchParams = await props.searchParams;
  const region = searchParams.region;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const sortBy = searchParams.sortBy || 'name';
  const sortOrder = searchParams.sortOrder || 'asc';
  const search = searchParams.search;
  const limit = 10;

  const { technicians, total } = await getTechnicians(region, page, limit, sortBy, sortOrder, search)
  const regions = await getRegions()
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-1 flex-col gap-2 px-6 pb-6 overflow-x-auto overflow-y-hidden">
        <div className="flex items-center justify-between z-10 relative mb-4 mt-5">
          <div className="w-full max-w-sm">
            <SearchInput placeholder="Search field engineers by name or ID..." />
          </div>
          <div className="flex items-center gap-3">
            <RegionFilter />
            <AddTechnicianSheet regions={regions} />
          </div>
        </div>

        <TechnicianTable 
          technicians={technicians}
          total={total}
          page={page}
          totalPages={totalPages}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
    </div>
  )
}
