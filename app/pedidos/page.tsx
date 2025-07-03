"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Package, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface OrderItem {
  id: string
  quantity: number
  products?: {
    name: string
  }
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  delivery_address?: string
  order_items?: OrderItem[]
}

export default function OrdersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    data: ordersData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders", { userId: user?.id }],
    queryFn: async (): Promise<Order[]> => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado")
      }

      console.log("Buscando pedidos para o usuário:", user.id)
      
      const response = await fetch(`/api/orders?userId=${user.id}&limit=50`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Pedidos carregados:", data)
      
      return data.orders || []
    },
    enabled: !!user?.id, // Só executa se tiver usuário
    refetchOnWindowFocus: true, // Atualiza quando a janela recebe foco
    staleTime: 1000 * 60 * 5, // Considera dados válidos por 5 minutos
    retry: 3
  })

  // Handle errors with useEffect or within components
  if (error) {
    console.error("Erro ao carregar pedidos:", error)
  }

  const orders = ordersData || []

  const handleRefresh = () => {
    refetch().catch((err) => {
      console.error("Erro ao atualizar pedidos:", err)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seus pedidos. Tente novamente.",
        variant: "destructive",
      })
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "PREPARING":
      case "RECEIVED":
      case "ON_THE_WAY":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "Entregue"
      case "PREPARING":
        return "Preparando"
      case "RECEIVED":
        return "Recebido"
      case "ON_THE_WAY":
        return "Saiu para Entrega"
      case "CANCELLED":
        return "Cancelado"
      default:
        return "Desconhecido"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "PREPARING":
      case "RECEIVED":
      case "ON_THE_WAY":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const getOrderItems = (orderItems: OrderItem[]) => {
    if (!orderItems || orderItems.length === 0) return "Nenhum item"
    
    return orderItems
      .map(item => `${item.quantity}x ${item.products?.name || "Produto"}`)
      .join(", ")
  }

  const handleViewDetails = (orderId: string) => {
    console.log("Navegando para detalhes do pedido:", orderId)
    router.push(`/pedido/${orderId}`)
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
              <p className="text-gray-600">Acompanhe o histórico dos seus pedidos</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">Carregando seus pedidos...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar pedidos</h3>
            <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Pedido #{order.id.slice(-8)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.status)}
                        <span>{getStatusLabel(order.status)}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Data do Pedido</p>
                      <p className="font-medium">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Itens</p>
                      <p className="font-medium">{getOrderItems(order.order_items || [])}</p>
                    </div>
                  </div>
                  
                  {order.delivery_address && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">Endereço de Entrega</p>
                      <p className="text-sm">{order.delivery_address}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      Ver Detalhes
                    </Button>
                    {order.status?.toUpperCase() === "DELIVERED" && (
                      <Button size="sm">Pedir Novamente</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-4">Você ainda não fez nenhum pedido conosco.</p>
            <Button onClick={() => router.push("/cardapio")}>
              Fazer Primeiro Pedido
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
