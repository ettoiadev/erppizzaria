"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { OrderStatus } from "@/components/order/order-status"
import { OrderDetails } from "@/components/order/order-details"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const orderId = params.id as string

  console.log("OrderPage - Order ID:", orderId)
  console.log("OrderPage - Current user:", user)
  console.log("OrderPage - Auth loading:", authLoading)

  // Redirecionar se não estiver logado APENAS após terminar o carregamento
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("OrderPage - Redirecionando para login (usuário não autenticado)")
      router.push("/login?redirect=" + encodeURIComponent(`/pedido/${orderId}`))
    }
  }, [user, authLoading, router, orderId])

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      console.log("OrderPage - Fetching order:", orderId)
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar pedido")
      }
      const data = await response.json()
      console.log("OrderPage - Order data:", data)
      return data
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    enabled: !!orderId && !!user && !authLoading, // Só executa se tiver ID, usuário E terminou carregamento
  })

  // Mostrar loading enquanto a autenticação está carregando
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário após carregar, o useEffect já vai redirecionar
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Carregando detalhes do pedido...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
            <p className="text-gray-600 mb-8">
              {error instanceof Error ? error.message : "Não foi possível encontrar este pedido."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push("/pedidos")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Meus Pedidos
              </Button>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Verificar se o pedido pertence ao usuário logado
  if (order.user_id !== user.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso negado</h1>
            <p className="text-gray-600 mb-8">Você não tem permissão para visualizar este pedido.</p>
            <Button onClick={() => router.push("/pedidos")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Meus Pedidos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header com navegação */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.push("/pedidos")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Pedido #{order.id.slice(-8)}</h1>
              <p className="text-gray-600">Realizado em {new Date(order.created_at).toLocaleString("pt-BR")}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Status do pedido */}
          <OrderStatus status={order.status} estimatedDelivery={order.estimated_delivery_time} />

          {/* Detalhes do pedido */}
          <OrderDetails order={order} />

          {/* Ações adicionais */}
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Precisa de ajuda?</h3>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push("/contato")}>
                Entrar em Contato
              </Button>
              <Button variant="outline" onClick={() => router.push("/pedidos")}>
                Ver Todos os Pedidos
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
