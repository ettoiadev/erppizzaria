import { query, transaction } from './db-native';
import { PoolClient } from 'pg';

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
  return await transaction(async (client: PoolClient) => {
    // Inserir pedido
    const orderQuery = `
      INSERT INTO orders (
        user_id, customer_name, customer_phone, customer_address,
        total, subtotal, delivery_fee, discount, status, payment_method,
        payment_status, delivery_type, notes, estimated_delivery_time,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING *
    `;
    
    const orderParams = [
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
    ];
    
    const orderResult = await client.query(orderQuery, orderParams);
    const order = orderResult.rows[0];
    
    // Inserir itens do pedido
    if (items && items.length > 0) {
      const itemsQuery = `
        INSERT INTO order_items (
          order_id, product_id, name, quantity, unit_price, total_price,
          size, toppings, special_instructions, half_and_half
        ) VALUES ${items.map((_, index) => 
          `($${index * 10 + 1}, $${index * 10 + 2}, $${index * 10 + 3}, $${index * 10 + 4}, $${index * 10 + 5}, $${index * 10 + 6}, $${index * 10 + 7}, $${index * 10 + 8}, $${index * 10 + 9}, $${index * 10 + 10})`
        ).join(', ')}
      `;
      
      const itemsParams = items.flatMap(item => [
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
      ]);
      
      await client.query(itemsQuery, itemsParams);
    }
    
    return order;
  });
}

// Buscar pedido por ID com itens
export async function getOrderById(orderId: string): Promise<Order | null> {
  const orderQuery = `
    SELECT o.*, 
           json_agg(
             json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'name', oi.name,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'total_price', oi.total_price,
               'size', oi.size,
               'toppings', oi.toppings,
               'special_instructions', oi.special_instructions,
               'half_and_half', oi.half_and_half
             )
           ) FILTER (WHERE oi.id IS NOT NULL) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = $1
    GROUP BY o.id
  `;
  
  const result = await query(orderQuery, [orderId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const order = result.rows[0];
  return {
    ...order,
    items: order.items || []
  };
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
} = {}): Promise<Order[]> {
  let whereConditions = [];
  let params = [];
  let paramIndex = 1;
  
  if (filters.status) {
    whereConditions.push(`o.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }
  
  if (filters.user_id) {
    whereConditions.push(`o.user_id = $${paramIndex}`);
    params.push(filters.user_id);
    paramIndex++;
  }
  
  if (filters.start_date) {
    whereConditions.push(`o.created_at >= $${paramIndex}`);
    params.push(filters.start_date);
    paramIndex++;
  }
  
  if (filters.end_date) {
    whereConditions.push(`o.created_at <= $${paramIndex}`);
    params.push(filters.end_date);
    paramIndex++;
  }
  
  // Filtrar pedidos não arquivados por padrão (exceto se explicitamente solicitado)
  if (!filters.include_archived) {
    whereConditions.push(`o.archived_at IS NULL`);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const limitClause = filters.limit ? `LIMIT $${paramIndex}` : '';
  if (filters.limit) {
    params.push(filters.limit);
    paramIndex++;
  }
  
  const offsetClause = filters.offset ? `OFFSET $${paramIndex}` : '';
  if (filters.offset) {
    params.push(filters.offset);
  }
  
  const ordersQuery = `
    SELECT o.*, 
           p.full_name, p.email, p.phone,
           json_agg(
             json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'name', oi.name,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'total_price', oi.total_price,
               'size', oi.size,
               'toppings', oi.toppings,
               'special_instructions', oi.special_instructions,
               'half_and_half', oi.half_and_half
             )
           ) FILTER (WHERE oi.id IS NOT NULL) as order_items
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${whereClause}
    GROUP BY o.id, p.full_name, p.email, p.phone
    ORDER BY o.order_number DESC
    ${limitClause}
    ${offsetClause}
  `;
  
  const result = await query(ordersQuery, params);
  
  return result.rows.map(row => ({
    ...row,
    order_items: row.order_items || [],
    items: row.order_items || [] // Para compatibilidade
  }));
}

// Atualizar status do pedido
export async function updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
  const updateQuery = `
    UPDATE orders 
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await query(updateQuery, [status, orderId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Atualizar status de pagamento
export async function updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order | null> {
  const updateQuery = `
    UPDATE orders 
    SET payment_status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await query(updateQuery, [paymentStatus, orderId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Obter estatísticas de pedidos
export async function getOrderStats(startDate?: Date, endDate?: Date) {
  const whereConditions = [];
  const params = [];
  let paramIndex = 1;

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const statsQuery = `
    SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'RECEIVED') as received_orders,
      COUNT(*) FILTER (WHERE status = 'PREPARING') as preparing_orders,
      COUNT(*) FILTER (WHERE status = 'ON_THE_WAY') as on_the_way_orders,
      COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered_orders,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders,
      SUM(total) FILTER (WHERE status = 'DELIVERED') as total_revenue
    FROM orders
    ${whereClause}
  `;

  const result = await query(statsQuery, params);
  return result.rows[0];
}