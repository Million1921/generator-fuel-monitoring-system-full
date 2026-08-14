import prisma from "@/lib/db"
import { TransactionsTable } from "@/features/transactions/components/TransactionsTable"
import { SearchInput } from "@/components/ui/SearchInput"
import { RegionFilter } from "@/components/ui/RegionFilter"
import { getRoleFromClerk, getRegionScope } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function TransactionsPage(props: { 
  searchParams: Promise<{ 
    search?: string; 
    page?: string;
    from?: string;
    to?: string;
    region?: string;
  }> 
}) {
  const searchParams = await props.searchParams;
  const search = searchParams.search;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const from = searchParams.from;
  const to = searchParams.to;
  const role = await getRoleFromClerk();
  const regionScope = await getRegionScope(role);
  let region = regionScope ?? searchParams.region;
  if (region === "ALL" || region === "undefined" || region === "null" || region === "") {
    region = undefined;
  }
  
  const limit = 10;
  const skip = (page - 1) * limit;

  let transactions: any[] = [];
  let totalCount: number = 0;

  try {
    const where: any = {};
    
      if (search) {
        where.OR = [
          { receiptNo: { contains: search, mode: 'insensitive' } },
          { senderAccount: { contains: search, mode: 'insensitive' } },
          { receiverAccount: { contains: search, mode: 'insensitive' } },
          { payerName: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (region) {
        where.site = { region };
      }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        where.createdAt.lte = new Date(to);
      }
    }

    const [fetchedTransactions, count] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { site: true, fuelRefill: true }
      }),
      prisma.transaction.count({ where })
    ]);

    transactions = fetchedTransactions;
    totalCount = count;
  } catch (error: any) {
    console.error("Transactions Page - Global Error:", error.message);
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 pb-6 bg-gray-50/30 overflow-x-auto overflow-y-hidden">
        <div className="flex items-center justify-between z-10 relative mb-4 mt-5">
          <div className="w-full max-w-sm">
            <SearchInput placeholder="Search transactions by receipt or AC..." />
          </div>
          <div className="flex items-center gap-3">
            <RegionFilter />
          </div>
        </div>

        <TransactionsTable 
          transactions={transactions}
          total={totalCount}
          page={page}
          totalPages={totalPages}
          search={search}
          dateFrom={from}
          dateTo={to}
        />
    </div>
  )
}
