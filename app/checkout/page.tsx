"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { OrderSummary } from "@/components/checkout/order-summary"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  console.log("CheckoutPage - Current user:", user)
  console.log("CheckoutPage - Cart items:", items)
  console.log("CheckoutPage - Cart total:", total)

  const handleOrderSubmit = async (orderData: any) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer um pedido",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      setIsSubmitting(true)
      console.log("CheckoutPage - Submitting order:", orderData)

      // Calcular taxa de entrega
      const deliveryFee = total >= 50 ? 0 : 5.9
      const finalTotal = total + deliveryFee
      
      // Preparar dados do pedido
      const orderPayload = {
        customerId: user.id,
        user_id: user.id,
        items: items.map((item) => ({
          id: item.id,
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit_price: item.price,
          size: item.size,
          toppings: item.toppings || [],
          // Incluir observações e informações de pizza meio a meio
          notes: item.notes,
          isHalfAndHalf: item.isHalfAndHalf || false,
          halfAndHalf: item.halfAndHalf || null,
        })),
        total: finalTotal, // usar total com taxa de entrega
        subtotal: total,
        delivery_fee: deliveryFee,
        address: orderData.address,
        delivery_address: orderData.address,
        phone: orderData.phone,
        delivery_phone: orderData.phone,
        paymentMethod: orderData.paymentMethod,
        payment_method: orderData.paymentMethod,
        notes: orderData.notes,
        delivery_instructions: orderData.notes,
      }

      console.log("CheckoutPage - Final order payload:", orderPayload)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      })

      let result
      try {
        result = await response.json()
        console.log("CheckoutPage - Order response:", result)
      } catch (jsonError) {
        console.error("Erro ao processar resposta JSON:", jsonError)
        throw new Error("Erro ao processar resposta do servidor")
      }

      if (!response.ok) {
        console.error("Erro na resposta:", response.status, result)
        
        // Mostrar detalhes do erro se disponíveis
        if (result.details) {
          console.error("Detalhes do erro:", result.details)
        }
        
        throw new Error(result.error || "Erro ao criar pedido")
      }

      if (!result.id) {
        console.error("Resposta sem ID do pedido:", result)
        throw new Error("Pedido criado mas sem ID de retorno")
      }

      // Sucesso - limpar carrinho e invalidar cache dos pedidos
      clearCart()
      
      // Invalidar cache dos pedidos para que a lista seja atualizada
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      
      // Invalidar também pedidos específicos do usuário
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["orders", { userId: user.id }] })
      }

      // Extrair apenas os últimos 8 caracteres do ID para exibição
      const shortId = result.id ? result.id.slice(-8) : 'novo'
      
      toast({
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido #${shortId} foi criado. Você será redirecionado para acompanhar o status.`,
      })

      // Redirecionar para página de acompanhamento
      setTimeout(() => {
        router.push(`/pedido/${result.id}`)
      }, 2000)
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error)
      
      // Tratamento específico de erros
      let errorMessage = "Tente novamente em alguns instantes"
      
      if (error instanceof Error) {
        if (error.message.includes("payment_method")) {
          errorMessage = "Método de pagamento inválido. Por favor, selecione outro método."
        } else if (error.message.includes("endereço")) {
          errorMessage = "Por favor, verifique o endereço de entrega."
        } else if (error.message.includes("telefone")) {
          errorMessage = "Por favor, verifique o telefone de contato."
        } else {
          errorMessage = error.message
        }
      }
      
      // Se o erro tem detalhes do backend, mostrar também
      if (error instanceof Error && error.message.includes("details")) {
        console.error("Erro detalhado do backend disponível no console")
      }
      
      toast({
        title: "Erro ao finalizar pedido",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirecionar se não houver itens no carrinho
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h1>
          <p className="text-gray-600 mb-8">Adicione alguns itens ao seu carrinho antes de finalizar o pedido.</p>
          <button
            onClick={() => router.push("/cardapio")}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ver Cardápio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
          <button
            onClick={() => router.push("/cardapio")}
            className="flex items-center justify-center gap-2 px-6 py-3 text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-medium whitespace-nowrap"
          >
            <span className="text-xl">+</span>
            Adicionar mais itens
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CheckoutForm onSubmit={handleOrderSubmit} isLoading={isSubmitting} userId={user?.id} />
          </div>

          <div>
            <OrderSummary items={items} total={total} />
          </div>
        </div>
      </main>
    </div>
  )
}
