import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
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
  const orderResult = await query(`
    SELECT id, status, payment_status, total 
    FROM orders 
    WHERE id = $1
  `, [external_reference])
  
  if (orderResult.rows.length === 0) {
    console.error(`❌ Pedido não encontrado: ${external_reference}`)
    return false
  }
  
  const order = orderResult.rows[0]
  
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
  await query(`
    UPDATE orders 
    SET payment_status = $1, status = $2, updated_at = NOW()
    WHERE id = $3
  `, [newPaymentStatus, newOrderStatus, external_reference])
  
  // Registrar no histórico
  await query(`
    INSERT INTO order_status_history (order_id, old_status, new_status, notes, created_at)
    VALUES ($1, $2, $3, $4, NOW())
  `, [external_reference, order.status, newOrderStatus, `Pagamento ${status} via Mercado Pago`])
  
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