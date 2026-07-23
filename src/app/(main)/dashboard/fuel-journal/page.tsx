import { getFuelJournalData } from "@/features/analytics/queries"
import { GeneratorFuelJournalTable } from "@/features/analytics/components/GeneratorFuelJournalTable"
import { FuelJournalExportButton } from "@/features/analytics/components/FuelJournalExportButton"

export const dynamic = "force-dynamic"

export default async function FuelJournalPage(props: { 
  searchParams: Promise<{ 
    region?: string; 
    page?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }> 
}) {
  const searchParams = await props.searchParams;
  const region = searchParams.region;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const sortBy = searchParams.sortBy || 'currRefuelDate';
  const sortOrder = searchParams.sortOrder || 'desc';

  const { data, total } = await getFuelJournalData(region, page, 10, sortBy, sortOrder);

  return (
    <div className="flex flex-1 flex-col gap-2 px-6 pb-6 mt-5 min-w-0">
        {/* Header bar with export button — fixed width, never scrolls with table */}
        <div className="flex items-center justify-end mb-2">
          <FuelJournalExportButton region={region} sortBy={sortBy} sortOrder={sortOrder} />
        </div>

        {/* Table has its own horizontal scroll */}
        <GeneratorFuelJournalTable data={data} total={total} page={page} sortBy={sortBy} sortOrder={sortOrder} />
    </div>
  )
}
