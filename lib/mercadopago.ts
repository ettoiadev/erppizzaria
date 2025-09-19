import { MercadoPagoConfig, Payment, Preference, PaymentRefund } from 'mercadopago'
import { appLogger } from './logging'

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
})

export interface PaymentData {
  order_id: string
  amount: number
  customer_email: string
  customer_name: string
  customer_phone: string
  description: string
  payment_method: 'pix' | 'credit_card' | 'debit_card'
}

export interface PaymentResult {
  success: boolean
  payment_id?: string
  init_point?: string
  qr_code?: string
  qr_code_base64?: string
  error?: string
}

export class MercadoPagoGateway {
  private payment: Payment
  private preference: Preference
  private paymentRefund: PaymentRefund

  constructor() {
    this.payment = new Payment(client)
    this.preference = new Preference(client)
    this.paymentRefund = new PaymentRefund(client)
  }

  /**
   * Criar pagamento no Mercado Pago
   */
  async createPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      appLogger.info('payment', 'Criando pagamento Mercado Pago', {
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        method: paymentData.payment_method,
        customer_email: paymentData.customer_email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      const paymentRequest = {
        transaction_amount: paymentData.amount,
        description: paymentData.description,
        payment_method_id: paymentData.payment_method,
        external_reference: paymentData.order_id,
        payer: {
          email: paymentData.customer_email,
          first_name: paymentData.customer_name.split(' ')[0],
          last_name: paymentData.customer_name.split(' ').slice(1).join(' ') || '',
          phone: {
            area_code: '11', // Código de área padrão
            number: paymentData.customer_phone.replace(/\D/g, '')
          }
        },
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/falha`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/pendente`
        }
      }

      const response = await this.payment.create({ body: paymentRequest })
      
      if (response.status === 'rejected') {
        return {
          success: false,
          error: response.status_detail || 'Pagamento rejeitado'
        }
      }

      appLogger.info('payment', 'Pagamento criado com sucesso', {
        payment_id: response.id?.toString(),
        order_id: paymentData.order_id,
        status: response.status
      })

      return {
        success: true,
        payment_id: response.id?.toString() || '',
        qr_code: response.point_of_interaction?.transaction_data?.qr_code
      }

    } catch (error: any) {
      appLogger.error('payment', 'Erro ao criar pagamento', error, {
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        method: paymentData.payment_method
      })
      return {
        success: false,
        error: error.message || 'Erro interno do servidor'
      }
    }
  }

  /**
   * Buscar status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await this.payment.get({ id: paymentId })
      return response
    } catch (error: any) {
      appLogger.error('payment', 'Erro ao buscar pagamento', error, {
        payment_id: paymentId
      })
      throw error
    }
  }

  /**
   * Processar pagamento aprovado
   */
  async processApprovedPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.getPaymentStatus(paymentId)
      
      if (payment.status === 'approved') {
        appLogger.info('payment', 'Pagamento aprovado', {
          payment_id: paymentId,
          status: payment.status
        })
        return true
      }
      
      return false
    } catch (error) {
      appLogger.error('payment', 'Erro ao processar pagamento', error instanceof Error ? error : undefined, {
        payment_id: paymentId
      })
      return false
    }
  }

  /**
   * Gerar QR Code PIX
   */
  async createPixPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      const payment = {
        transaction_amount: paymentData.amount,
        description: paymentData.description,
        payment_method_id: 'pix',
        external_reference: paymentData.order_id,
        payer: {
          email: paymentData.customer_email,
          first_name: paymentData.customer_name.split(' ')[0],
          last_name: paymentData.customer_name.split(' ').slice(1).join(' ') || ''
        },
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`
      }

      const response = await this.payment.create({ body: payment })
      
      if (response.status === 'rejected') {
        return {
          success: false,
          error: response.status_detail || 'Pagamento PIX rejeitado'
        }
      }

      const qrCode = response.point_of_interaction?.transaction_data?.qr_code
      const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64

      return {
        success: true,
        payment_id: response.id?.toString() || '',
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64
      }

    } catch (error: any) {
      appLogger.error('payment', 'Erro ao criar PIX', error, {
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        customer_email: paymentData.customer_email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      return {
        success: false,
        error: error.message || 'Erro ao gerar PIX'
      }
    }
  }

  /**
   * Reembolsar pagamento
   */
  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      const refundData = amount ? { amount } : {}
      const response = await this.paymentRefund.create({
        payment_id: paymentId,
        body: refundData
      })

      appLogger.info('payment', 'Reembolso processado', {
        payment_id: paymentId,
        refund_id: response.id,
        amount
      })
      return true
    } catch (error: any) {
      appLogger.error('payment', 'Erro ao reembolsar', error, {
        payment_id: paymentId,
        amount
      })
      return false
    }
  }
}

// Instância singleton
export const mercadoPagoGateway = new MercadoPagoGateway()