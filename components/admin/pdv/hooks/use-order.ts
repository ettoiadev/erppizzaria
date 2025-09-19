import { useState, useRef } from 'react'
import { OrderType, PaymentMethod, CartItem, Customer, CustomerAddress } from '../types'
import { useToast } from '@/hooks/use-toast'

export function useOrder() {
  const [orderType, setOrderType] = useState<OrderType>('balcao')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const paymentSectionRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const mapPaymentMethodToBackend = (method: PaymentMethod) => {
    const mapping = {
      'PIX': 'pix',
      'Dinheiro': 'dinheiro',
      'Cartão de Crédito': 'cartao_credito',
      'Cartão de Débito': 'cartao_debito'
    }
    return mapping[method] || 'pix'
  }

  const handleSubmitOrder = async (
    cartItems: CartItem[],
    selectedCustomer: Customer | null,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    customerAddress: CustomerAddress,
    createNewCustomer: () => Promise<Customer | null>,
    clearCart: () => void,
    clearCustomer: () => void
  ) => {
    if (cartItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive"
      })
      return
    }

    if (orderType === 'telefone') {
      if (!selectedCustomer && (!customerName.trim() || !customerPhone.trim())) {
        toast({
          title: "Erro",
          description: "Para pedidos por telefone, é necessário informar os dados do cliente",
          variant: "destructive"
        })
        return
      }

      if (!customerAddress.street || !customerAddress.number || !customerAddress.neighborhood || !customerAddress.city) {
        toast({
          title: "Erro",
          description: "Para pedidos por telefone, é necessário informar o endereço completo",
          variant: "destructive"
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      let customerId = selectedCustomer?.id
      
      // Se não há cliente selecionado e é pedido por telefone, criar novo cliente
      if (!customerId && orderType === 'telefone') {
        const newCustomer = await createNewCustomer()
        if (!newCustomer) {
          setIsSubmitting(false)
          return
        }
        customerId = newCustomer.id
      }

      // Preparar endereço de entrega
      let deliveryAddress = null
      if (orderType === 'telefone') {
        deliveryAddress = {
          street: customerAddress.street,
          number: customerAddress.number,
          complement: customerAddress.complement || '',
          neighborhood: customerAddress.neighborhood,
          city: customerAddress.city,
          state: customerAddress.state,
          zip_code: customerAddress.zip_code
        }
      }

      // Preparar itens do pedido
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        size: item.size || null,
        toppings: item.toppings || [],
        notes: item.notes || null,
        is_half_and_half: item.isHalfAndHalf || false,
        half_and_half_data: item.halfAndHalf || null
      }))

      const orderData = {
        customer_id: customerId,
        order_type: orderType,
        payment_method: mapPaymentMethodToBackend(paymentMethod),
        items: orderItems,
        notes: orderNotes || null,
        delivery_address: deliveryAddress
      }

      const response = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Sucesso!",
          description: `Pedido #${result.order.order_number} criado com sucesso!`,
          variant: "default"
        })
        
        // Limpar formulário
        clearCart()
        clearCustomer()
        setOrderNotes('')
        setPaymentMethod('PIX')
        setOrderType('balcao')
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao criar pedido",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar pedido",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    orderType,
    setOrderType,
    paymentMethod,
    setPaymentMethod,
    orderNotes,
    setOrderNotes,
    isSubmitting,
    paymentSectionRef,
    formatCurrency,
    handleSubmitOrder
  }
}