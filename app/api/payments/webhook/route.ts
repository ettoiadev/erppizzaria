import { NextRequest, NextResponse } from 'next/server'
import { webhookRateLimiter } from '@/lib/rate-limiter'
import { getSupabaseServerClient } from '@/lib/supabase'
import { emitRealtimeEvent, EVENT_PAYMENT_APPROVED } from '@/lib/realtime'
import crypto from 'crypto'
import { appLogger } from '@/lib/logging'
import { frontendLogger } from '@/lib/frontend-logger'

// Verificar assinatura do webhook do Mercado Pago
function verifyWebhookSignature(body: any, signature: string | null): boolean {
  if (!signature) {
    if (process.env.NODE_ENV === 'production') {
      appLogger.warn('payment', 'Webhook sem assinatura rejeitado em produção')
      return false
    }
    appLogger.warn('payment', 'Webhook sem assinatura aceito apenas em desenvolvimento')
    return true
  }
  
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      appLogger.error('payment', 'MERCADOPAGO_WEBHOOK_SECRET não configurado em produção')
      throw new Error('MERCADOPAGO_WEBHOOK_SECRET é obrigatório em produção')
    }
    appLogger.warn('payment', 'MERCADOPAGO_WEBHOOK_SECRET não configurado - aceitando sem verificação em desenvolvimento')
    return true
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex')
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
    
    if (!isValid) {
      appLogger.warn('payment', 'Assinatura de webhook inválida', {
        receivedSignature: signature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...'
      })
    }
    
    return isValid
  } catch (error) {
    appLogger.error('payment', 'Erro ao verificar assinatura do webhook', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

// Processar diferentes tipos de eventos
async function processPaymentEvent(data: any) {
  const { id, status, external_reference, transaction_amount } = data
  
  frontendLogger.info(`💰 Processando pagamento ${id} - Status: ${status}`)
  
  // Buscar pedido pelo external_reference
  const supabase = getSupabaseServerClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, payment_status, total')
    .eq('id', external_reference)
    .maybeSingle()
  if (error) throw error
  if (!order) {
    frontendLogger.logError(`❌ Pedido não encontrado: ${external_reference}`, {
      external_reference,
      payment_id: id
    }, undefined, 'api')
    return false
  }
  
  // Atualizar status do pagamento
  let newPaymentStatus = 'PENDING'
  let newOrderStatus = order.status
  
  switch (status) {
    case 'approved':
      newPaymentStatus = 'PAID'
      if (order.status === 'RECEIVED') {
        newOrderStatus = 'PREPARING'
      }
      break
      
    case 'rejected':
    case 'cancelled':
      newPaymentStatus = 'FAILED'
      break
      
    case 'pending':
      newPaymentStatus = 'PENDING'
      break
      
    default:
      frontendLogger.warn(`⚠️ Status desconhecido: ${status}`, 'api', {
        payment_id: id,
        status,
        external_reference
      })
      return false
  }
  
  // Atualizar pedido
  await supabase
    .from('orders')
    .update({ payment_status: newPaymentStatus, status: newOrderStatus, updated_at: new Date().toISOString() })
    .eq('id', external_reference)
  
  // Registrar no histórico
  await supabase
    .from('order_status_history')
    .insert({ order_id: external_reference, old_status: order.status, new_status: newOrderStatus, notes: `Pagamento ${status} via Mercado Pago`, created_at: new Date().toISOString() })
  
  frontendLogger.info(`✅ Pedido ${external_reference} atualizado: ${order.status} → ${newOrderStatus}`)
  
  // Realtime: notificar pagamento aprovado
  if (newPaymentStatus === 'PAID') {
    try {
      await emitRealtimeEvent(EVENT_PAYMENT_APPROVED, {
        orderId: external_reference,
        transaction_amount,
        status,
      })
    } catch (e) {
      frontendLogger.warn('⚠️ Falha ao emitir evento Realtime (payment_approved):', 'api', {
        error: (e as Error)?.message,
        orderId: external_reference
      })
    }
  }
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting para evitar abuso do endpoint de webhook
    const rl = webhookRateLimiter(request)
    if (rl && (rl as NextResponse).status === 429) {
      return rl as NextResponse
    }

    const body = await request.json()
    const signature = request.headers.get('x-signature-id') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('x-hub-signature')
    
    frontendLogger.info('🔗 Webhook recebido:', 'api', {
      type: body.type,
      data_id: body.data?.id,
      signature: signature ? 'present' : 'missing'
    })
    
    // Verificar assinatura
    if (!verifyWebhookSignature(body, signature)) {
      frontendLogger.logError('❌ Assinatura inválida do webhook', {
        signature: signature ? 'present' : 'missing',
        type: body.type
      }, undefined, 'api')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Processar diferentes tipos de eventos
    switch (body.type) {
      case 'payment':
        await processPaymentEvent(body.data)
        break
        
      case 'mp-connect':
        frontendLogger.info('🔗 Evento MP Connect:', 'api', body.data)
        break
        
      case 'subscription_preauthorization':
        frontendLogger.info('🔗 Evento de pré-autorização:', 'api', body.data)
        break
        
      default:
        frontendLogger.warn(`⚠️ Tipo de evento não processado: ${body.type}`, 'api', {
          type: body.type,
          data: body.data
        })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    frontendLogger.logError('❌ Erro ao processar webhook:', {
      message: error.message,
      stack: error.stack
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET para teste do webhook
export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint ativo',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}