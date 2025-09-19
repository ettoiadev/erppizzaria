"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react"

interface ExportReportsProps {
  dateRange: string
  reportType: string
}

export function ExportReports({ dateRange, reportType }: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: string) => {
    setIsExporting(true)

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In production, this would generate and download the actual file
    console.log(`Exporting ${reportType} report for ${dateRange} in ${format} format`)

    setIsExporting(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exportando..." : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("print")}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
