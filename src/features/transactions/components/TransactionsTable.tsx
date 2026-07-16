"use client"

import React from "react"
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  ArrowUpDown,
  FileText,
  Calendar
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { TransactionActions } from "./TransactionActions"
import { format } from "date-fns"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface TransactionsTableProps {
  transactions: any[]
  total: number
  page: number
  totalPages: number
  search?: string
  dateFrom?: string
  dateTo?: string
}

import { Pagination } from "@/components/ui/Pagination"

export function TransactionsTable({
  transactions,
  total,
  page,
  totalPages,
  search: initialSearch = "",
  dateFrom,
  dateTo
}: TransactionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = React.useState(initialSearch)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) params.set("search", searchValue)
    else params.delete("search")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", p.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="overflow-x-auto mb-10 custom-scrollbar pb-2">
      <div className="min-w-[1400px] rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search receipt, account, or payer..."
              className="pl-10 h-9 border-gray-200 focus-visible:ring-lime-500"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-slate-400 text-[12px] font-medium text-gray-600">
               <Calendar className="h-3.5 w-3.5 text-lime-500" />
               {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : "All Dates"}
             </div>
             <Button variant="outline" size="sm" className="h-9 gap-2 text-gray-600 border-gray-200">
               <Filter className="h-4 w-4" />
               Filters
             </Button>
          </div>
        </div>

        {/* Extreme High-Density Table */}
        <div className="flex-1">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
                <TableHead className="w-[40px] text-center font-bold text-slate-900 border-r border-slate-400 px-4">#</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Receipt No</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Sender A/C</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Receiver A/C</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Paid Amount</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Sender Amount</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Payer Name</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Location</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Station</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Type</TableHead>
                <TableHead className="font-bold text-slate-900 uppercase tracking-tight text-[11px] px-4 align-middle bg-white whitespace-nowrap">Remark</TableHead>
                <TableHead className="text-right font-bold text-slate-900 border-l border-slate-400 whitespace-nowrap px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center text-gray-400 italic">
                    No transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx, idx) => (
                  <TableRow key={tx.id} className="hover:bg-gray-50/50 border-b-gray-50 transition-colors h-[22px]">
                    <TableCell className="text-center text-[11px] text-gray-400 font-normal border-r border-slate-400">
                      {(page - 1) * 10 + idx + 1}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-slate-700 font-normal text-[14px] leading-none">
                      {tx.receiptNo || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-slate-600 font-normal text-[14px] leading-none underline underline-offset-4 cursor-pointer">
                      {tx.senderAccount || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-600 text-[14px] leading-none">
                      {tx.receiverAccount || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-900 font-medium text-[14px] leading-none">
                      {tx.paidAmount?.toLocaleString() || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-900 font-medium text-[14px] leading-none">
                      {tx.senderAmount?.toLocaleString() || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-600 text-[14px] leading-none">
                      {tx.payerName || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-600 text-[14px] leading-none">
                      {tx.location || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-600 text-[14px] leading-none font-normal text-slate-700">
                      {tx.fuelStation || "-"}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-600 text-[14px] leading-none uppercase tracking-tighter font-medium">
                      {tx.type === "FINANCIAL_DISBURSEMENT" ? (
                        <span className="bg-lime-100 text-lime-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-lime-200">Voucher</span>
                      ) : (
                        tx.type || "-"
                      )}
                    </TableCell>
                    <TableCell className="px-1 py-0 text-gray-400 text-[11px] leading-none max-w-[150px] truncate">
                      {tx.remark || "-"}
                    </TableCell>
                    <TableCell className="text-right px-1 border-l border-slate-400">
                      <TransactionActions transaction={tx} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer — inside min-w div so scrollbar appears below it */}
        <div className="flex items-center justify-between border-t border-slate-400 bg-white px-4 py-1.5 sm:px-6">
          <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
            <span className="hidden sm:inline-block font-bold">{total} total transactions</span>
            <span className="hidden sm:inline-block">|</span>
            <div className="flex items-center gap-2">
              <span>Go to:</span>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const p = formData.get("page");
                if (p) {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", p.toString());
                  router.push(`${pathname}?${params.toString()}`);
                }
              }} className="flex items-center gap-2">
                <Input
                  name="page"
                  type="number"
                  defaultValue={page}
                  className="h-7 w-12 text-center font-bold bg-gray-50 border-gray-200 p-0 focus-visible:ring-1 focus-visible:ring-lime-500 shadow-none"
                />
              </form>
            </div>
          </div>
          <Pagination totalPages={totalPages} currentPage={page} />
        </div>
      </div>
      {/* scrollbar appears here */}
    </div>
  )
}
