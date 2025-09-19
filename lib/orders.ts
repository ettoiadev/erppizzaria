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
  try {
    // Inserir o pedido na tabela orders
    const orderResult = await query(
      `INSERT INTO orders (
        user_id, customer_name, customer_phone, customer_address, 
        total, subtotal, delivery_fee, discount, status, payment_method, 
        payment_status, delivery_type, notes, estimated_delivery_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        orderData.user_id,
        orderData.customer_name,
        orderData.customer_phone,
        orderData.customer_address,
        orderData.total,
        orderData.subtotal || orderData.total,
        orderData.delivery_fee || 0,
        orderData.discount || 0,
        orderData.status,
        orderData.payment_method,
        orderData.payment_status || 'PENDING',
        orderData.delivery_type,
        orderData.notes,
        orderData.estimated_delivery_time || new Date(Date.now() + 45 * 60 * 1000)
      ]
    );
    
    const order = orderResult.rows[0];
    
    // Inserir os itens do pedido
    for (const item of items) {
      await query(
        `INSERT INTO order_items (
          order_id, product_id, name, quantity, unit_price, total_price, 
          size, toppings, special_instructions, half_and_half
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          order.id,
          item.product_id,
          item.name,
          item.quantity,
          item.price,
          item.price * item.quantity,
          item.size,
          JSON.stringify(item.toppings || []),
          item.special_instructions,
          JSON.stringify(item.half_and_half || null)
        ]
      );
    }
    
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
  try {
    // Buscar o pedido
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      return null;
    }
    
    const order = orderResult.rows[0];
    
    // Buscar os itens do pedido
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    const items = itemsResult.rows.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      price: item.unit_price,
      quantity: item.quantity,
      size: item.size,
      toppings: item.toppings ? JSON.parse(item.toppings) : [],
      special_instructions: item.special_instructions,
      half_and_half: item.half_and_half ? JSON.parse(item.half_and_half) : null
    }));
    
    return {
      ...order,
      items: items
    };
  } catch (error) {
    appLogger.error('api', 'Erro ao buscar pedido por ID', error instanceof Error ? error : new Error(String(error)), {
      order_id: orderId
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
  try {
    // Construir query SQL com filtros
    let sqlQuery = `
      SELECT o.*, 
        json_agg(
          CASE WHEN oi.id IS NOT NULL THEN
            json_build_object(
              'product_id', oi.product_id,
              'name', oi.name,
              'price', oi.unit_price,
              'quantity', oi.quantity,
              'size', oi.size,
              'toppings', oi.toppings,
              'special_instructions', oi.special_instructions,
              'half_and_half', oi.half_and_half
            )
          ELSE NULL END
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Aplicar filtros
    if (filters.status && filters.status !== 'all') {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(filters.status);
    }
    
    if (filters.user_id) {
      conditions.push(`o.user_id = $${params.length + 1}`);
      params.push(filters.user_id);
    }
    
    if (filters.start_date) {
      conditions.push(`o.created_at >= $${params.length + 1}`);
      params.push(filters.start_date);
    }
    
    if (filters.end_date) {
      conditions.push(`o.created_at <= $${params.length + 1}`);
      params.push(filters.end_date);
    }
    
    if (!filters.include_archived) {
      conditions.push('o.archived_at IS NULL');
    }
    
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    sqlQuery += `
      GROUP BY o.id, o.user_id, o.customer_name, o.customer_phone, o.customer_address,
               o.total, o.subtotal, o.delivery_fee, o.discount, o.status, o.payment_method,
               o.payment_status, o.delivery_type, o.notes, o.estimated_delivery_time,
               o.order_number, o.created_at, o.updated_at, o.archived_at
      ORDER BY o.created_at DESC
    `;
    
    if (filters.limit) {
      sqlQuery += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }
    
    if (filters.offset) {
      sqlQuery += ` OFFSET $${params.length + 1}`;
      params.push(filters.offset);
    }
    
    const result = await query(sqlQuery, params);
    
    return result.rows.map((row: any) => ({
      ...row,
      items: row.items || []
    }));
  } catch (error) {
    appLogger.error('api', 'Erro ao listar pedidos', error instanceof Error ? error : new Error(String(error)), {
      filters
    });
    throw error;
  }
}

// Atualizar status do pedido
export async function updateOrderStatus(orderId: string, status: string, notes?: string | null): Promise<Order | null> {
  try {
    // Atualizar o status do pedido
    const updateResult = await query(
      `UPDATE orders 
       SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [status, notes, orderId]
    );
    
    if (updateResult.rows.length === 0) {
      return null;
    }
    
    const order = updateResult.rows[0];
    
    // Buscar os itens do pedido
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    const items = itemsResult.rows.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      price: item.unit_price,
      quantity: item.quantity,
      size: item.size,
      toppings: item.toppings ? JSON.parse(item.toppings) : [],
      special_instructions: item.special_instructions,
      half_and_half: item.half_and_half ? JSON.parse(item.half_and_half) : null
    }));
    
    return {
      ...order,
      items: items
    };
  } catch (error) {
    appLogger.error('api', 'Erro ao atualizar status do pedido', error instanceof Error ? error : new Error(String(error)), {
      order_id: orderId,
      new_status: status
    });
    throw error;
  }
}

// Atualizar status de pagamento
export async function updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order | null> {
  try {
    // Atualizar o status de pagamento
    const updateResult = await query(
      `UPDATE orders 
       SET payment_status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [paymentStatus, orderId]
    );
    
    if (updateResult.rows.length === 0) {
      return null;
    }
    
    const order = updateResult.rows[0];
    
    // Buscar os itens do pedido
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    const items = itemsResult.rows.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      price: item.unit_price,
      quantity: item.quantity,
      size: item.size,
      toppings: item.toppings ? JSON.parse(item.toppings) : [],
      special_instructions: item.special_instructions,
      half_and_half: item.half_and_half ? JSON.parse(item.half_and_half) : null
    }));
    
    return {
      ...order,
      items: items
    };
  } catch (error) {
    appLogger.error('api', 'Erro ao atualizar status de pagamento', error instanceof Error ? error : new Error(String(error)), {
      payment_status: paymentStatus
    });
    throw error;
  }
}

// Obter estatísticas de pedidos
export async function getOrderStats(startDate?: Date, endDate?: Date) {
  try {
    appLogger.info('api', 'Obtendo estatísticas de pedidos', {
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString()
    });
    
    // Construir query SQL com filtros de data
    let sqlQuery = 'SELECT * FROM orders';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (startDate) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push(`created_at <= $${params.length + 1}`);
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await query(sqlQuery, params);
    const orders = result.rows;
    
    // Calcular estatísticas
    const stats = {
      total_orders: orders.length,
      received_orders: orders.filter((o: any) => o.status === 'RECEIVED').length,
      preparing_orders: orders.filter((o: any) => o.status === 'PREPARING').length,
      on_the_way_orders: orders.filter((o: any) => o.status === 'ON_THE_WAY').length,
      delivered_orders: orders.filter((o: any) => o.status === 'DELIVERED').length,
      cancelled_orders: orders.filter((o: any) => o.status === 'CANCELLED').length,
      total_revenue: orders
        .filter((o: any) => o.status === 'DELIVERED')
        .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
    };
    
    return stats;
  } catch (error) {
    appLogger.error('api', 'Erro ao obter estatísticas de pedidos', error instanceof Error ? error : new Error(String(error)), {
      start_date: startDate,
      end_date: endDate
    });
    throw error;
  }
}