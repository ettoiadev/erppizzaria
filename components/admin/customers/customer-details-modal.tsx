"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Calendar, ShoppingBag, DollarSign, Star } from "lucide-react"
import type { Customer } from "@/types/admin"

interface CustomerDetailsModalProps {
  customer: Customer
  isOpen: boolean
  onClose: () => void
}

export function CustomerDetailsModal({ customer, isOpen, onClose }: CustomerDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "vip":
        return "bg-yellow-100 text-yellow-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "vip":
        return "VIP"
      case "active":
        return "Ativo"
      case "inactive":
        return "Inativo"
      default:
        return "Desconhecido"
    }
  }

  const averageOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0

  // Calcular dias desde última atividade
  const calculateDaysSinceLastActivity = () => {
    const now = new Date()
    const createdAt = new Date(customer.createdAt)
    const lastOrderDate = customer.lastOrderAt ? new Date(customer.lastOrderAt) : createdAt
    
    // Usar a data mais recente entre criação da conta e último pedido
    const lastActivityDate = lastOrderDate > createdAt ? lastOrderDate : createdAt
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysSinceLastActivity
  }

  const daysSinceLastActivity = calculateDaysSinceLastActivity()

  const getCustomerNotes = () => {
    if (customer.status === "vip") {
      return "Cliente VIP com alta frequência de pedidos e valor elevado."
    } else if (customer.status === "active") {
      if (customer.totalOrders > 0) {
        return "Cliente ativo com pedidos regulares."
      } else {
        return `Cliente cadastrado há ${daysSinceLastActivity} dias. Ainda não fez pedidos.`
      }
    } else {
      // Status inactive
      if (daysSinceLastActivity >= 30) {
        return `Cliente inativo há ${daysSinceLastActivity} dias.`
      } else {
        return `Cliente cadastrado há ${daysSinceLastActivity} dias. Ainda não fez pedidos.`
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {customer.name}
            <Badge className={getStatusColor(customer.status)}>{getStatusLabel(customer.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações de Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <div>{customer.address}</div>
                  {customer.complement && <div className="text-sm text-gray-600">{customer.complement}</div>}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações da Conta</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Cliente desde</div>
                  <div className="font-medium">{new Date(customer.createdAt).toLocaleDateString("pt-BR")}</div>
                </div>
              </div>
              {customer.lastOrderAt && (
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600">Último pedido</div>
                    <div className="font-medium">{new Date(customer.lastOrderAt).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Estatísticas</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <ShoppingBag className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{customer.totalOrders}</div>
                <div className="text-sm text-gray-600">Total de Pedidos</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">R$ {customer.totalSpent.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Gasto</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">R$ {averageOrderValue.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Ticket Médio</div>
              </div>
            </div>
          </div>

          {/* Favorite Items */}
          {customer.favoriteItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Itens Favoritos</h3>
                <div className="flex flex-wrap gap-2">
                  {customer.favoriteItems.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Customer Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Observações</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">
                {getCustomerNotes()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
