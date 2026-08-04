"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Pagination } from "@/components/ui/Pagination"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { TableColumnHeader } from "@/components/ui/table-column-header"
import { cn } from "@/lib/utils"

export interface FuelJournalRow {
    sn: number;
    employeeCreatedWO: string;
    employeeIdWOCreate: string;
    workOrderNumber: string;
    siteId: string;
    siteName: string;
    region: string;
    tankerCapacity: number;
    standard: number;
    prevRefuelDate: string;
    prevRefuelLiters: number;
    prevRefuelBirr: number;
    prevRefuelRunningHour: number;
    currRefuelDate: string;
    currRefuelLiters: number;
    currRefuelBirr: number;
    currRefuelRunningHour: number;
    runningHourDifference: number;
    runningHrPerLit: number;
    maintOpSeq: string;
    deviation: number;
    deviationPct?: number;
    anomalyLevel?: 'normal' | 'warning' | 'critical';
    anomalyReason?: string;
    unitPrice: number;
    remark: string;
}

interface GeneratorFuelJournalTableProps {
    data: FuelJournalRow[];
    total: number;
    page: number;
    sortBy?: string;
    sortOrder?: string;
}

export function GeneratorFuelJournalTable({ 
    data, 
    total, 
    page,
    sortBy: currentSortBy,
    sortOrder: currentSortOrder
}: GeneratorFuelJournalTableProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const region = searchParams.get("region")
    const limit = 10
    const totalPages = Math.ceil(total / limit)

    const handleSort = (field: string) => {
        const params = new URLSearchParams(searchParams.toString())
        const isAsc = currentSortBy === field && currentSortOrder === 'asc'
        params.set('sortBy', field)
        params.set('sortOrder', isAsc ? 'desc' : 'asc')
        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }


    const SortableHeader = ({ field, label, rowSpan = 1, className = "" }: { field: string, label: string, rowSpan?: number, className?: string }) => (
        <TableHead rowSpan={rowSpan} className={cn( "border-r border-[#6a9e2f] p-0 align-middle bg-[#8dc63f]", className )}>
            <TableColumnHeader 
                label={label}
                sortActive={currentSortBy === field}
                onSort={() => handleSort(field)}
                className="justify-center p-2 text-white font-bold"
            />
        </TableHead>
    )

    return (
        <div className="overflow-x-auto mb-10 custom-scrollbar pb-2 min-w-0 w-full">
            <div className="w-max rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden">
                    <Table className="relative w-full border-collapse">
                        <TableHeader className="bg-[#8dc63f]">
                            <TableRow className="hover:bg-[#8dc63f] bg-[#8dc63f] h-8">
                                <SortableHeader field="employeeCreatedWO" label="Employee name Created WO" rowSpan={2} className="min-w-[130px]" />
                                <SortableHeader field="employeeIdWOCreate" label="Employee Id WO Create" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="workOrderNumber" label="Work order number" rowSpan={2} className="min-w-[160px]" />
                                <SortableHeader field="siteId" label="Site ID" rowSpan={2} className="min-w-[140px]" />
                                <SortableHeader field="siteName" label="Site Name" rowSpan={2} className="min-w-[170px]" />
                                <SortableHeader field="region" label="Region" rowSpan={2} className="min-w-[120px]" />
                                <SortableHeader field="tankerCapacity" label="Tanker Capacity" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="standard" label="Standard" rowSpan={2} className="border-r-slate-300 min-w-[100px]" />

                                <TableHead colSpan={4} className="border-r border-b border-[#6a9e2f] text-center font-bold align-middle bg-[#8dc63f] text-white text-[14px] uppercase tracking-wider">
                                    Previous refueling
                                </TableHead>

                                <TableHead colSpan={4} className="border-r border-b border-[#6a9e2f] text-center font-bold align-middle bg-[#8dc63f] text-white text-[14px] uppercase tracking-wider">
                                    Current refueling
                                </TableHead>

                                <SortableHeader field="runningHourDifference" label="Running hour difference" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="runningHrPerLit" label="Running hr/ Lit" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="maintOpSeq" label="Maint ce Op Seq" rowSpan={2} className="min-w-[80px]" />
                                <SortableHeader field="deviation" label="Deviation" rowSpan={2} className="min-w-[80px]" />
                                <SortableHeader field="unitPrice" label="Unit Price" rowSpan={2} className="min-w-[100px]" />
                                <TableHead rowSpan={2} className=" p-0 align-middle bg-[#8dc63f]">
                                    <TableColumnHeader label="Remark" className="justify-center p-2 text-white font-bold" />
                                </TableHead>
                            </TableRow>

                            <TableRow className="bg-[#8dc63f] hover:bg-[#8dc63f]">
                                {/* Previous Refueling Sub-headers */}
                                <TableHead className="border-r border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white uppercase">Date</TableHead>
                                <TableHead className="border-r border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white text-[11px] uppercase whitespace-pre-wrap">Amount In liter</TableHead>
                                <TableHead className="border-r border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white text-[11px] uppercase whitespace-pre-wrap">Amount In Birr</TableHead>
                                <TableHead className="border-r border-b border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white text-[11px] uppercase whitespace-pre-wrap">beginning Running hour</TableHead>

                                {/* Current Refueling Sub-headers */}
                                <TableHead className="border-r border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white uppercase">Date</TableHead>
                                <TableHead className="border-r border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white text-[11px] uppercase whitespace-pre-wrap">Amount In liter</TableHead>
                                <TableHead className="border-r border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white text-[11px] uppercase whitespace-pre-wrap">Amount In Birr</TableHead>
                                <TableHead className="border-r border-b border-[#6a9e2f] min-w-[100px] text-center font-bold bg-[#8dc63f] text-white text-[11px] uppercase whitespace-pre-wrap">Running hour</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {data && data.length > 0 ? (
                                (() => {
                                    const skipOffset = (page - 1) * limit;
                                    return data.map((row, i) => (
                                        <TableRow key={`${row.siteId}-${page}-${i}`} className="hover:bg-gray-50/50 border-b-gray-50 transition-colors h-[22px]">

                                            <TableCell className="border-r border-slate-400 text-center whitespace-pre-wrap text-slate-700">{row.employeeCreatedWO}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-center text-slate-500">{row.employeeIdWOCreate}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-center whitespace-nowrap font-mono text-slate-700 font-medium">{row.workOrderNumber}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-center">
                                                <span className="text-slate-700 font-medium ">
                                                    {row.siteId}
                                                </span>
                                            </TableCell>
                                            <TableCell className="border-r border-slate-400 text-center text-slate-900 max-w-[200px] truncate" title={row.siteName}>{row.siteName}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-center text-slate-500">{row.region}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-700 px-4">{row.tankerCapacity?.toLocaleString()}</TableCell>
                                            <TableCell className="border-r border-r-slate-300 border-slate-400 text-right tabular-nums text-slate-900 px-4">{row.standard}</TableCell>

                                            {/* Previous Refueling */}
                                            <TableCell className="border-r border-slate-400 text-center whitespace-nowrap font-medium text-slate-700 bg-slate-50/10">{row.prevRefuelDate}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-900 bg-slate-50/10 px-3">{row.prevRefuelLiters?.toLocaleString()}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-800 bg-slate-50/10 px-3">{row.prevRefuelBirr?.toLocaleString()}</TableCell>
                                            <TableCell className="border-r border-r-slate-300 border-slate-400 text-right tabular-nums text-slate-800 bg-slate-50/10 px-3">{row.prevRefuelRunningHour?.toLocaleString()}</TableCell>

                                            {/* Current Refueling */}
                                            <TableCell className="border-r border-slate-400 text-center whitespace-nowrap font-medium text-slate-800 bg-slate-50/20">{row.currRefuelDate}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-900 bg-slate-50/20 px-3">{row.currRefuelLiters?.toLocaleString()}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-800 bg-slate-50/20 px-3">{row.currRefuelBirr?.toLocaleString()}</TableCell>
                                            <TableCell className="border-r border-r-slate-300 border-slate-400 text-right tabular-nums text-slate-800 bg-slate-50/20 px-3">{row.currRefuelRunningHour?.toLocaleString()}</TableCell>

                                            {/* Calculations & Pricing */}
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-900 px-3">{row.runningHourDifference?.toLocaleString()}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-600 px-3 ">{row.runningHrPerLit?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-center font-normal">{row.maintOpSeq || '-'}</TableCell>
                                            <TableCell className="border-r border-slate-400 text-center px-2">
                                                {row.anomalyLevel && row.anomalyLevel !== 'normal' ? (
                                                    <span
                                                        title={row.anomalyReason}
                                                        className={cn(
                                                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold cursor-help",
                                                            row.anomalyLevel === 'critical'
                                                                ? "bg-red-100 text-red-700 border border-red-200"
                                                                : "bg-amber-100 text-amber-700 border border-amber-200"
                                                        )}
                                                    >
                                                        {row.anomalyLevel === 'critical' ? '🚨' : '⚠️'}
                                                        {row.deviation > 0 ? '+' : ''}{row.deviation?.toFixed(1)} L
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs tabular-nums">
                                                        {row.deviation != null ? `${row.deviation > 0 ? '+' : ''}${row.deviation.toFixed(1)}` : '-'}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="border-r border-slate-400 text-right tabular-nums text-slate-900 px-4">{row.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-center italic text-slate-400 px-4">{row.remark || '-'}</TableCell>
                                        </TableRow>
                                    ));
                                })()
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={23} className="h-48 text-center text-slate-400 italic ">
                                        No generator fuel journal records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                {/* Footer — inside min-w div so scrollbar appears below it */}
                <div className="flex items-center justify-between border-t border-slate-400 bg-white px-4 py-1.5 sm:px-6">
                    <div className="flex items-center text-gray-500 gap-4 uppercase tracking-tighter text-sm font-medium">
                        <span className="hidden sm:inline-block font-bold">{total} total records</span>
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
                                <input
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
