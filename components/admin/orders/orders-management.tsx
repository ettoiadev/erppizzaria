"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Clock, Phone, MapPin, CreditCard, Package, Bike, CheckCircle, XCircle, Eye, RefreshCw, Bell, Dot, Printer, Store, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ManualOrderForm } from "./manual-order-form"


const statusColors = {
  RECEIVED: "bg-blue-500 text-white border-blue-600 shadow-md",
  PREPARING: "bg-yellow-500 text-black border-yellow-600 shadow-md font-bold",
  ON_THE_WAY: "bg-blue-600 text-white border-blue-700 shadow-md font-bold",
  DELIVERED: "bg-green-500 text-white border-green-600 shadow-md",
  CANCELLED: "bg-red-500 text-white border-red-600 shadow-md",
}

const statusLabels = {
  RECEIVED: "Recebido",
  PREPARING: "Preparando",
  ON_THE_WAY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const statusIcons = {
  RECEIVED: Package,
  PREPARING: Clock,
  ON_THE_WAY: Bike,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
}

interface OrderItem {
  id: string
  name?: string // Nome do produto no item
  quantity: number
  unit_price: number
  total_price: number
  size?: string
  toppings?: string[]
  products: {
    name: string
    description: string
    image: string
  }
  half_and_half?: {
    firstHalf?: {
      productName: string
      toppings: string[]
    }
    secondHalf?: {
      productName: string
      toppings: string[]
    }
  }
  special_instructions?: string
}

interface Order {
  id: string
  status: keyof typeof statusLabels
  total: number
  subtotal: number
  delivery_fee: number
  discount: number
  payment_method: string
  delivery_address: string
  delivery_phone: string
  delivery_instructions?: string
  estimated_delivery_time?: string
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    phone?: string
  }
  // Novos campos calculados da API para exibição correta do cliente
  customer_display_name?: string
  customer_display_phone?: string
  customer_name?: string
  order_items: OrderItem[]
}

interface OrderStatistics {
  total: number
  received: number
  preparing: number
  onTheWay: number
  delivered: number
  cancelled: number
  totalRevenue: number
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statistics, setStatistics] = useState<OrderStatistics>({
    total: 0,
    received: 0,
    preparing: 0,
    onTheWay: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  })
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [cancellationNotes, setCancellationNotes] = useState("")
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus)
      }

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStatistics(data.statistics || {})
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Falha ao carregar pedidos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar pedidos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [selectedStatus])

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    try {
      setUpdatingStatus(orderId)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()

        // Atualizar a lista de pedidos
        setOrders((prevOrders) => prevOrders.map((order) => (order.id === orderId ? updatedOrder : order)))

        toast({
          title: "Sucesso",
          description: `Status do pedido atualizado para ${statusLabels[newStatus as keyof typeof statusLabels]}`,
        })

        // Recarregar estatísticas
        fetchOrders()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Falha ao atualizar status do pedido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao atualizar pedido",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
      setCancellationNotes("")
    }
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      RECEIVED: Package,
      PREPARING: Clock,
      ON_THE_WAY: Bike,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle,
    }
    return icons[status as keyof typeof icons] || Package
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "RECEIVED":
        return { status: "PREPARING", label: "Iniciar Preparo", icon: Clock }
      case "PREPARING":
        return { status: "ON_THE_WAY", label: "Enviar para Entrega", icon: Bike }
      case "ON_THE_WAY":
        return { status: "DELIVERED", label: "Marcar como Entregue", icon: CheckCircle }
      default:
        return null
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  const handleManualOrderSuccess = () => {
    fetchOrders()
    setIsManualOrderModalOpen(false)
  }

  // Mapeamento de métodos de pagamento do backend para português
  const mapPaymentMethodToPortuguese = (backendValue: string): string => {
    const paymentMapping: Record<string, string> = {
      "PIX": "PIX",
      "CASH": "Dinheiro",
      "CREDIT_CARD": "Cartão de Crédito", 
      "DEBIT_CARD": "Cartão de Débito",
      "CARD_ON_DELIVERY": "Cartão na Entrega"
    }
    return paymentMapping[backendValue] || backendValue
  }

  // Função para imprimir pedido para a cozinha
  const printKitchenReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleString("pt-BR", {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido #${order.id.slice(-8)} - Cozinha</title>
        <style>
          @media print {
            @page { 
              margin: 5mm; 
              size: 80mm auto;
            }
            body { 
              margin: 0; 
              font-size: 11px;
              line-height: 1.2;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 70mm;
            margin: 0 auto;
            padding: 5mm;
            background: white;
            color: black;
            font-size: 11px;
            line-height: 1.3;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .order-number {
            font-size: 18px;
            font-weight: bold;
            margin: 5px 0;
          }
          .status {
            background: #000;
            color: white;
            padding: 3px 8px;
            font-weight: bold;
            font-size: 12px;
            margin: 5px 0;
          }
          .section {
            margin: 8px 0;
            padding: 3px 0;
          }
          .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 3px;
          }
          .item {
            margin: 3px 0;
            padding: 2px 0;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            margin-left: 5px;
            font-size: 10px;
          }
          .observations {
            background: #f0f0f0;
            padding: 5px;
            border: 1px solid #000;
            margin: 5px 0;
            font-weight: bold;
          }
          .footer {
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
            text-align: center;
            font-size: 10px;
          }
          .dashed-line {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .customer-info {
            font-size: 10px;
            margin: 2px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-weight: bold; font-size: 14px;">WILLIAM DISK PIZZA</div>
          <div style="font-size: 10px;">PEDIDO PARA COZINHA</div>
          <div class="order-number">PEDIDO #${order.id.slice(-8)}</div>
          <div class="status">${statusLabels[order.status]}</div>
        </div>

        <div class="section">
          <div style="font-weight: bold;">DATA/HORA:</div>
          <div>${formatDateTime(order.created_at)}</div>
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">CLIENTE</div>
          <div class="customer-info">Nome: ${order.customer_display_name || order.profiles?.full_name || order.customer_name || 'N/A'}</div>
          <div class="customer-info">Fone: ${order.customer_display_phone || order.delivery_phone || order.profiles?.phone || 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">ENTREGA</div>
          <div style="font-size: 10px; word-wrap: break-word;">
            ${order.delivery_address}
          </div>
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">ITENS DO PEDIDO</div>
          ${order.order_items?.map(item => `
            <div class="item">
              <div class="item-name">${item.quantity}x ${item.products?.name || (item as any).name || 'Produto'}</div>
              ${item.size ? `<div class="item-details">Tamanho: ${item.size}</div>` : ''}
              
              ${item.half_and_half ? `
                <div class="item-details" style="background: #f0f0f0; padding: 3px; margin: 2px 0; border: 1px solid #ccc;">
                  <div style="font-weight: bold;">🍕 PIZZA MEIO A MEIO:</div>
                  <div>1ª metade: ${item.half_and_half.firstHalf?.productName || ''}</div>
                  ${item.half_and_half.firstHalf?.toppings && item.half_and_half.firstHalf.toppings.length > 0 ? 
                    `<div style="margin-left: 10px;">+ ${item.half_and_half.firstHalf.toppings.join(', ')}</div>` : ''
                  }
                  <div>2ª metade: ${item.half_and_half.secondHalf?.productName || ''}</div>
                  ${item.half_and_half.secondHalf?.toppings && item.half_and_half.secondHalf.toppings.length > 0 ? 
                    `<div style="margin-left: 10px;">+ ${item.half_and_half.secondHalf.toppings.join(', ')}</div>` : ''
                  }
                </div>
              ` : ''}
              
              ${!item.half_and_half && item.toppings && item.toppings.length > 0 ? 
                `<div class="item-details">Adicionais: ${item.toppings.join(', ')}</div>` : ''
              }
              
              ${item.special_instructions ? `
                <div class="observations" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 3px; margin: 2px 0;">
                  <div style="font-weight: bold; font-size: 10px;">📝 OBSERVAÇÕES:</div>
                  <div style="font-size: 10px;">${item.special_instructions}</div>
                </div>
              ` : ''}
            </div>
          `).join('') || ''}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div style="font-weight: bold;">PAGAMENTO: ${mapPaymentMethodToPortuguese(order.payment_method)}</div>
          <div style="font-weight: bold;">TOTAL: ${formatCurrency(order.total)}</div>
        </div>

        ${order.delivery_instructions ? `
          <div class="observations">
            <div style="text-decoration: underline; margin-bottom: 3px;">OBSERVAÇÕES:</div>
            <div>${order.delivery_instructions}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div class="dashed-line"></div>
          <div>Impresso em: ${new Date().toLocaleString('pt-BR')}</div>
          <div style="margin-top: 5px; font-weight: bold;">
            ${order.status === 'RECEIVED' ? '⏰ AGUARDANDO PREPARO' : 
              order.status === 'PREPARING' ? '🔥 EM PREPARO' : 
              '✅ PROCESSADO'}
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    
    // Aguardar carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }

    toast({
      title: "Imprimindo",
      description: `Pedido #${order.id.slice(-8)} enviado para impressão`,
    })
  }

  const filteredOrders = orders

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Preparo</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.received + statistics.preparing}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Entrega</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.onTheWay}</p>
              </div>
              <Bike className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entregues</p>
                <p className="text-2xl font-bold text-green-600">{statistics.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalRevenue)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="text-gray-600">Acompanhe e gerencie todos os pedidos</p>
        </div>

        <div className="flex gap-3">
          <Dialog open={isManualOrderModalOpen} onOpenChange={setIsManualOrderModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Package className="h-4 w-4" />
                Novo Pedido Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Pedido Manual</DialogTitle>
              </DialogHeader>
              <ManualOrderForm onSuccess={handleManualOrderSuccess} />
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={fetchOrders} 
            disabled={loading} 
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="RECEIVED">
                <div className="flex items-center gap-2">
                  Recebidos ({statistics.received})
                  {statistics.received > 0 && <Badge variant="secondary" className="text-xs">{statistics.received}</Badge>}
                </div>
              </SelectItem>
              <SelectItem value="PREPARING">Preparando ({statistics.preparing})</SelectItem>
              <SelectItem value="ON_THE_WAY">Saiu para Entrega ({statistics.onTheWay})</SelectItem>
              <SelectItem value="DELIVERED">Entregues ({statistics.delivered})</SelectItem>
              <SelectItem value="CANCELLED">Cancelados ({statistics.cancelled})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status)
            const nextAction = getNextStatus(order.status)

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow overflow-hidden border-2">
                {/* STATUS EM DESTAQUE NO TOPO */}
                <div className={`px-6 py-4 ${statusColors[order.status]} border-b-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-7 w-7" />
                      <span className="text-xl font-bold tracking-wide">
                        {statusLabels[order.status]}
                      </span>
                      {/* Badge para pedidos manuais */}
                      {(order.delivery_address === "Manual (Balcão)" || order.delivery_address === "Manual (Telefone)") && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 font-medium">
                          {order.delivery_address === "Manual (Balcão)" ? (
                            <><Store className="h-3 w-3 mr-1" />BALCÃO</>
                          ) : (
                            <><Phone className="h-3 w-3 mr-1" />TELEFONE</>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">Pedido #{order.id.slice(-8)}</p>
                      <p className="text-sm opacity-90">{formatDateTime(order.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.customer_display_name || order.profiles?.full_name || order.customer_name || "Cliente não identificado"}
                    </span>
                    <span>{order.customer_display_phone || order.delivery_phone || order.profiles?.phone || "Sem telefone"}</span>
                    <span className="ml-auto font-bold text-lg text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Endereço de entrega */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Endereço de Entrega:</p>
                      <p className="text-gray-600">{order.delivery_address}</p>
                      {order.delivery_instructions && (
                        <p className="text-gray-500 italic">Obs: {order.delivery_instructions}</p>
                      )}
                    </div>
                  </div>

                  {/* Itens do pedido */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Itens do Pedido:
                    </h4>
                    <div className="space-y-1">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="space-y-2 bg-gray-50 p-3 rounded border">
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {item.quantity}x {item.products?.name || item.name || "Produto não encontrado"}
                              {item.size && ` (${item.size})`}
                            </span>
                            <span className="font-medium">{formatCurrency(item.total_price)}</span>
                          </div>
                          
                          {/* Informações de pizza meio a meio */}
                          {item.half_and_half && (
                            <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                              <p className="font-medium text-blue-800 mb-1">🍕 Pizza Meio a Meio:</p>
                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium">1ª metade:</span> {item.half_and_half.firstHalf?.productName}
                                  {item.half_and_half.firstHalf?.toppings && item.half_and_half.firstHalf.toppings.length > 0 && (
                                    <div className="text-gray-500 ml-2">+ {item.half_and_half.firstHalf.toppings.join(", ")}</div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">2ª metade:</span> {item.half_and_half.secondHalf?.productName}
                                  {item.half_and_half.secondHalf?.toppings && item.half_and_half.secondHalf.toppings.length > 0 && (
                                    <div className="text-gray-500 ml-2">+ {item.half_and_half.secondHalf.toppings.join(", ")}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Adicionais para produtos normais */}
                          {!item.half_and_half && item.toppings && item.toppings.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Adicionais:</span> {item.toppings.join(", ")}
                            </div>
                          )}
                          
                          {/* Observações do item */}
                          {item.special_instructions && (
                            <div className="text-xs bg-orange-50 p-2 rounded border border-orange-200">
                              <span className="font-medium text-orange-700">📝 Observações:</span> {item.special_instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      {order.delivery_fee > 0 && (
                        <div className="flex justify-between">
                          <span>Taxa de Entrega:</span>
                          <span>{formatCurrency(order.delivery_fee)}</span>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-1 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações de pagamento e tempo */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        {mapPaymentMethodToPortuguese(order.payment_method)}
                      </span>
                      {order.estimated_delivery_time && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          Previsão: {formatDateTime(order.estimated_delivery_time)}
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      {/* Botão de Impressão para Cozinha */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => printKitchenReceipt(order)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                        title="Imprimir para cozinha"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Pedido #{order.id.slice(-8)}</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label>Cliente:</Label>
                                  <p>{selectedOrder.customer_display_name || selectedOrder.profiles?.full_name || selectedOrder.customer_name || "Cliente não identificado"}</p>
                                </div>
                                <div>
                                  <Label>Telefone:</Label>
                                  <p>{selectedOrder.customer_display_phone || selectedOrder.delivery_phone || selectedOrder.profiles?.phone || "Sem telefone"}</p>
                                </div>
                                <div>
                                  <Label>Status:</Label>
                                  <Badge className={statusColors[selectedOrder.status]}>
                                    {statusLabels[selectedOrder.status]}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Método de Pagamento:</Label>
                                  <p>{mapPaymentMethodToPortuguese(selectedOrder.payment_method)}</p>
                                </div>
                              </div>

                              <div>
                                <Label>Endereço de Entrega:</Label>
                                <p className="text-sm">{selectedOrder.delivery_address}</p>
                                {selectedOrder.delivery_instructions && (
                                  <p className="text-sm text-gray-500 italic">
                                    Instruções: {selectedOrder.delivery_instructions}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label>Itens do Pedido:</Label>
                                <div className="space-y-2 mt-2">
                                  {selectedOrder.order_items?.map((item, index) => (
                                    <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                                      <div>
                                        <p className="font-medium">{item.products?.name || (item as any).name || "Produto não encontrado"}</p>
                                        <p className="text-sm text-gray-600">
                                          Quantidade: {item.quantity}
                                          {item.size && ` • Tamanho: ${item.size}`}
                                        </p>
                                        {item.toppings && item.toppings.length > 0 && (
                                          <p className="text-sm text-gray-500">
                                            Adicionais: {item.toppings.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                        <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} cada</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {nextAction && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, nextAction.status)}
                          disabled={updatingStatus === order.id}
                          className="flex items-center gap-1"
                        >
                          {updatingStatus === order.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <nextAction.icon className="h-4 w-4" />
                          )}
                          {nextAction.label}
                        </Button>
                      )}

                      {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancelar Pedido</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>Tem certeza que deseja cancelar este pedido?</p>
                              <div>
                                <Label htmlFor="cancellation-notes">Motivo do cancelamento (opcional):</Label>
                                <Textarea
                                  id="cancellation-notes"
                                  value={cancellationNotes}
                                  onChange={(e) => setCancellationNotes(e.target.value)}
                                  placeholder="Descreva o motivo do cancelamento..."
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setCancellationNotes("")}>
                                  Cancelar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => updateOrderStatus(order.id, "CANCELLED", cancellationNotes)}
                                  disabled={updatingStatus === order.id}
                                >
                                  {updatingStatus === order.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Confirmar Cancelamento
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
