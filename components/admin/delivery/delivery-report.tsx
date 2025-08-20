"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useProtectedApi } from "@/hooks/use-protected-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  Calendar, 
  User, 
  Truck, 
  DollarSign, 
  Package, 
  Clock,
  Settings,
  Calculator,
  MapPin
} from "lucide-react"

interface Driver {
  id: string
  name: string
  email: string
  phone: string
}

interface Delivery {
  id: string
  total: number
  subtotal: number
  delivery_fee: number
  products_value: number
  delivered_at: string
  delivery_address: string
}

interface DriverReport {
  driver: Driver
  deliveries: Delivery[]
  totalDeliveries: number
  totalEarnings: number
}

interface ReportData {
  deliveriesByDriver: DriverReport[]
  allDrivers: Driver[]
  summary: {
    totalDeliveries: number
    totalDrivers: number
    dateRange: {
      start: string | null
      end: string | null
    }
  }
}

interface EarningsConfig {
  method: 'fixed' | 'percentage' | 'delivery_fee'
  fixedAmount: number
  percentage: number
}

interface DeliveryReportProps {
  isOpen: boolean
  onClose: () => void
}

export function DeliveryReport({ isOpen, onClose }: DeliveryReportProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedDriverId, setSelectedDriverId] = useState('all')
  const [earningsConfig, setEarningsConfig] = useState<EarningsConfig>({
    method: 'delivery_fee',
    fixedAmount: 5.00,
    percentage: 10
  })

  const { toast } = useToast()
  const api = useProtectedApi()

  // Buscar dados do relatório
  const { data: reportData, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ['delivery-report', startDate, endDate, selectedDriverId],
    queryFn: async (): Promise<ReportData> => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        driverId: selectedDriverId
      })

      const response = await api.callApi<ReportData>(`/api/admin/delivery/reports?${params}`)
      
      if (response.error) {
        throw new Error(response.error)
      }

      return response.data!
    },
    enabled: isOpen
  })

  // Calcular ganhos baseado na configuração
  const calculateEarnings = (delivery: Delivery): number => {
    switch (earningsConfig.method) {
      case 'fixed':
        return earningsConfig.fixedAmount
      case 'percentage':
        return (delivery.products_value * earningsConfig.percentage) / 100
      case 'delivery_fee':
        return delivery.delivery_fee
      default:
        return 0
    }
  }

  // Calcular ganhos totais para um motorista
  const calculateDriverTotalEarnings = (deliveries: Delivery[]): number => {
    return deliveries.reduce((total, delivery) => total + calculateEarnings(delivery), 0)
  }

  // Formatar moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar data e hora
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const handleApplyFilters = () => {
    refetch()
    toast({
      title: "Filtros Aplicados",
      description: "Relatório atualizado com os novos filtros"
    })
  }



  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="delivery-report-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatório de Entregas
          </DialogTitle>
          <DialogDescription id="delivery-report-description">
            Visualize e analise os dados de entregas por período e entregador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Filtros e Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros de Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data Inicial
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data Final
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Entregador
                  </Label>
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Entregadores</SelectItem>
                      {reportData?.allDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Configuração de Ganhos */}
              <Separator />
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Calculator className="w-5 h-5" />
                  Método de Cálculo de Ganhos
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Método</Label>
                    <Select 
                      value={earningsConfig.method || 'fixed'} 
                      onValueChange={(value: 'fixed' | 'percentage' | 'delivery_fee') => 
                        setEarningsConfig(prev => ({ ...prev, method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Valor Fixo por Entrega</SelectItem>
                        <SelectItem value="percentage">Porcentagem do Valor das Pizzas</SelectItem>
                        <SelectItem value="delivery_fee">Taxa de Entrega do Pedido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {earningsConfig.method === 'fixed' && (
                    <div className="space-y-2">
                      <Label>Valor Fixo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={earningsConfig.fixedAmount || ''}
                        onChange={(e) => setEarningsConfig(prev => ({ 
                          ...prev, 
                          fixedAmount: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  )}

                  {earningsConfig.method === 'percentage' && (
                    <div className="space-y-2">
                      <Label>Porcentagem (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={earningsConfig.percentage || ''}
                        onChange={(e) => setEarningsConfig(prev => ({ 
                          ...prev, 
                          percentage: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <Button onClick={handleApplyFilters} className="w-full">
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total de Entregas</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalDeliveries}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Entregadores Ativos</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalDrivers}</p>
                    </div>
                    <Truck className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total de Ganhos</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          reportData.deliveriesByDriver.reduce(
                            (total, driverReport) => total + calculateDriverTotalEarnings(driverReport.deliveries),
                            0
                          )
                        )}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Relatório por Entregador */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando relatório...</p>
              </CardContent>
            </Card>
          ) : reportData?.deliveriesByDriver.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma entrega encontrada</h3>
                <p className="text-gray-600">
                  Não há entregas para o período e filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reportData?.deliveriesByDriver.map((driverReport) => {
                const totalEarnings = calculateDriverTotalEarnings(driverReport.deliveries)
                
                return (
                  <Card key={driverReport.driver.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            {driverReport.driver.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {driverReport.driver.email} • {driverReport.driver.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-2">
                            {driverReport.totalDeliveries} entregas
                          </Badge>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(totalEarnings)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {driverReport.deliveries.map((delivery) => {
                          const earnings = calculateEarnings(delivery)
                          
                          return (
                            <div key={delivery.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm font-medium">
                                    {formatDateTime(delivery.delivered_at)}
                                  </span>
                                </div>
                                <Badge variant="outline">
                                  {formatCurrency(earnings)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate">{delivery.delivery_address}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total: {formatCurrency(delivery.total)}</span>
                                  <span>Taxa: {formatCurrency(delivery.delivery_fee)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}