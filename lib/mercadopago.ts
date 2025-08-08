import mercadopago from 'mercadopago'

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
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
  error?: string
}

export class MercadoPagoGateway {
  /**
   * Criar pagamento no Mercado Pago
   */
  async createPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      console.log('💰 Criando pagamento Mercado Pago:', {
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        method: paymentData.payment_method
      })

      const payment = {
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

      const response = await mercadopago.payment.save(payment)
      
      if (response.body.status === 'rejected') {
        return {
          success: false,
          error: response.body.status_detail || 'Pagamento rejeitado'
        }
      }

      console.log('✅ Pagamento criado:', response.body.id)

      return {
        success: true,
        payment_id: response.body.id.toString(),
        init_point: response.body.init_point,
        qr_code: response.body.point_of_interaction?.transaction_data?.qr_code
      }

    } catch (error: any) {
      console.error('❌ Erro ao criar pagamento:', error)
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
      const response = await mercadopago.payment.get(paymentId)
      return response.body
    } catch (error: any) {
      console.error('❌ Erro ao buscar pagamento:', error)
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
        console.log(`✅ Pagamento ${paymentId} aprovado`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error)
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

      const response = await mercadopago.payment.save(payment)
      
      if (response.body.status === 'rejected') {
        return {
          success: false,
          error: response.body.status_detail || 'Pagamento PIX rejeitado'
        }
      }

      const qrCode = response.body.point_of_interaction?.transaction_data?.qr_code
      const qrCodeBase64 = response.body.point_of_interaction?.transaction_data?.qr_code_base64

      return {
        success: true,
        payment_id: response.body.id.toString(),
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64
      }

    } catch (error: any) {
      console.error('❌ Erro ao criar PIX:', error)
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
      const response = await mercadopago.refund.create({
        payment_id: paymentId,
        ...refundData
      })

      console.log('✅ Reembolso processado:', response.body.id)
      return true
    } catch (error: any) {
      console.error('❌ Erro ao reembolsar:', error)
      return false
    }
  }
}

// Instância singleton
export const mercadoPagoGateway = new MercadoPagoGateway()