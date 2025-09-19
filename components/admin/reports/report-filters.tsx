"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Filter } from "lucide-react"

interface ReportFiltersProps {
  dateRange: string
  onDateRangeChange: (value: string) => void
  reportType: string
  onReportTypeChange: (value: string) => void
}

export function ReportFilters({ dateRange, onDateRangeChange, reportType, onReportTypeChange }: ReportFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select value={dateRange} onValueChange={onDateRangeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 3 meses</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={reportType} onValueChange={onReportTypeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Visão Geral</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="orders">Pedidos</SelectItem>
                <SelectItem value="customers">Clientes</SelectItem>
                <SelectItem value="delivery">Entregas</SelectItem>
                <SelectItem value="products">Produtos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm">
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
