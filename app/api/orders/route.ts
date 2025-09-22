import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'
import { orderSchema } from '@/lib/validation-schemas'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/simple-rate-limit'
import { createSecureResponse, createSecureErrorResponse, sanitizeInput, validateTrustedOrigin } from '@/lib/security-utils'
import { MemoryCache } from '@/lib/cache-manager'

// Criar instância de cache para pedidos com TTL de 30 segundos
const ordersCache = new MemoryCache({
  defaultTTL: 30 * 1000, // 30 segundos
  maxSize: 100, // máximo 100 itens no cache
  cleanupInterval: 60 * 1000 // limpeza a cada 1 minuto
})

// Função para invalidar todo o cache de pedidos
function invalidateOrdersCache() {
  // Limpar todos os itens do cache que começam com 'orders_'
  const cacheEntries = Array.from(ordersCache['cache'].entries())
  for (const [key] of cacheEntries) {
    if (key.startsWith('orders_')) {
      ordersCache['cache'].delete(key)
    }
  }
  frontendLogger.info('Cache de pedidos invalidado')
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para listar pedidos
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    frontendLogger.info('Buscando lista de pedidos')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Gerar chave de cache baseada nos parâmetros da requisição
    const cacheKey = `orders_${status || 'all'}_${userId || 'all'}_${limit}_${offset}`
    
    // Verificar se os dados estão em cache
    const cachedData = ordersCache.get(cacheKey)
    if (cachedData) {
      frontendLogger.info(`Usando dados em cache para pedidos: ${cacheKey}`)
      return createSecureResponse(cachedData, 200, request)
    }

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1
    
    if (status) {
      whereClause += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    
    if (userId) {
      whereClause += ` AND user_id = $${paramIndex}`
      params.push(userId)
      paramIndex++
    }
    
    const ordersResult = await query(`
      SELECT id, customer_id, total_amount, delivery_fee, status, payment_method,
             notes, estimated_delivery_time, created_at, updated_at, delivery_address
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])
    
    const orders = {
      orders: ordersResult.rows,
      total: ordersResult.rows.length
    }
    
    // Armazenar resultado no cache
    ordersCache.set(cacheKey, orders)
    
    frontendLogger.info(`Encontrados ${orders.orders.length} pedidos (armazenados em cache)`)
    return createSecureResponse(orders, 200, request)
  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar pedidos', {}, error, 'api')
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
  }
}

// Handler POST para criar pedido
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validar origem confiável
  if (!validateTrustedOrigin(request)) {
    return createSecureErrorResponse('Origem não autorizada', 403, request, 'warn')
  }

  // Verificar rate limiting
  const rateLimitCheck = checkRateLimit(request, 'orders')
  if (!rateLimitCheck.allowed) {
    return addCorsHeaders(rateLimitCheck.response!)
  }

  try {
    frontendLogger.info('Criando novo pedido')
    
    // Parse do JSON
    let body
    try {
      body = await request.json()
      // Sanitizar dados de entrada
      body = sanitizeInput(body)
    } catch (error) {
      frontendLogger.logError('Erro ao fazer parse do JSON:', {}, error as Error, 'api')
      return createSecureErrorResponse('JSON inválido', 400, request, 'warn')
    }

    // Validação usando Zod
    const validationResult = orderSchema.safeParse(body)
    if (!validationResult.success) {
      frontendLogger.logError('Dados de pedido inválidos:', {}, validationResult.error as Error, 'api')
      return createSecureErrorResponse('Dados inválidos', 400, request, 'warn')
    }

    const validatedData = validationResult.data
  
    // Mapear campos do schema validado
    const user_id = validatedData.userId
    const payment_method = validatedData.paymentMethod || 'cash' // Valor padrão
    const total = validatedData.total
    const notes = validatedData.notes ?? null
    const items = Array.isArray(validatedData.items) ? validatedData.items : []
    const deliveryAddress = validatedData.deliveryAddress
    const couponCode = validatedData.couponCode
    
    // Valores padrão para campos não presentes no schema
    const subtotal = 0
    const delivery_fee = 0
    const discount = 0
    const status = 'RECEIVED'
    const payment_status = 'PENDING'
    const delivery_type = 'delivery'
    const estimated_delivery_time = null
  
    // Processar itens do pedido
    const itemsPayload = (items || []).map((item: any) => ({
      product_id: item.product_id ?? item.id ?? null,
      name: item.name ?? 'Produto',
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price ?? item.price ?? null,
      total_price: item.total_price ?? null,
      size: item.size ?? null,
      toppings: item.toppings ?? null,
      special_instructions: item.special_instructions ?? item.notes ?? null,
      half_and_half: item.half_and_half ?? item.halfAndHalf ?? null,
    }))
  
    // Criar pedido no PostgreSQL
    const orderResult = await query(`
      INSERT INTO orders (
        customer_id, total_amount, delivery_fee, status, payment_method,
        notes, estimated_delivery_time, delivery_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, customer_id, total_amount, delivery_fee, status, payment_method,
                notes, estimated_delivery_time, created_at, updated_at, delivery_address
    `, [
      user_id,
      total,
      delivery_fee,
      status,
      payment_method,
      notes,
      estimated_delivery_time,
      deliveryAddress ? JSON.stringify(deliveryAddress) : null
    ])
    
    const order = orderResult.rows[0]
    
    // Invalidar cache de pedidos após criar um novo pedido
    invalidateOrdersCache()
    
    // Inserir itens do pedido
    for (const item of itemsPayload) {
      await query(`
        INSERT INTO order_items (
          order_id, product_id, name, quantity, unit_price, total_price,
          size, toppings, special_instructions, half_and_half
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        order.id,
        item.product_id,
        item.name,
        item.quantity,
        item.unit_price,
        item.total_price,
        item.size,
        item.toppings ? JSON.stringify(item.toppings) : null,
        item.special_instructions,
        item.half_and_half ? JSON.stringify(item.half_and_half) : null
      ])
    }

    frontendLogger.info(`Pedido criado com sucesso: ${order.id}`)
    const response = createSecureResponse({
      id: order.id,
      message: "Pedido criado com sucesso",
      order: { ...order, items }
    }, 200, request)
    addRateLimitHeaders(response, request, 'orders')
    return response
  } catch (error: any) {
    frontendLogger.logError('Erro ao criar pedido', { error }, error as Error, 'api')
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
  }
}

// Handler OPTIONS para CORS
export const OPTIONS = createOptionsHandler()
