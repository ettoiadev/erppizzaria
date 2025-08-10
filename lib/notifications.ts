import { toast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { frontendLogger } from './frontend-logger'

// Tipos de notificação
export type NotificationType = 
  | 'new_order'
  | 'order_status_update'
  | 'payment_received'
  | 'payment_failed'
  | 'low_stock'
  | 'delivery_assigned'
  | 'order_delivered'
  | 'order_cancelled'
  | 'system_alert'
  | 'daily_report'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  data?: Record<string, any>
  timestamp: Date
  read: boolean
  userId?: string
  room?: string
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// Classe principal de notificações
export class NotificationService {
  private static instance: NotificationService
  private pushSupported: boolean = false
  private permission: NotificationPermission = 'default'

  private constructor() {
    this.checkPushSupport()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Verificar suporte a push notifications
  private checkPushSupport(): void {
    this.pushSupported = 'Notification' in window && 'serviceWorker' in navigator
    if (this.pushSupported) {
      this.permission = Notification.permission
    }
  }

  // Solicitar permissão para push notifications
  async requestPermission(): Promise<boolean> {
    if (!this.pushSupported) {
      frontendLogger.warn('notifications', 'Push notifications não são suportadas neste navegador')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    } catch (error) {
      frontendLogger.error('notifications', 'Erro ao solicitar permissão para notificações', {
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  // Verificar se tem permissão
  hasPermission(): boolean {
    return this.permission === 'granted'
  }



  // Enviar notificação toast
  showToast(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): void {
    const variant = this.getToastVariant(notification.priority)
    
    toast({
      title: notification.title,
      description: notification.message,
      variant,
      duration: this.getToastDuration(notification.priority),
    })
  }

  // Enviar notificação push
  async showPushNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.pushSupported || this.permission !== 'granted') {
      frontendLogger.warn('notifications', 'Push notifications não disponíveis', {
        pushSupported: this.pushSupported,
        permission: this.permission
      })
      return
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.data?.priority === 'urgent',
        silent: false,
      })

      // Event listeners para ações
      notification.onclick = () => {
        window.focus()
        if (payload.data?.url) {
          window.location.href = payload.data.url
        }
        notification.close()
      }

      notification.onclose = () => {
        frontendLogger.debug('notifications', 'Notificação fechada')
      }

      // Auto-close para notificações não urgentes
      if (payload.data?.priority !== 'urgent') {
        setTimeout(() => {
          notification.close()
        }, 8000)
      }

    } catch (error) {
      frontendLogger.error('notifications', 'Erro ao mostrar push notification', {
        title: payload.title,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Enviar notificação via Supabase Realtime
  async sendRealtimeNotification(notification: NotificationData): Promise<void> {
    try {
      // Usar API para enviar notificação via Supabase Realtime
      await fetch('/api/notifications/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })
    } catch (error) {
      frontendLogger.warn('notifications', 'Erro ao enviar notificação realtime, usando fallback toast', {
        notification_type: notification.type,
        error: error instanceof Error ? error.message : String(error)
      })
      this.showToast(notification)
    }
  }

  // Notificação completa (toast + push + realtime)
  async sendNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const fullNotification: NotificationData = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false,
    }

    // Toast notification (sempre)
    this.showToast(fullNotification)

    // Push notification (se permitido)
    if (this.hasPermission()) {
      await this.showPushNotification({
        title: fullNotification.title,
        body: fullNotification.message,
        data: {
          type: fullNotification.type,
          priority: fullNotification.priority,
          ...fullNotification.data,
        },
      })
    }

    // Realtime notification via Supabase
    await this.sendRealtimeNotification(fullNotification)

    // Salvar no banco de dados
    await this.saveNotification(fullNotification)
  }

  // Notificações específicas por tipo
  async notifyNewOrder(orderData: any): Promise<void> {
    await this.sendNotification({
      type: 'new_order',
      title: '🍕 Novo Pedido Recebido!',
      message: `Pedido #${orderData.id} - ${orderData.customer_name} - R$ ${orderData.total}`,
      priority: 'high',
      data: { orderId: orderData.id, orderData },
      room: 'kitchen',
    })
  }

  async notifyOrderStatusUpdate(orderId: string, status: string, customerName: string): Promise<void> {
    const statusMessages = {
      'PREPARING': 'Pedido em preparação',
      'ON_THE_WAY': 'Pedido saiu para entrega',
      'DELIVERED': 'Pedido entregue',
      'CANCELLED': 'Pedido cancelado',
    }

    await this.sendNotification({
      type: 'order_status_update',
      title: `📋 Status Atualizado - Pedido #${orderId}`,
      message: `${statusMessages[status as keyof typeof statusMessages]} - ${customerName}`,
      priority: 'medium',
      data: { orderId, status, customerName },
      room: 'admin',
    })
  }

  async notifyPaymentReceived(orderId: string, amount: number): Promise<void> {
    await this.sendNotification({
      type: 'payment_received',
      title: '💰 Pagamento Recebido!',
      message: `Pedido #${orderId} - R$ ${amount}`,
      priority: 'high',
      data: { orderId, amount },
      room: 'admin',
    })
  }

  async notifyLowStock(productName: string, currentStock: number): Promise<void> {
    await this.sendNotification({
      type: 'low_stock',
      title: '⚠️ Estoque Baixo',
      message: `${productName} - Apenas ${currentStock} unidades restantes`,
      priority: 'urgent',
      data: { productName, currentStock },
      room: 'admin',
    })
  }

  async notifyDeliveryAssigned(orderId: string, driverName: string): Promise<void> {
    await this.sendNotification({
      type: 'delivery_assigned',
      title: '🚚 Entregador Designado',
      message: `Pedido #${orderId} - ${driverName}`,
      priority: 'medium',
      data: { orderId, driverName },
      room: 'delivery',
    })
  }

  // Utilitários
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getToastVariant(priority: NotificationPriority): 'default' | 'destructive' {
    return priority === 'urgent' ? 'destructive' : 'default'
  }

  private getToastDuration(priority: NotificationPriority): number {
    switch (priority) {
      case 'urgent': return 10000 // 10 segundos
      case 'high': return 8000    // 8 segundos
      case 'medium': return 6000  // 6 segundos
      case 'low': return 4000     // 4 segundos
      default: return 6000
    }
  }

  // Salvar notificação no banco de dados
  private async saveNotification(notification: NotificationData): Promise<void> {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })
    } catch (error) {
      frontendLogger.error('notifications', 'Erro ao salvar notificação', {
        notification_id: notification.id,
        notification_type: notification.type,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
    } catch (error) {
      frontendLogger.error('notifications', 'Erro ao marcar notificação como lida', {
        notification_id: notificationId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Buscar notificações do usuário
  async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationData[]> {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=${limit}`)
      const data = await response.json()
      return data.notifications || []
    } catch (error) {
      frontendLogger.error('notifications', 'Erro ao buscar notificações', {
        user_id: userId,
        limit,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  // Limpar notificações antigas
  async clearOldNotifications(daysOld: number = 30): Promise<void> {
    try {
      await fetch('/api/notifications/clear-old', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysOld }),
      })
    } catch (error) {
      frontendLogger.error('notifications', 'Erro ao limpar notificações antigas', {
        days_old: daysOld,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

// Instância singleton
export const notificationService = NotificationService.getInstance()

// Hook para usar notificações
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    setPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission()
    setPermission(Notification.permission)
    return granted
  }

  return {
    notificationService,
    permission,
    isSupported,
    requestPermission,
    hasPermission: permission === 'granted',
  }
}