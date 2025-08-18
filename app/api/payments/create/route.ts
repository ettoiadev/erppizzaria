import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { mercadoPagoGateway } from '@/lib/mercadopago'
import { ordersRateLimiter } from '@/lib/rate-limiter'
import { frontendLogger } from '@/lib/frontend-logger'

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = ordersRateLimiter(request)
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult
    }

    const body = await request.json()
    const { 
      order_id, 
      amount, 
      customer_email, 
      customer_name, 
      customer_phone, 
      payment_method,
      description 
    } = body

    // Validar dados obrigatórios
    if (!order_id || !amount || !customer_email || !customer_name || !payment_method) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      )
    }

    frontendLogger.info('Processando pagamento', {
      order_id,
      amount,
      payment_method,
      customer_email: customer_email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

    const supabase = getSupabaseServerClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, payment_status, total')
      .eq('id', order_id)
      .maybeSingle()
    if (error) throw error
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o pedido já foi pago
    if (order.payment_status === 'PAID') {
      return NextResponse.json(
        { error: "Pedido já foi pago" },
        { status: 400 }
      )
    }

    // Verificar se o valor corresponde
    if (Math.abs(order.total - amount) > 0.01) {
      return NextResponse.json(
        { error: "Valor do pagamento não corresponde ao valor do pedido" },
        { status: 400 }
      )
    }

    // Processar pagamento baseado no método
    let paymentResult

    if (payment_method === 'pix') {
      // Criar PIX
      paymentResult = await mercadoPagoGateway.createPixPayment({
        order_id,
        amount,
        customer_email,
        customer_name,
        customer_phone: customer_phone || '',
        description: description || `Pedido #${order_id}`,
        payment_method: 'pix'
      })
    } else {
      // Criar pagamento normal
      paymentResult = await mercadoPagoGateway.createPayment({
        order_id,
        amount,
        customer_email,
        customer_name,
        customer_phone: customer_phone || '',
        description: description || `Pedido #${order_id}`,
        payment_method: payment_method as 'pix' | 'credit_card' | 'debit_card'
      })
    }

    if (!paymentResult.success) {
      frontendLogger.error('Falha ao criar pagamento', { error: paymentResult.error })
      return NextResponse.json(
        { error: paymentResult.error || "Erro ao processar pagamento" },
        { status: 500 }
      )
    }

    // Atualizar pedido com informações do pagamento
    await supabase
      .from('orders')
      .update({ payment_status: 'PENDING', updated_at: new Date().toISOString() })
      .eq('id', order_id)

    frontendLogger.info('Pagamento criado com sucesso', { payment_id: paymentResult.payment_id })

    return NextResponse.json({
      success: true,
      payment_id: paymentResult.payment_id,
      init_point: paymentResult.init_point,
      qr_code: paymentResult.qr_code,
      message: "Pagamento criado com sucesso"
    })

  } catch (error: any) {
    frontendLogger.error('Erro ao processar pagamento', { error: error.message, stack: error.stack })
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// GET para verificar status de um pagamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('order_id')

    if (!paymentId && !orderId) {
      return NextResponse.json(
        { error: "payment_id ou order_id é obrigatório" },
        { status: 400 }
      )
    }

    if (paymentId) {
      // Buscar status do pagamento no Mercado Pago
      const payment = await mercadoPagoGateway.getPaymentStatus(paymentId)
      
      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          external_reference: payment.external_reference,
          transaction_amount: payment.transaction_amount,
          date_created: payment.date_created,
          date_approved: payment.date_approved
        }
      })
    } else {
      const supabase = getSupabaseServerClient()
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, payment_status, total, created_at')
        .eq('id', orderId)
        .maybeSingle()
      if (error) throw error
      if (!order) {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          status: order.status,
          payment_status: order.payment_status,
          total: order.total,
          created_at: order.created_at
        }
      })
    }

  } catch (error: any) {
    frontendLogger.error('Erro ao verificar pagamento', { error: error.message, stack: error.stack })
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}