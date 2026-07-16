import { SiteTable } from "@/features/sites/components/SiteTable"
import { getSites } from "@/features/sites/queries"
import { AddSiteSheet } from "@/features/sites/components/AddSiteSheet"
import { SearchInput } from "@/components/ui/SearchInput"
import { RegionFilter } from "@/components/ui/RegionFilter"


export const dynamic = "force-dynamic"

export default async function SitesPage(props: { 
  searchParams: Promise<{ 
    region?: string; 
    search?: string; 
    page?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }> 
}) {
  const searchParams = await props.searchParams;
  const region = searchParams.region;
  const search = searchParams.search;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const sortBy = searchParams.sortBy || 'siteId';
  const sortOrder = searchParams.sortOrder || 'asc';
  const limit = 10;

  const { sites, total } = await getSites(region, search, page, limit, sortBy, sortOrder);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-1 flex-col gap-2 px-6 pb-6 overflow-x-auto overflow-y-hidden">
      <div className="flex items-center justify-between z-10 relative mb-4 mt-5">
        <div className="w-full max-w-sm">
          <SearchInput placeholder="Search sites by ID or name..." />
        </div>
        <div className="flex items-center gap-3">
          <RegionFilter />
          <AddSiteSheet />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-1">
        <SiteTable sites={sites} total={total} page={page} sortBy={sortBy} sortOrder={sortOrder} />
      </div>
    </div>
  )
}
