"use client"

import { useState, useEffect, useCallback } from "react"

export type Notification = {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  created_at: string
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar notificações
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/notifications?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error("Falha ao buscar notificações")
      }
      
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0)
      setError(null)
    } catch (err) {
      console.error("Erro ao buscar notificações:", err)
      setError("Não foi possível carregar as notificações")
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Função para marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Falha ao marcar notificação como lida")
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err)
    }
  }, [userId])

  // Função para marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Falha ao marcar todas notificações como lidas")
      }

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      
      setUnreadCount(0)
    } catch (err) {
      console.error("Erro ao marcar todas notificações como lidas:", err)
    }
  }, [userId])

  // Configurar polling para verificar novas notificações
  useEffect(() => {
    if (!userId) return

    // Buscar notificações inicialmente
    fetchNotifications()

    // Configurar polling a cada 30 segundos
    const intervalId = setInterval(fetchNotifications, 30000)

    // Limpar intervalo ao desmontar
    return () => clearInterval(intervalId)
  }, [userId, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}