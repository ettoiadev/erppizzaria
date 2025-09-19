import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem, Customer, OrderType, PaymentMethod } from '@/components/admin/pdv/types'

interface UseOrderSubmissionProps {
  customerName: string
  customerPhone: string
  selectedCustomer: Customer | null
  orderType: OrderType
  cartItems: CartItem[]
  paymentMethod: PaymentMethod
  notes: string
  calculateTotal: () => { subtotal: number; total: number }
  clearCart: () => void
  onSuccess: () => void
}

export function useOrderSubmission({
  customerName,
  customerPhone,
  selectedCustomer,
  orderType,
  cartItems,
  paymentMethod,
  notes,
  calculateTotal,
  clearCart,
  onSuccess
}: UseOrderSubmissionProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const mapPaymentMethodToBackend = (method: PaymentMethod): string => {
    const mapping: Record<PaymentMethod, string> = {
      'PIX': 'pix',
      'Dinheiro': 'dinheiro',
      'Cartão de Crédito': 'cartao_credito',
      'Cartão de Débito': 'cartao_debito'
    }
    return mapping[method] || 'pix'
  }

  const validateOrder = (): boolean => {
    if (!customerName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório",
        variant: "destructive",
      })
      return false
    }

    if (!customerPhone.trim()) {
      toast({
        title: "Erro", 
        description: "Telefone do cliente é obrigatório",
        variant: "destructive",
      })
      return false
    }

    // Validar endereço para pedidos de telefone
    if (orderType === 'telefone' && !selectedCustomer?.primaryAddress) {
      toast({
        title: "Erro",
        description: "Endereço é obrigatório para entrega",
        variant: "destructive",
      })
      return false
    }

    if (cartItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const prepareDeliveryAddress = (): string => {
    if (orderType === 'balcao') {
      return "Manual (Balcão)"
    } else {
      if (selectedCustomer?.primaryAddress) {
        const addr = selectedCustomer.primaryAddress
        return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''} - ${addr.neighborhood}, ${addr.city}/${addr.state} - CEP: ${addr.zip_code}`
      } else {
        return "Manual (Telefone)"
      }
    }
  }

  const submitOrder = async (): Promise<void> => {
    if (!validateOrder()) {
      return
    }

    setLoading(true)

    try {
      const { subtotal, total } = calculateTotal()
      
      const finalCustomerId = selectedCustomer?.id

      if (!selectedCustomer) {
        throw new Error("Nenhum cliente selecionado")
      }

      if (!finalCustomerId) {
        throw new Error("ID do cliente não encontrado")
      }

      const deliveryAddress = prepareDeliveryAddress()
      
      const orderData = {
        customerId: finalCustomerId,
        items: cartItems.map(item => ({
          id: item?.id || '',
          product_id: item?.id || '',
          name: item?.name || '',
          quantity: item?.quantity || 1,
          price: item?.price || 0,
          unit_price: item?.price || 0,
          size: item?.size || '',
          toppings: item?.toppings || [],
          notes: item?.notes || '',
          isHalfAndHalf: item?.isHalfAndHalf || false,
          halfAndHalf: item?.halfAndHalf || null
        })),
        total,
        subtotal,
        delivery_fee: 0,
        name: customerName,
        phone: customerPhone,
        orderType: orderType,
        deliveryAddress: deliveryAddress,
        paymentMethod: mapPaymentMethodToBackend(paymentMethod),
        notes: notes.trim() || undefined
      }

      console.log('Enviando pedido manual:', orderData)

      const response = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar pedido')
      }

      toast({
        title: "Sucesso!",
        description: `Pedido #${result.order.id} criado com sucesso!`,
      })

      // Limpar formulário
      clearCart()
      onSuccess()

    } catch (error) {
      console.error('Erro ao enviar pedido:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar pedido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    submitOrder
  }
}