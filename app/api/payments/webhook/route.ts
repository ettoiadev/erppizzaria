import { NextRequest, NextResponse } from 'next/server'
import { webhookRateLimiter } from '@/lib/rate-limiter'
import { getSupabaseServerClient } from '@/lib/supabase'
import { emitRealtimeEvent, EVENT_PAYMENT_APPROVED } from '@/lib/realtime'
import crypto from 'crypto'

// Verificar assinatura do webhook do Mercado Pago
function verifyWebhookSignature(body: any, signature: string | null): boolean {
  if (!signature) return false
  
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET não configurado')
    return true // Em desenvolvimento, aceitar sem verificação
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Processar diferentes tipos de eventos
async function processPaymentEvent(data: any) {
  const { id, status, external_reference, transaction_amount } = data
  
  console.log(`💰 Processando pagamento ${id} - Status: ${status}`)
  
  // Buscar pedido pelo external_reference
  const supabase = getSupabaseServerClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, payment_status, total')
    .eq('id', external_reference)
    .maybeSingle()
  if (error) throw error
  if (!order) {
    console.error(`❌ Pedido não encontrado: ${external_reference}`)
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
      console.log(`⚠️ Status desconhecido: ${status}`)
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
  
  console.log(`✅ Pedido ${external_reference} atualizado: ${order.status} → ${newOrderStatus}`)
  
  // Realtime: notificar pagamento aprovado
  if (newPaymentStatus === 'PAID') {
    try {
      await emitRealtimeEvent(EVENT_PAYMENT_APPROVED, {
        orderId: external_reference,
        transaction_amount,
        status,
      })
    } catch (e) {
      console.warn('⚠️ Falha ao emitir evento Realtime (payment_approved):', (e as Error)?.message)
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
    
    console.log('🔗 Webhook recebido:', {
      type: body.type,
      data_id: body.data?.id,
      signature: signature ? 'present' : 'missing'
    })
    
    // Verificar assinatura
    if (!verifyWebhookSignature(body, signature)) {
      console.error('❌ Assinatura inválida do webhook')
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
        console.log('🔗 Evento MP Connect:', body.data)
        break
        
      case 'subscription_preauthorization':
        console.log('🔗 Evento de pré-autorização:', body.data)
        break
        
      default:
        console.log(`⚠️ Tipo de evento não processado: ${body.type}`)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error)
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