import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { mercadoPagoGateway } from '@/lib/mercadopago'
import { ordersRateLimiter } from '@/lib/rate-limiter'
import { frontendLogger } from '@/lib/frontend-logger'
import { createSecureResponse, createSecureErrorResponse, sanitizeInput, validateTrustedOrigin, logSuspiciousActivity } from '@/lib/security-utils'

export async function POST(request: NextRequest) {
  try {
    // Validar origem confiável
    if (!validateTrustedOrigin(request)) {
      logSuspiciousActivity(request, 'Payment creation attempt from untrusted origin')
      return createSecureErrorResponse('Origem não autorizada', 403, request, 'warn')
    }

    // Aplicar rate limiting
    const rateLimitResult = ordersRateLimiter(request)
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult
    }

    const rawBody = await request.json()
    const body = sanitizeInput(rawBody)
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
      logSuspiciousActivity(request, 'Payment creation with missing required data', {
        missing_fields: {
          order_id: !order_id,
          amount: !amount,
          customer_email: !customer_email,
          customer_name: !customer_name,
          payment_method: !payment_method
        }
      })
      return createSecureErrorResponse('Dados obrigatórios não fornecidos', 400, request, 'warn')
    }

    frontendLogger.info('Processando pagamento', 'api', {
      order_id,
      amount,
      payment_method,
      customer_email: customer_email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

    const orderResult = await query(
      'SELECT id, status, payment_status, total FROM orders WHERE id = $1',
      [order_id]
    )
    const order = orderResult.rows[0]
    if (!order) {
      logSuspiciousActivity(request, 'Payment attempt for non-existent order', { order_id })
      return createSecureErrorResponse('Pedido não encontrado', 404, request, 'warn')
    }

    // Verificar se o pedido já foi pago
    if (order.payment_status === 'PAID') {
      logSuspiciousActivity(request, 'Payment attempt for already paid order', { order_id })
      return createSecureErrorResponse('Pedido já foi pago', 400, request, 'warn')
    }

    // Verificar se o valor corresponde
    if (Math.abs(order.total - amount) > 0.01) {
      logSuspiciousActivity(request, 'Payment amount mismatch', {
        order_id,
        order_total: order.total,
        payment_amount: amount
      })
      return createSecureErrorResponse('Valor do pagamento não corresponde ao valor do pedido', 400, request, 'warn')
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
      frontendLogger.logError('Falha ao criar pagamento', { error: paymentResult.error }, new Error(paymentResult.error), 'api')
      return createSecureErrorResponse(paymentResult.error || 'Erro ao processar pagamento', 500, request, 'error')
    }

    // Atualizar pedido com informações do pagamento
    await query(
      'UPDATE orders SET payment_status = $1, updated_at = $2 WHERE id = $3',
      ['PENDING', new Date().toISOString(), order_id]
    )

    frontendLogger.info('Pagamento criado com sucesso', 'api', { payment_id: paymentResult.payment_id })

    return createSecureResponse({
      success: true,
      payment_id: paymentResult.payment_id,
      init_point: paymentResult.init_point,
      qr_code: paymentResult.qr_code,
      message: "Pagamento criado com sucesso"
    }, 200, request)

  } catch (error: any) {
    frontendLogger.logError('Erro ao processar pagamento', { error: error.message, stack: error.stack }, error as Error, 'api')
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
  }
}

// GET para verificar status de um pagamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('order_id')

    if (!paymentId && !orderId) {
      return createSecureErrorResponse('payment_id ou order_id é obrigatório', 400, request, 'warn')
    }

    if (paymentId) {
      // Buscar status do pagamento no Mercado Pago
      const payment = await mercadoPagoGateway.getPaymentStatus(paymentId)
      
      return createSecureResponse({
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
      }, 200, request)
    } else {
      const orderResult = await query(
        'SELECT id, status, payment_status, total, created_at FROM orders WHERE id = $1',
        [orderId]
      )
      const order = orderResult.rows[0]
      if (!order) {
        return createSecureErrorResponse('Pedido não encontrado', 404, request, 'warn')
      }

      return createSecureResponse({
        success: true,
        order: {
          id: order.id,
          status: order.status,
          payment_status: order.payment_status,
          total: order.total,
          created_at: order.created_at
        }
      }, 200, request)
    }

  } catch (error: any) {
    frontendLogger.logError('Erro ao verificar pagamento', { error: error.message, stack: error.stack }, error as Error, 'api')
    return createSecureErrorResponse('Erro interno do servidor', 500, request, 'error')
  }
}