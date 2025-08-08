"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface NotificationBellProps {
  userId?: string
  className?: string
}

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  // Solicitar permissão para push notifications quando o componente montar
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const granted = await Notification.requestPermission()
      setPermission(granted)
      if (granted === 'granted') {
        console.log('Permissão para push notifications concedida')
      }
    }
  }

  const handleNotificationClick = (notification: any) => {
    // Navegar para a página relevante se houver URL
    if (notification.data?.url) {
      window.location.href = notification.data.url
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return '🍕'
      case 'order_status_update':
        return '📋'
      case 'payment_received':
        return '💰'
      case 'low_stock':
        return '⚠️'
      case 'delivery_assigned':
        return '🚚'
      case 'order_delivered':
        return '✅'
      case 'order_cancelled':
        return '❌'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificações</span>
            {!permission && isSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestPermission}
                className="text-xs"
              >
                Ativar Push
              </Button>
            )}
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.timestamp), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {notification.priority && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-1 ${getNotificationColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                        )}
                      </div>
                      
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>
          
                     {notifications.length > 0 && (
             <>
               <DropdownMenuSeparator />
               <div className="p-2">
                 <Button
                   variant="ghost"
                   size="sm"
                   className="w-full text-xs"
                   onClick={() => {
                     // Marcar todas como lidas
                     setNotifications(prev => 
                       prev.map(notif => ({ ...notif, read: true }))
                     )
                     setUnreadCount(0)
                   }}
                 >
                   <Check className="h-4 w-4 mr-2" />
                   Marcar todas como lidas
                 </Button>
               </div>
             </>
           )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 