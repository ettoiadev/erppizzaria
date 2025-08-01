import { NextRequest, NextResponse } from 'next/server';
import { getPaymentInfo, mapPaymentStatus, validateWebhookSignature } from '@/lib/mercadopago';
import { updatePaymentStatus, updateOrderStatus, getOrderById } from '@/lib/orders';
import { notifyPaymentApproved, notifyOrderStatusChange } from '@/lib/socket-server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK MERCADO PAGO - INÍCIO ===');
    
    const body = await request.text();
    const signature = request.headers.get('x-signature') || '';
    
    console.log('Webhook body:', body);
    console.log('Signature:', signature.substring(0, 20) + '...');

    // Validar assinatura do webhook (em produção)
    if (process.env.NODE_ENV === 'production') {
      const isValidSignature = validateWebhookSignature(body, signature);
      if (!isValidSignature) {
        console.error('❌ Assinatura do webhook inválida');
        return NextResponse.json({
          success: false,
          error: 'Assinatura inválida'
        }, { status: 401 });
      }
    }

    const webhookData = JSON.parse(body);
    console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

    // Processar diferentes tipos de notificação
    const { type, data } = webhookData;

    if (type === 'payment') {
      await handlePaymentNotification(data.id);
    } else if (type === 'merchant_order') {
      await handleMerchantOrderNotification(data.id);
    } else {
      console.log('Tipo de notificação não tratado:', type);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso'
    });

  } catch (error: any) {
    console.error('=== ERRO NO WEBHOOK MERCADO PAGO ===');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}

// Processar notificação de pagamento
async function handlePaymentNotification(paymentId: string) {
  try {
    console.log('🔔 Processando notificação de pagamento:', paymentId);

    // Buscar informações do pagamento no Mercado Pago
    const paymentInfo = await getPaymentInfo(paymentId);
    
    if (!paymentInfo.success || !paymentInfo.payment) {
      console.error('Erro ao buscar informações do pagamento:', paymentInfo.error);
      return;
    }

    const payment = paymentInfo.payment;
    const orderId = payment.externalReference;

    if (!orderId) {
      console.error('External reference (orderId) não encontrado no pagamento');
      return;
    }

    console.log('Informações do pagamento:', {
      paymentId: payment.id,
      orderId,
      status: payment.status,
      statusDetail: payment.statusDetail,
      amount: payment.transactionAmount
    });

    // Mapear status do Mercado Pago para status interno
    const internalPaymentStatus = mapPaymentStatus(payment.status);
    
    // Atualizar status do pagamento no banco
    const updatedOrder = await updatePaymentStatus(orderId, internalPaymentStatus);
    
    if (!updatedOrder) {
      console.error('Pedido não encontrado para atualizar status de pagamento:', orderId);
      return;
    }

    console.log('Status de pagamento atualizado:', {
      orderId,
      paymentStatus: internalPaymentStatus
    });

    // Se pagamento foi aprovado, atualizar status do pedido
    if (internalPaymentStatus === 'APPROVED') {
      console.log('💰 Pagamento aprovado! Atualizando status do pedido...');
      
      // Atualizar status do pedido para RECEIVED
      await updateOrderStatus(orderId, 'RECEIVED');
      
      // Buscar pedido completo para notificações
      const completeOrder = await getOrderById(orderId);
      
      // Notificar via Socket.io
      notifyPaymentApproved(orderId, {
        paymentId: payment.id,
        amount: payment.transactionAmount,
        paymentMethod: payment.paymentMethodId,
        order: completeOrder
      });

      // Notificar mudança de status
      notifyOrderStatusChange(orderId, 'RECEIVED', completeOrder);
      
      console.log('✅ Pedido aprovado e notificações enviadas');
      
    } else if (internalPaymentStatus === 'REJECTED') {
      console.log('❌ Pagamento rejeitado');
      
      // Atualizar status do pedido para CANCELLED
      await updateOrderStatus(orderId, 'CANCELLED');
      
      // Notificar cancelamento
      notifyOrderStatusChange(orderId, 'CANCELLED', {
        reason: 'Pagamento rejeitado',
        paymentDetails: payment.statusDetail
      });
      
    } else {
      console.log('⏳ Pagamento pendente, aguardando confirmação');
    }

  } catch (error: any) {
    console.error('Erro ao processar notificação de pagamento:', error);
    throw error;
  }
}

// Processar notificação de merchant order
async function handleMerchantOrderNotification(merchantOrderId: string) {
  try {
    console.log('🔔 Processando notificação de merchant order:', merchantOrderId);
    
    // Aqui você pode implementar lógica adicional para merchant orders
    // Por exemplo, verificar se todos os pagamentos de um pedido foram processados
    
    console.log('Merchant order processado:', merchantOrderId);
    
  } catch (error: any) {
    console.error('Erro ao processar merchant order:', error);
    throw error;
  }
}

// Também aceitar GET para verificação do webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Webhook do Mercado Pago está funcionando',
    timestamp: new Date().toISOString()
  });
}