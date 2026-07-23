"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportFuelJournalAction } from "../actions"

interface FuelJournalExportButtonProps {
    region?: string
    sortBy?: string
    sortOrder?: string
}

export function FuelJournalExportButton({ region, sortBy, sortOrder }: FuelJournalExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async (format: 'csv' | 'xlsx') => {
        try {
            setIsExporting(true)
            const exportData = await exportFuelJournalAction(
                region || undefined,
                sortBy || 'currRefuelDate',
                (sortOrder as 'asc' | 'desc') || 'desc'
            )

            if (!exportData || exportData.length === 0) {
                alert("No data available to export.")
                return
            }

            const XLSX = await import("xlsx")

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

            const wbout = XLSX.write(wb, {
                bookType: format === 'xlsx' ? 'xlsx' : 'csv',
                type: 'array'
            })

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

    return (
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
    )
}
