import { NextRequest, NextResponse } from 'next/server';
import { createPaymentPreference, createPixPayment, PaymentData } from '@/lib/mercadopago';
import { getOrderById } from '@/lib/orders';

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/payments/create - INÍCIO ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { orderId, paymentMethod = 'preference' } = body;

    // Validações
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'ID do pedido é obrigatório'
      }, { status: 400 });
    }

    // Buscar dados do pedido
    const order = await getOrderById(orderId);
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Pedido não encontrado'
      }, { status: 404 });
    }

    // Preparar dados para o Mercado Pago
    const paymentData: PaymentData = {
      orderId: order.id,
      customerName: order.customer_name,
      customerEmail: body.customerEmail || 'cliente@pizzaria.com', // Email padrão se não fornecido
      customerPhone: order.customer_phone,
      totalAmount: order.total,
      description: `Pedido #${order.id} - Pizzaria`,
      items: order.items?.map(item => ({
        id: item.product_id,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price || item.price
      })) || [{
        id: order.id,
        title: `Pedido #${order.id}`,
        quantity: 1,
        unit_price: order.total
      }]
    };

    console.log('Dados do pagamento preparados:', {
      orderId: paymentData.orderId,
      totalAmount: paymentData.totalAmount,
      itemsCount: paymentData.items.length,
      paymentMethod
    });

    let result;

    // Criar pagamento baseado no método escolhido
    if (paymentMethod === 'pix') {
      result = await createPixPayment(paymentData);
    } else {
      result = await createPaymentPreference(paymentData);
    }

    if (!result.success) {
      console.error('Erro ao criar pagamento:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Erro ao processar pagamento'
      }, { status: 500 });
    }

    console.log('Pagamento criado com sucesso:', {
      preferenceId: result.preferenceId,
      initPoint: result.initPoint?.substring(0, 50) + '...'
    });

    return NextResponse.json({
      success: true,
      message: 'Pagamento criado com sucesso',
      payment: {
        preferenceId: result.preferenceId,
        initPoint: result.initPoint,
        sandboxInitPoint: result.sandboxInitPoint,
        orderId: order.id,
        totalAmount: order.total,
        paymentMethod
      }
    });

  } catch (error: any) {
    console.error('=== ERRO COMPLETO NO POST /api/payments/create ===');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message || 'Não foi possível criar o pagamento'
    }, { status: 500 });
  }
}