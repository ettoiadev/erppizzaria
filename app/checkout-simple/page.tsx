"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { CheckoutFormSimplified } from "@/components/checkout/checkout-form-simplified"
import { OrderSummary } from "@/components/checkout/order-summary"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function SimpleCheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    if (items.length === 0) {
      toast({
        title: "Erro",
        description: "Seu carrinho está vazio",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Calcular valores
      const deliveryFee = total >= 50 ? 0 : 5.9
      const finalTotal = total + deliveryFee
      
      // Preparar payload simplificado
      const payload = {
        user_id: user.id,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        total: finalTotal,
        subtotal: total,
        delivery_fee: deliveryFee,
        delivery_address: orderData.address,
        delivery_phone: orderData.phone,
        payment_method: orderData.paymentMethod,
        delivery_instructions: orderData.notes || null,
      }

      console.log("Enviando pedido:", payload)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log("Resposta:", result)

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar pedido")
      }

      // Sucesso
      clearCart()
      
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você será redirecionado...",
      })

      setTimeout(() => {
        router.push(`/pedido/${result.id}`)
      }, 2000)
      
    } catch (error) {
      console.error("Erro:", error)
      toast({
        title: "Erro ao finalizar pedido",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h1>
          <p className="text-gray-600 mb-8">Adicione itens ao carrinho primeiro.</p>
          <button
            onClick={() => router.push("/cardapio")}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Pedido (Simplificado)</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CheckoutFormSimplified 
              onSubmit={handleOrderSubmit} 
              isLoading={isSubmitting} 
            />
          </div>
          
          <div>
            <OrderSummary items={items} total={total} />
          </div>
        </div>
      </main>
    </div>
  )
} 