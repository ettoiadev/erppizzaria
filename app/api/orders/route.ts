import { NextRequest, NextResponse } from 'next/server'
import { getOrders, createOrder } from '@/lib/db-supabase'
import { withValidation } from '@/lib/validation-middleware'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { orderSchema } from '@/lib/validation-schemas'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Handler GET para listar pedidos (sem middlewares)
async function getOrdersHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const orders = await getOrders({ status, userId, limit, offset })
    return NextResponse.json(orders)
  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler POST para criar pedido (sem middlewares)
async function createOrderHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
  
    // Mapear campos alternativos vindos do frontend (dados já validados)
    const user_id = validatedData.user_id ?? validatedData.customerId ?? validatedData.userId
    const customer_name = validatedData.customer_name ?? validatedData.name ?? validatedData.customer_name_full
    const customer_phone = validatedData.customer_phone ?? validatedData.delivery_phone ?? validatedData.phone
    const customer_address = validatedData.customer_address ?? validatedData.delivery_address ?? validatedData.address
    const payment_method = validatedData.payment_method ?? validatedData.paymentMethod
    const total = validatedData.total
    const subtotal = validatedData.subtotal ?? 0
    const delivery_fee = validatedData.delivery_fee ?? 0
    const discount = validatedData.discount ?? 0
    const status = validatedData.status ?? 'RECEIVED'
    const payment_status = validatedData.payment_status ?? 'PENDING'
    const delivery_type = validatedData.delivery_type ?? 'delivery'
    const notes = validatedData.notes ?? validatedData.delivery_instructions ?? null
    const estimated_delivery_time = validatedData.estimated_delivery_time ?? null
    const items = Array.isArray(validatedData.items) ? validatedData.items : []
  
    // Processar itens do pedido (dados já validados)
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
  
    const order = await createOrder({
      user_id,
      customer_name,
      customer_phone,
      customer_address,
      total,
      subtotal,
      delivery_fee,
      discount,
      status,
      payment_method,
      payment_status,
      notes,
      estimated_delivery_time,
      items: itemsPayload,
    })

    return NextResponse.json({
      id: order.id,
      message: "Pedido criado com sucesso",
      order: { ...order, items }
    })
  } catch (error) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET (apenas logging e monitoramento)
const enhancedGetHandler = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getOrdersHandler,
      {
        logErrors: true,
        sanitizeErrors: process.env.NODE_ENV === 'production'
      }
    ),
    {
      logRequests: true,
      logResponses: false, // Não logar resposta para GET (pode ser muito grande)
      logErrors: true
    }
  )
)

// Aplicar todos os middlewares para POST
const enhancedPostHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('critical', {}, // Rate limiting específico para pedidos
      withPresetSanitization('userForm', {}, // Sanitização para formulários de usuário
        withValidation(orderSchema, // Validação usando Zod
          withDatabaseErrorHandling( // Tratamento de erros de banco
            createOrderHandler,
            {
              logErrors: true,
              sanitizeErrors: process.env.NODE_ENV === 'production',
              customErrorMessages: {
                unique_violation: 'Pedido duplicado',
                foreign_key_violation: 'Dados de referência inválidos'
              }
            }
          )
        )
      )
    ),
    {
      logRequests: true,
      logResponses: true,
      logErrors: true
    }
  )
)

// Exportar as funções com middlewares
export const GET = enhancedGetHandler
export const POST = enhancedPostHandler
