import { AddGeneratorSheet } from "@/features/generators/components/AddGeneratorSheet"
import { AutoRefresh } from "@/components/ui/AutoRefresh"
import { getGenerators } from "@/features/generators/queries"
import { getAllSites } from "@/features/sites/queries"
import { Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { GeneratorTable } from "@/features/generators/components/GeneratorTable"
import { SearchInput } from "@/components/ui/SearchInput"
import { RegionFilter } from "@/components/ui/RegionFilter"

export const dynamic = "force-dynamic"

export default async function GeneratorsPage(props: { 
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
  const sortBy = searchParams.sortBy || 'genId';
  const sortOrder = searchParams.sortOrder || 'asc';
  const search = searchParams.search;
  const limit = 10;

  const { generators, total, stats } = await getGenerators(region, page, limit, sortBy, sortOrder, search);
  const { avgConsumption, highCount, normalCount, idleCount } = stats;

  const sites = await getAllSites();
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 pb-6 bg-gray-50/30 overflow-x-auto overflow-y-hidden">
      <div className="flex flex-1 flex-col pt-1">
        <div className="flex items-center justify-between z-10 relative mb-4 mt-5">
          <div className="w-full max-w-sm">
            <SearchInput placeholder="Search generators by SN or site..." />
          </div>
          <div className="flex items-center gap-3">
            <RegionFilter />
            <AddGeneratorSheet sites={sites} />
          </div>
        </div>
        
        <GeneratorTable 
          generators={generators}
          total={total}
          page={page}
          totalPages={totalPages}
          region={region}
          avgConsumption={avgConsumption}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </div>
    </div>
  )
}
