"use client"


import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { MapPin, Calendar, Star, Package, Clock } from "lucide-react"
import type { DeliveryPerson } from "@/types/admin"

interface DeliveryPersonModalProps {
  deliveryPerson?: DeliveryPerson | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
}

export function DeliveryPersonModal({ deliveryPerson, isOpen, onClose, onSave }: DeliveryPersonModalProps) {
  const isEditing = !!deliveryPerson
  const [formData, setFormData] = useState({
    name: deliveryPerson?.name || "",
    email: deliveryPerson?.email || "",
    phone: deliveryPerson?.phone || "",
    vehicleType: deliveryPerson?.vehicleType || "motorcycle",
    vehiclePlate: deliveryPerson?.vehiclePlate || "",
    currentLocation: deliveryPerson?.currentLocation || "",
    status: deliveryPerson?.status || "available",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  // Função para formatar data no padrão brasileiro
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível"
      case "busy":
        return "Ocupado"
      case "offline":
        return "Offline"
      default:
        return "Desconhecido"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar ${deliveryPerson.name}` : "Novo Entregador"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Pessoais</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="busy">Ocupado</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Veículo</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange("vehicleType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">🏍️ Moto</SelectItem>
                    <SelectItem value="bicycle">🚲 Bicicleta</SelectItem>
                    <SelectItem value="car">🚗 Carro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) => handleInputChange("vehiclePlate", e.target.value)}
                  placeholder="ABC-1234"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentLocation">Localização Atual</Label>
                <Input
                  id="currentLocation"
                  value={formData.currentLocation}
                  onChange={(e) => handleInputChange("currentLocation", e.target.value)}
                  placeholder="Ex: Centro da cidade, Bairro Exemplo"
                />
              </div>
            </div>
          </div>

          {/* Statistics (only for editing) */}
          {isEditing && deliveryPerson && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estatísticas</h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{deliveryPerson.totalDeliveries}</div>
                    <div className="text-sm text-gray-600">Total de Entregas</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">⭐ {Number(deliveryPerson.averageRating || 0).toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Avaliação Média</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{deliveryPerson.averageDeliveryTime}min</div>
                    <div className="text-sm text-gray-600">Tempo Médio</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">Localização Atual</div>
                      <div className="font-medium">{deliveryPerson.currentLocation}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">Cadastrado em</div>
                      <div className="font-medium">
                        {formatDate(deliveryPerson.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {deliveryPerson.currentOrders.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>Pedidos em andamento:</strong> {deliveryPerson.currentOrders.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? "Salvar Alterações" : "Cadastrar Entregador"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
