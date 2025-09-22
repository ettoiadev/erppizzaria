import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Order, OrderStatistics } from "../types"
import { statusLabels } from "../constants"

// Função auxiliar de debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useOrdersData(selectedStatus: string) {
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
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Função para buscar pedidos
  const fetchOrdersImpl = useCallback(async () => {
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
  }, [selectedStatus, toast])
  
  // Criar versão com debounce da função fetchOrdersImpl
  const debouncedFetchRef = useRef<() => void>();
  
  // Inicializar a referência apenas uma vez
  if (!debouncedFetchRef.current) {
    debouncedFetchRef.current = debounce(fetchOrdersImpl, 500);
  }
  
  // Função fetchOrders que será exposta pelo hook
  const fetchOrders = useCallback(() => {
    if (debouncedFetchRef.current) {
      debouncedFetchRef.current();
    }
  }, []);

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
    }
  }

  // Função para arquivar pedidos em lote
  const handleArchiveOrders = async (status: string) => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/orders/archive", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao arquivar pedidos")
      }

      const result = await response.json()
      console.log(`Arquivados ${result.archivedCount} pedidos com status ${status}`)
      
      // Recarregar pedidos após arquivamento
      await fetchOrders()
      
      toast({
        title: "Sucesso",
        description: `${result.archivedCount} pedidos arquivados com sucesso`,
      })
      
    } catch (error: any) {
      console.error("Erro ao arquivar pedidos:", error)
      toast({
        title: "Erro ao Arquivar",
        description: error.message || "Não foi possível arquivar os pedidos. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para arquivar todos os pedidos entregues e cancelados
  const handleArchiveAllCompleted = async () => {
    try {
      setLoading(true)
      
      // Contar quantos pedidos serão arquivados
      const deliveredCount = statistics.delivered
      const cancelledCount = statistics.cancelled
      const totalToArchive = deliveredCount + cancelledCount
      
      if (totalToArchive === 0) {
        toast({
          title: "Nenhum pedido para arquivar",
          description: "Não há pedidos entregues ou cancelados para arquivar.",
        })
        return
      }

      // Arquivar pedidos entregues
      if (deliveredCount > 0) {
        await handleArchiveOrders("DELIVERED")
      }
      
      // Arquivar pedidos cancelados
      if (cancelledCount > 0) {
        await handleArchiveOrders("CANCELLED")
      }
      
      toast({
        title: "Arquivamento Concluído",
        description: `${totalToArchive} pedidos arquivados com sucesso. Kanban limpo para o novo dia!`,
      })
      
    } catch (error: any) {
      console.error("Erro ao arquivar todos os pedidos:", error)
      toast({
        title: "Erro ao Arquivar",
        description: error.message || "Não foi possível arquivar os pedidos. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Efeito para carregar pedidos quando o status selecionado mudar
  useEffect(() => {
    fetchOrdersImpl() // Chamada direta para garantir carregamento imediato na mudança de status
  }, [selectedStatus, fetchOrdersImpl])

  // Atualização manual via botão de refresh

  return {
    orders,
    statistics,
    loading,
    updatingStatus,
    fetchOrders,
    updateOrderStatus,
    handleArchiveOrders,
    handleArchiveAllCompleted,
  }
}