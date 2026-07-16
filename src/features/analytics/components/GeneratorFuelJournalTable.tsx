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
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { exportFuelJournalAction } from "../actions"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async (format: 'csv' | 'xlsx') => {
        try {
            setIsExporting(true)
            const exportData = await exportFuelJournalAction(
                region || undefined,
                currentSortBy || 'currRefuelDate',
                (currentSortOrder as 'asc' | 'desc') || 'desc'
            )

            if (!exportData || exportData.length === 0) {
                alert("No data available to export.")
                return
            }

            const XLSX = await import("xlsx");

            // Define clean mapping to ensure no complex objects are passed to the sheet
            const wsData = exportData.map(row => ({
                "S.N": String(row.sn),
                "Employee Name": String(row.employeeCreatedWO || "-"),
                "Employee ID": String(row.employeeIdWOCreate || "-"),
                "Work Order No": String(row.workOrderNumber || "N/A"),
                "Site ID": String(row.siteId || "-"),
                "Site Name": String(row.siteName || "-"),
                "Region": String(row.region || "-"),
                "Tanker Capacity": Number(row.tankerCapacity || 0),
                "Standard": Number(row.standard || 0),
                "Prev Refuel Date": String(row.prevRefuelDate || "-"),
                "Prev Refuel Liters": Number(row.prevRefuelLiters || 0),
                "Prev Refuel Birr": Number(row.prevRefuelBirr || 0),
                "Prev Refuel Running Hr": Number(row.prevRefuelRunningHour || 0),
                "Curr Refuel Date": String(row.currRefuelDate || "-"),
                "Curr Refuel Liters": Number(row.currRefuelLiters || 0),
                "Curr Refuel Birr": Number(row.currRefuelBirr || 0),
                "Curr Refuel Running Hr": Number(row.currRefuelRunningHour || 0),
                "Running Hr Diff": Number(row.runningHourDifference || 0),
                "Running Hr/Lit": Number(row.runningHrPerLit || 0),
                "Maint Op Seq": String(row.maintOpSeq || "-"),
                "Deviation": Number(row.deviation || 0),
                "Unit Price": Number(row.unitPrice || 0),
                "Remark": String(row.remark || "")
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(wsData)
            XLSX.utils.book_append_sheet(wb, ws, "Journal")

            const fileName = `Fuel_Journal_${new Date().toISOString().split('T')[0]}`
            
            // Generate buffer
            const wbout = XLSX.write(wb, { 
                bookType: format === 'xlsx' ? 'xlsx' : 'csv', 
                type: 'array' 
            })

            // Create blob and trigger download manually for maximum browser compatibility
            const blobType = format === 'xlsx' 
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                : 'text/csv;charset=utf-8;'
            
            const blob = new Blob([wbout], { type: blobType })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${fileName}.${format}`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error("Export Error:", error)
            alert("A problem occurred while generating the export file. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    const SortableHeader = ({ field, label, rowSpan = 1, className = "" }: { field: string, label: string, rowSpan?: number, className?: string }) => (
        <TableHead 
            rowSpan={rowSpan} 
            className={cn(
                "border-r border-slate-400 p-0 align-middle bg-white",
                className
            )}
        >
            <TableColumnHeader 
                label={label}
                sortActive={currentSortBy === field}
                onSort={() => handleSort(field)}
                className="justify-center p-2 text-slate-900 font-bold"
            />
        </TableHead>
    )

    return (
        <div className="overflow-x-auto mb-10 custom-scrollbar pb-2">
            <div className="min-w-[2500px] rounded-xl border border-slate-400 bg-white shadow-sm overflow-hidden p-1">
                <div className="flex items-center justify-between pb-1 pt-2 px-4">
                    <div className="flex items-center gap-2">
                        {/* Placeholder for potential additional filters or tabs */}
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100 hover:text-lime-800 font-bold transition-all"
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Export Data
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleExport('xlsx')} className="flex items-center gap-2 cursor-pointer font-bold text-lime-700">
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>Export as Excel</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                                <FileText className="h-4 w-4" />
                                <span>Export as CSV</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div>
                    <Table className="relative w-full border-collapse">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-gray-50/50 h-8">
                                <SortableHeader field="employeeCreatedWO" label="Employee name Created WO" rowSpan={2} className="min-w-[130px]" />
                                <SortableHeader field="employeeIdWOCreate" label="Employee Id WO Create" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="workOrderNumber" label="Work order number" rowSpan={2} className="min-w-[160px]" />
                                <SortableHeader field="siteId" label="Site ID" rowSpan={2} className="min-w-[140px]" />
                                <SortableHeader field="siteName" label="Site Name" rowSpan={2} className="min-w-[170px]" />
                                <SortableHeader field="region" label="Region" rowSpan={2} className="min-w-[120px]" />
                                <SortableHeader field="tankerCapacity" label="Tanker Capacity" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="standard" label="Standard" rowSpan={2} className="border-r-slate-300 min-w-[100px]" />

                                <TableHead colSpan={4} className="border-r border-b border-gray-200 text-center font-bold align-middle bg-white text-slate-900 text-[14px] uppercase tracking-wider">
                                    Previous refueling
                                </TableHead>

                                <TableHead colSpan={4} className="border-r border-b border-gray-200 text-center font-bold align-middle bg-white text-slate-900 text-[14px] uppercase tracking-wider">
                                    Current refueling
                                </TableHead>

                                <SortableHeader field="runningHourDifference" label="Running hour difference" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="runningHrPerLit" label="Running hr/ Lit" rowSpan={2} className="min-w-[100px]" />
                                <SortableHeader field="maintOpSeq" label="Maint ce Op Seq" rowSpan={2} className="min-w-[80px]" />
                                <SortableHeader field="deviation" label="Deviation" rowSpan={2} className="min-w-[80px]" />
                                <SortableHeader field="unitPrice" label="Unit Price" rowSpan={2} className="min-w-[100px]" />
                                <TableHead rowSpan={2} className=" p-0 align-middle bg-white">
                                    <TableColumnHeader label="Remark" className="justify-center p-2 text-slate-900 font-bold" />
                                </TableHead>
                            </TableRow>

                            <TableRow>
                                {/* Previous Refueling Sub-headers */}
                                <TableHead className="border-r  min-w-[100px] text-center font-bold bg-white text-slate-600  uppercase">Date</TableHead>
                                <TableHead className="border-r  min-w-[100px] text-center font-bold bg-white text-slate-900 text-[11px] uppercase whitespace-pre-wrap">Amount In liter</TableHead>
                                <TableHead className="border-r  min-w-[100px] text-center font-bold bg-white text-slate-900 text-[11px] uppercase whitespace-pre-wrap">Amount In Birr</TableHead>
                                <TableHead className="border-r border-b border-r-slate-300 min-w-[100px] text-center font-bold bg-white text-slate-900 text-[11px] uppercase whitespace-pre-wrap">beginning Running hour</TableHead>

                                {/* Current Refueling Sub-headers */}
                                <TableHead className="border-r  min-w-[100px] text-center font-bold bg-white text-slate-600  uppercase">Date</TableHead>
                                <TableHead className="border-r  min-w-[100px] text-center font-bold bg-white text-slate-900 text-[11px] uppercase whitespace-pre-wrap">Amount In liter</TableHead>
                                <TableHead className="border-r  min-w-[100px] text-center font-bold bg-white text-slate-900 text-[11px] uppercase whitespace-pre-wrap">Amount In Birr</TableHead>
                                <TableHead className="border-r border-b border-r-slate-300 min-w-[100px] text-center font-bold bg-white text-slate-900 text-[11px] uppercase whitespace-pre-wrap">Running hour</TableHead>
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
                                            <TableCell className="border-r border-slate-400 text-center font-medium text-red-500">{row.deviation || '-'}</TableCell>
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
                </div>

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
