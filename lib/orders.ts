// Importar diretamente do db-supabase para usar o cliente Supabase
import { getSupabaseServerClient } from './supabase';
import { query } from './db';
import { appLogger } from './logging';

export interface OrderData {
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  discount?: number;
  status: 'PENDING' | 'RECEIVED' | 'PREPARING' | 'READY' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
  payment_method: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'MERCADO_PAGO';
  payment_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  delivery_type: 'delivery' | 'pickup' | 'dine_in';
  notes?: string;
  estimated_delivery_time?: Date;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  toppings?: string[];
  special_instructions?: string;
  half_and_half?: any;
}

export interface Order extends OrderData {
  id: string;
  order_number?: number;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}

// Criar pedido com itens
export async function createOrder(orderData: OrderData, items: OrderItem[]): Promise<Order> {
  // Importar a função do db-supabase para manter compatibilidade
  const { createOrder: createOrderSupabase } = require('./db-supabase');
  
  try {
    // Adaptar os dados para o formato esperado pelo createOrderSupabase
    const input = {
      user_id: orderData.user_id,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address,
      total: orderData.total,
      subtotal: orderData.subtotal || orderData.total,
      delivery_fee: orderData.delivery_fee || 0,
      discount: orderData.discount || 0,
      status: orderData.status,
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status || 'PENDING',
      notes: orderData.notes,
      estimated_delivery_time: orderData.estimated_delivery_time ? 
        orderData.estimated_delivery_time.toISOString() : 
        new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      items: items.map(item => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        size: item.size,
        toppings: item.toppings || [],
        special_instructions: item.special_instructions,
        half_and_half: item.half_and_half || null
      }))
    };
    
    // Chamar a função do Supabase
    const order = await createOrderSupabase(input);
    
    return {
      ...order,
      items: items
    };
  } catch (error) {
    appLogger.error('api', 'Erro ao criar pedido', error instanceof Error ? error : new Error(String(error)), {
      user_id: orderData.user_id,
      total: orderData.total,
      items_count: items.length
    });
    throw error;
  }
}

// Buscar pedido por ID com itens
export async function getOrderById(orderId: string): Promise<Order | null> {
  // Importar a função do db-supabase para manter compatibilidade
  const { getOrderById: getOrderByIdSupabase } = require('./db-supabase');
  
  try {
    const order = await getOrderByIdSupabase(orderId);
    
    if (!order) {
      return null;
    }
    
    return {
      ...order,
      items: order.items || order.order_items || []
    };
  } catch (error) {
    appLogger.error('orders', 'Erro ao buscar pedido por ID', { 
      order_id: orderId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Listar pedidos com filtros
export async function getOrders(filters: {
  status?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
  start_date?: Date;
  end_date?: Date;
  include_archived?: boolean;
}): Promise<Order[]> {
  // Importar a função do db-supabase para manter compatibilidade
  const { listOrders } = require('./db-supabase');
  
  try {
    // Adaptar os filtros para o formato esperado pelo listOrders
    const params: any = {
      status: filters.status !== 'all' ? filters.status : null,
      userId: filters.user_id,
      limit: filters.limit,
      offset: filters.offset
    };
    
    // Chamar a função do Supabase
    const { orders } = await listOrders(params);
    
    // Filtrar por data se necessário (já que o Supabase não suporta diretamente)
    let filteredOrders = [...orders];
    
    if (filters.start_date) {
      const startTimestamp = filters.start_date.getTime();
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_at).getTime() >= startTimestamp
      );
    }
    
    if (filters.end_date) {
      const endTimestamp = filters.end_date.getTime();
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_at).getTime() <= endTimestamp
      );
    }
    
    // Filtrar pedidos arquivados se necessário
    if (!filters.include_archived) {
      filteredOrders = filteredOrders.filter(order => !order.archived_at);
    }
    
    return filteredOrders.map(order => ({
      ...order,
      items: order.items || order.order_items || []
    }));
  } catch (error) {
    appLogger.error('orders', 'Erro ao listar pedidos', { 
      filters,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }

}

// Atualizar status do pedido
export async function updateOrderStatus(orderId: string, status: string, notes?: string | null): Promise<Order | null> {
  try {
    // Usar a implementação do Supabase
    const { updateOrderStatus } = await import('./db-supabase');
    const order = await updateOrderStatus(orderId, status, notes);
    return order as Order;
  } catch (error) {
    appLogger.error('orders', 'Erro ao atualizar status do pedido', { 
      order_id: orderId,
      status,
      notes,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Atualizar status de pagamento
export async function updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order | null> {
  try {
    // Usar a implementação do Supabase
    const { updatePaymentStatus } = await import('./db-supabase');
    const order = await updatePaymentStatus(orderId, paymentStatus);
    return order as Order;
  } catch (error) {
    appLogger.error('orders', 'Erro ao atualizar status de pagamento', { 
      order_id: orderId,
      payment_status: paymentStatus,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Obter estatísticas de pedidos
export async function getOrderStats(startDate?: Date, endDate?: Date) {
  try {
    appLogger.info('orders', 'Obtendo estatísticas de pedidos', { 
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString()
    });
    
    const supabase = getSupabaseServerClient();
    let queryBuilder = supabase.from('orders').select('*', { count: 'exact' });
    
    // Aplicar filtros de data se fornecidos
    if (startDate) {
      queryBuilder = queryBuilder.gte('created_at', startDate.toISOString());
    }
    
    if (endDate) {
      queryBuilder = queryBuilder.lte('created_at', endDate.toISOString());
    }
    
    const { data, error, count } = await queryBuilder;
    
    if (error) {
      appLogger.error('orders', 'Erro ao obter estatísticas de pedidos', { 
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        error: error.message
      });
      throw error;
    }
    
    // Calcular estatísticas
    const stats = {
      total_orders: count || 0,
      received_orders: (data || []).filter(o => o.status === 'RECEIVED').length,
      preparing_orders: (data || []).filter(o => o.status === 'PREPARING').length,
      on_the_way_orders: (data || []).filter(o => o.status === 'ON_THE_WAY').length,
      delivered_orders: (data || []).filter(o => o.status === 'DELIVERED').length,
      cancelled_orders: (data || []).filter(o => o.status === 'CANCELLED').length,
      total_revenue: (data || [])
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + Number(o.total || 0), 0)
    };
    
    return stats;
  } catch (error) {
    appLogger.error('orders', 'Erro ao obter estatísticas de pedidos', { 
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}