import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { subscribeOrdersRealtime } from '@/lib/realtime'
import type { Order, OrderStatistics } from '../types'
import { statusLabels } from '../constants'
import { useEffect } from 'react'

// Query keys para cache
const ORDERS_QUERY_KEY = 'orders'
const ORDER_STATISTICS_QUERY_KEY = 'order-statistics'

// Função para buscar pedidos otimizada
const fetchOrders = async (selectedStatus: string): Promise<{ orders: Order[]; statistics: OrderStatistics }> => {
  const params = new URLSearchParams()
  if (selectedStatus !== 'all') {
    params.append('status', selectedStatus)
  }

  const response = await fetch(`/api/orders?${params.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Falha ao carregar pedidos')
  }

  return response.json()
}

// Função para atualizar status do pedido
const updateOrderStatus = async ({ orderId, newStatus, notes }: { orderId: string; newStatus: string; notes?: string }) => {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus, notes }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Falha ao atualizar status do pedido')
  }

  return response.json()
}

// Função para arquivar pedidos
const archiveOrders = async (status: string) => {
  const response = await fetch('/api/orders/archive', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify({ status })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Erro ao arquivar pedidos')
  }

  return response.json()
}

export function useOrdersDataOptimized(selectedStatus: string) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Query para buscar pedidos com cache otimizado
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [ORDERS_QUERY_KEY, selectedStatus],
    queryFn: () => fetchOrders(selectedStatus),
    staleTime: 30 * 1000, // 30 segundos - dados considerados frescos
    gcTime: 5 * 60 * 1000, // 5 minutos - tempo de garbage collection
    refetchOnWindowFocus: false, // Não refetch ao focar na janela
    refetchOnMount: true, // Refetch ao montar o componente
    retry: 2, // Tentar novamente 2 vezes em caso de erro
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
  })

  const orders = data?.orders || []
  const statistics = data?.statistics || {
    total: 0,
    received: 0,
    preparing: 0,
    onTheWay: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  }

  // Mutation para atualizar status do pedido
  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (updatedOrder, variables) => {
      // Atualizar cache otimisticamente
      queryClient.setQueryData([ORDERS_QUERY_KEY, selectedStatus], (oldData: any) => {
        if (!oldData) return oldData
        
        const updatedOrders = oldData.orders.map((order: Order) => 
          order.id === variables.orderId ? updatedOrder : order
        )
        
        return {
          ...oldData,
          orders: updatedOrders
        }
      })

      // Invalidar queries relacionadas para recarregar estatísticas
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] })
      
      toast({
        title: 'Sucesso',
        description: `Status do pedido atualizado para ${statusLabels[variables.newStatus as keyof typeof statusLabels]}`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Mutation para arquivar pedidos
  const archiveOrdersMutation = useMutation({
    mutationFn: archiveOrders,
    onSuccess: (result, status) => {
      // Invalidar todas as queries de pedidos
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] })
      
      toast({
        title: 'Sucesso',
        description: `${result.archivedCount} pedidos arquivados com sucesso`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Arquivar',
        description: error.message || 'Não foi possível arquivar os pedidos. Tente novamente.',
        variant: 'destructive'
      })
    },
  })

  // Função para arquivar todos os pedidos entregues e cancelados
  const handleArchiveAllCompleted = async () => {
    const deliveredCount = statistics.delivered
    const cancelledCount = statistics.cancelled
    const totalToArchive = deliveredCount + cancelledCount
    
    if (totalToArchive === 0) {
      toast({
        title: 'Nenhum pedido para arquivar',
        description: 'Não há pedidos entregues ou cancelados para arquivar.',
      })
      return
    }

    try {
      // Arquivar pedidos entregues
      if (deliveredCount > 0) {
        await archiveOrdersMutation.mutateAsync('DELIVERED')
      }
      
      // Arquivar pedidos cancelados
      if (cancelledCount > 0) {
        await archiveOrdersMutation.mutateAsync('CANCELLED')
      }
      
      toast({
        title: 'Arquivamento Concluído',
        description: `${totalToArchive} pedidos arquivados com sucesso. Kanban limpo para o novo dia!`,
      })
    } catch (error: any) {
      console.error('Erro ao arquivar todos os pedidos:', error)
    }
  }

  // Assinar atualizações em tempo real (Supabase Realtime)
  useEffect(() => {
    const sub = subscribeOrdersRealtime({
      onOrderCreated: () => {
        // Invalidar cache para recarregar dados
        queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] })
      },
      onOrderStatusUpdated: () => {
        // Invalidar cache para recarregar dados
        queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] })
      },
      onPaymentApproved: () => {
        // Invalidar cache para recarregar dados
        queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] })
      },
    })
    return () => sub.unsubscribe()
  }, [queryClient])

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro de conexão ao carregar pedidos',
        variant: 'destructive',
      })
    }
  }, [error, toast])

  return {
    orders,
    statistics,
    loading: isLoading,
    updatingStatus: updateStatusMutation.isPending ? 'updating' : null,
    fetchOrders: refetch,
    updateOrderStatus: (orderId: string, newStatus: string, notes?: string) => 
      updateStatusMutation.mutate({ orderId, newStatus, notes }),
    handleArchiveOrders: (status: string) => archiveOrdersMutation.mutate(status),
    handleArchiveAllCompleted,
    isArchiving: archiveOrdersMutation.isPending,
  }
}