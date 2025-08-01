import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'DEV',
  }
});

const preference = new Preference(client);
const payment = new Payment(client);

export interface PaymentData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
  }>;
  totalAmount: number;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  error?: string;
}

// Criar preferência de pagamento
export async function createPaymentPreference(paymentData: PaymentData): Promise<PaymentResponse> {
  try {
    console.log('🏦 Criando preferência de pagamento no Mercado Pago...', {
      orderId: paymentData.orderId,
      totalAmount: paymentData.totalAmount,
      itemsCount: paymentData.items.length
    });

    const preferenceData = {
      items: paymentData.items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || 'BRL'
      })),
      payer: {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        phone: {
          number: paymentData.customerPhone
        }
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/pending`
      },
      auto_return: 'approved' as const,
      external_reference: paymentData.orderId,
      statement_descriptor: 'PIZZARIA',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`,
      additional_info: paymentData.description || `Pedido #${paymentData.orderId}`
    };

    const result = await preference.create({ body: preferenceData });

    console.log('✅ Preferência criada com sucesso:', {
      id: result.id,
      initPoint: result.init_point
    });

    return {
      success: true,
      preferenceId: result.id!,
      initPoint: result.init_point!,
      sandboxInitPoint: result.sandbox_init_point!
    };

  } catch (error: any) {
    console.error('❌ Erro ao criar preferência de pagamento:', {
      message: error.message,
      cause: error.cause,
      status: error.status
    });

    return {
      success: false,
      error: error.message || 'Erro ao processar pagamento'
    };
  }
}

// Buscar informações de um pagamento
export async function getPaymentInfo(paymentId: string) {
  try {
    console.log('🔍 Buscando informações do pagamento:', paymentId);

    const result = await payment.get({ id: paymentId });

    console.log('✅ Informações do pagamento obtidas:', {
      id: result.id,
      status: result.status,
      statusDetail: result.status_detail,
      externalReference: result.external_reference
    });

    return {
      success: true,
      payment: {
        id: result.id,
        status: result.status,
        statusDetail: result.status_detail,
        externalReference: result.external_reference,
        transactionAmount: result.transaction_amount,
        paymentMethodId: result.payment_method_id,
        paymentTypeId: result.payment_type_id,
        dateCreated: result.date_created,
        dateApproved: result.date_approved,
        payer: result.payer
      }
    };

  } catch (error: any) {
    console.error('❌ Erro ao buscar pagamento:', {
      paymentId,
      message: error.message,
      status: error.status
    });

    return {
      success: false,
      error: error.message || 'Erro ao buscar informações do pagamento'
    };
  }
}

// Mapear status do Mercado Pago para status interno
export function mapPaymentStatus(mpStatus: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' {
  switch (mpStatus) {
    case 'approved':
      return 'APPROVED';
    case 'rejected':
    case 'refunded':
    case 'charged_back':
      return 'REJECTED';
    case 'cancelled':
      return 'CANCELLED';
    case 'pending':
    case 'authorized':
    case 'in_process':
    case 'in_mediation':
    default:
      return 'PENDING';
  }
}

// Validar webhook do Mercado Pago
export function validateWebhookSignature(body: string, signature: string): boolean {
  try {
    const crypto = require('crypto');
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('⚠️ MERCADOPAGO_WEBHOOK_SECRET não configurado');
      return true; // Permitir em desenvolvimento
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

  } catch (error) {
    console.error('❌ Erro ao validar assinatura do webhook:', error);
    return false;
  }
}

// Criar pagamento PIX
export async function createPixPayment(paymentData: PaymentData): Promise<PaymentResponse> {
  try {
    console.log('💰 Criando pagamento PIX no Mercado Pago...', {
      orderId: paymentData.orderId,
      totalAmount: paymentData.totalAmount
    });

    const paymentBody = {
      transaction_amount: paymentData.totalAmount,
      description: paymentData.description || `Pedido #${paymentData.orderId}`,
      payment_method_id: 'pix',
      external_reference: paymentData.orderId,
      payer: {
        email: paymentData.customerEmail,
        first_name: paymentData.customerName.split(' ')[0],
        last_name: paymentData.customerName.split(' ').slice(1).join(' ') || 'Cliente',
        phone: {
          number: paymentData.customerPhone
        }
      },
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`
    };

    const result = await payment.create({ body: paymentBody });

    console.log('✅ Pagamento PIX criado com sucesso:', {
      id: result.id,
      status: result.status,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code
    });

    return {
      success: true,
      preferenceId: result.id!.toString(),
      initPoint: result.point_of_interaction?.transaction_data?.qr_code_base64,
      sandboxInitPoint: result.point_of_interaction?.transaction_data?.qr_code
    };

  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', {
      message: error.message,
      cause: error.cause,
      status: error.status
    });

    return {
      success: false,
      error: error.message || 'Erro ao processar pagamento PIX'
    };
  }
}

export { client as mercadoPagoClient };