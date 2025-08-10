'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Utensils } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  size?: string;
  toppings?: string[];
  special_instructions?: string;
}

interface Order {
  id: string;
  order_number?: string;
  status: string;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  estimated_delivery_time?: string;
  items: OrderItem[];
}

const statusColors = {
  'PENDING': 'bg-yellow-500',
  'RECEIVED': 'bg-blue-500',
  'PREPARING': 'bg-orange-500',
  'READY': 'bg-green-500',
  'OUT_FOR_DELIVERY': 'bg-purple-500',
  'DELIVERED': 'bg-gray-500',
  'CANCELLED': 'bg-red-500'
};

const statusLabels = {
  'PENDING': 'Pendente',
  'RECEIVED': 'Recebido',
  'PREPARING': 'Preparando',
  'READY': 'Pronto',
  'OUT_FOR_DELIVERY': 'Saiu para Entrega',
  'DELIVERED': 'Entregue',
  'CANCELLED': 'Cancelado'
};

export function RealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar pedidos iniciais
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders?status=RECEIVED,PREPARING,READY&limit=50');
      const data = await response.json();
      
      if (data.success || data.orders) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        // Atualizar localmente
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));



        toast({
          title: "Status atualizado",
          description: `Pedido #${orderId} marcado como ${statusLabels[newStatus as keyof typeof statusLabels]}`,
        });
      } else {
        throw new Error(data.error || 'Erro ao atualizar status');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  // Atualizar pedidos periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Carregar pedidos iniciais
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Calcular tempo desde criação
  const getTimeElapsed = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}min`;
    }
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando pedidos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status da conexão */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pedidos da Cozinha</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
          {error && (
            <span className="text-sm text-red-500">
              Erro: {error}
            </span>
          )}
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <Card key={order.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Pedido #{order.order_number || order.id.slice(-6)}
                </CardTitle>
                <Badge 
                  className={`${statusColors[order.status as keyof typeof statusColors]} text-white`}
                >
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {getTimeElapsed(order.created_at)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informações do cliente */}
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {order.customer_address}
                </p>
              </div>

              {/* Itens do pedido */}
              <div className="space-y-2">
                <h4 className="font-medium">Itens:</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="text-sm border-l-2 border-primary pl-2">
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                    {item.size && (
                      <p className="text-muted-foreground">Tamanho: {item.size}</p>
                    )}
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-muted-foreground">
                        Adicionais: {item.toppings.join(', ')}
                      </p>
                    )}
                    {item.special_instructions && (
                      <p className="text-muted-foreground italic">
                        Obs: {item.special_instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Total e pagamento */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">
                  Total: R$ {Number(order.total).toFixed(2)}
                </span>
                <Badge variant={order.payment_status === 'APPROVED' ? 'default' : 'secondary'}>
                  {order.payment_method}
                </Badge>
              </div>

              {/* Ações */}
              <div className="flex space-x-2 pt-2">
                {order.status === 'RECEIVED' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    className="flex-1"
                  >
                    <Utensils className="w-4 h-4 mr-1" />
                    Iniciar Preparo
                  </Button>
                )}
                
                {order.status === 'PREPARING' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Marcar Pronto
                  </Button>
                )}

                {order.status === 'READY' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                    className="flex-1"
                    variant="secondary"
                  >
                    Saiu para Entrega
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum pedido ativo na cozinha</p>
        </div>
      )}
    </div>
  );
}