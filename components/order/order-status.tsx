"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Package, Bike, CheckCircle, XCircle } from "lucide-react"

const statusConfig = {
  RECEIVED: {
    label: "Recebido",
    description: "Seu pedido foi recebido e está sendo preparado",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  PREPARING: {
    label: "Preparando",
    description: "Seu pedido está sendo preparado com carinho",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  ON_THE_WAY: {
    label: "Saiu para Entrega",
    description: "Seu pedido está a caminho! Nosso motoboy já saiu para entrega",
    color: "bg-purple-100 text-purple-800",
    icon: Bike,
  },
  DELIVERED: {
    label: "Entregue",
    description: "Seu pedido foi entregue com sucesso!",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelado",
    description: "Este pedido foi cancelado",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
}

interface OrderStatusProps {
  status: string
  estimatedDelivery?: string
}

export function OrderStatus({ status, estimatedDelivery }: OrderStatusProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.RECEIVED
  const IconComponent = config.icon

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          Status do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <IconComponent className="h-6 w-6 text-gray-600" />
            <Badge className={config.color}>
              {config.label}
            </Badge>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{config.description}</p>
        
        {estimatedDelivery && status !== "DELIVERED" && status !== "CANCELLED" && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tempo estimado:</strong> {estimatedDelivery}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
