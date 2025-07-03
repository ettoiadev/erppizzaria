"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bike, Phone, MapPin, RefreshCw, Star, Package, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  vehicle_type: 'motorcycle' | 'bicycle' | 'car'
  vehicle_plate: string
  status: 'available' | 'busy' | 'offline'
  current_location: string
  total_deliveries: number
  average_rating: number
  average_delivery_time: number
  currentOrders: string[]
}

interface SelectDriverModalProps {
  orderId: string
  isOpen: boolean
  onClose: () => void
  onAssign?: () => void
}

export function SelectDriverModal({ orderId, isOpen, onClose, onAssign }: SelectDriverModalProps) {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const { toast } = useToast()

  // Buscar entregadores disponíveis
  const {
    data: drivers = [],
    isLoading,
    error,
    refetch
  } = useQuery<Driver[]>({
    queryKey: ["available-drivers"],
    queryFn: async () => {
      console.log("Buscando entregadores disponíveis...")
      
      const response = await fetch('/api/drivers?status=available')
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Entregadores disponíveis encontrados:", data.drivers?.length || 0)
      
      return data.drivers || []
    },
    enabled: isOpen,
    refetchOnWindowFocus: false,
  })

  // Mutation para atribuir entregador ao pedido
  const assignDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      console.log("Atribuindo entregador:", { orderId, driverId })
      
      const response = await fetch(`/api/orders/${orderId}/assign-driver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atribuir entregador')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: `Entregador ${data.driver.name} atribuído ao pedido`,
      })
      onAssign?.()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atribuir entregador",
        variant: "destructive",
      })
    },
  })

  const handleAssignDriver = () => {
    if (!selectedDriver) return
    assignDriverMutation.mutate(selectedDriver)
  }

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "motorcycle":
        return <Bike className="w-4 h-4 text-blue-600" />
      case "bicycle":
        return "🚲"
      case "car":
        return "🚗"
      default:
        return <Bike className="w-4 h-4 text-blue-600" />
    }
  }

  const getVehicleLabel = (vehicleType: string) => {
    switch (vehicleType) {
      case "motorcycle":
        return "Moto"
      case "bicycle":
        return "Bicicleta"
      case "car":
        return "Carro"
      default:
        return "Moto"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Entregador</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Selecione um entregador disponível para este pedido:</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Carregando entregadores...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Erro ao carregar entregadores: {error.message}</p>
              <Button variant="outline" onClick={() => refetch()}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && drivers.length === 0 && (
            <div className="text-center py-8">
              <Bike className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Nenhum entregador disponível no momento.</p>
              <p className="text-sm text-gray-400 mt-2">
                Verifique se há entregadores cadastrados e com status "Disponível".
              </p>
            </div>
          )}

          {!isLoading && !error && drivers.length > 0 && (
            <div className="space-y-3">
              {drivers.map((driver) => (
                <Card
                  key={driver.id}
                  className={`cursor-pointer transition-all ${
                    selectedDriver === driver.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedDriver(driver.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">{driver.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getVehicleIcon(driver.vehicle_type)}
                            <span>{getVehicleLabel(driver.vehicle_type)}</span>
                            <span className="text-gray-400">•</span>
                            <span>{driver.vehicle_plate}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Disponível
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{driver.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{driver.current_location || "Localização não informada"}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-xs text-gray-600">Entregas</div>
                            <div className="font-bold text-blue-600">{driver.total_deliveries}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Avaliação</div>
                            <div className="font-bold text-yellow-600 flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {driver.average_rating.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Tempo</div>
                            <div className="font-bold text-green-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {driver.average_delivery_time}min
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {driver.currentOrders.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                        <div className="text-sm text-yellow-800 flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <strong>Outros pedidos:</strong> {driver.currentOrders.length} em andamento
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={assignDriverMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignDriver} 
              disabled={!selectedDriver || assignDriverMutation.isPending}
            >
              {assignDriverMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                <>
                  <Bike className="w-4 h-4 mr-2" />
                  Enviar para Entrega
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 