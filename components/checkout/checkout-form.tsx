"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddressInput } from "@/components/ui/address-input"
import { SmartDeliverySection } from "@/components/checkout/smart-delivery-section"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard, Banknote, QrCode, Upload } from 'lucide-react'

interface CheckoutFormProps {
  onSubmit: (data: any) => void
  isLoading: boolean
  userId?: string
}

export function CheckoutForm({ onSubmit, isLoading, userId }: CheckoutFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    addressData: {
      zipCode: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      number: "",
      complement: "",
    },
    paymentMethod: "PIX", // Usar valor correto do enum
    notes: "",
  })
  const [loadingUserData, setLoadingUserData] = useState(false)

  // Carregar dados do usuário automaticamente
  useEffect(() => {
    async function loadUserData() {
      if (!user?.id) return

      setLoadingUserData(true)
      try {
        console.log("Carregando dados do usuário para checkout:", user.id)
        
        // Carregar dados do perfil do usuário
        const response = await fetch(`/api/users/${user.id}`)
        
        if (response.ok) {
          const userData = await response.json()
          console.log("Dados do usuário carregados:", userData)
          
          setFormData(prev => ({
            ...prev,
            name: userData.user?.name || userData.user?.full_name || user.name || "",
            phone: userData.user?.phone || user.phone || "",
          }))
        } else {
          console.log("Usando dados básicos do contexto de auth")
          // Usar dados básicos do contexto se a API falhar
          setFormData(prev => ({
            ...prev,
            name: user.name || "",
          }))
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
        // Usar dados básicos do contexto em caso de erro
        setFormData(prev => ({
          ...prev,
          name: user.name || "",
        }))
      } finally {
        setLoadingUserData(false)
      }
    }

    loadUserData()
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Preparar dados completos do pedido
    const orderData = {
      // Dados do usuário
      customerId: userId,
      user_id: userId,
      
      // Dados de entrega
      address: formData.address,
      delivery_address: formData.address,
      
      // Dados de pagamento
      paymentMethod: formData.paymentMethod,
      payment_method: formData.paymentMethod,
      
      // Observações
      notes: formData.notes,
      delivery_instructions: formData.notes,
      
      // Dados do endereço estruturados
      addressData: formData.addressData,
      
      // Nome do cliente
      name: formData.name,
      
      // Telefone do cliente (buscar de múltiplas fontes)
      phone: formData.phone || user?.phone || "",
      delivery_phone: formData.phone || user?.phone || ""
    }
    
    console.log("Submitting order data:", orderData)
    onSubmit(orderData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }



  const handleAddressSelect = (addressData: any) => {
    setFormData((prev) => ({
      ...prev,
      name: addressData.name || prev.name,
      phone: addressData.phone || prev.phone, // Preservar telefone existente
      address: addressData.address,
      addressData: addressData.addressData,
    }))
  }

  const handleAddressChange = (address: any) => {
    setFormData((prev) => ({
      ...prev,
      addressData: address,
      address: `${address.street}, ${address.number}${
        address.complement ? `, ${address.complement}` : ""
      } - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zipCode}`,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Smart Delivery Section */}
      {userId ? (
        <SmartDeliverySection
          userId={userId}
          onAddressSelect={handleAddressSelect}
          selectedAddress={formData.addressData}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dados de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h3>
              <AddressInput value={formData.addressData} onChange={handleAddressChange} required />
            </div>
          </CardContent>
        </Card>
      )}



      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) => handleInputChange("paymentMethod", value)}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="PIX" id="pix" />
              <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                <QrCode className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold">PIX</div>
                  <div className="text-sm text-gray-600">Pagamento após confirmação</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="CREDIT_CARD" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold">Cartão na Entrega</div>
                  <div className="text-sm text-gray-600">Débito ou crédito</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="CASH" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                <Banknote className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-semibold">Dinheiro na Entrega</div>
                  <div className="text-sm text-gray-600">Pagamento em espécie</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {formData.paymentMethod === "PIX" && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Chave PIX:</p>
                    <p className="text-lg font-mono font-bold text-blue-800">12996367326</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText("12996367326")
                      // Opcional: mostrar feedback visual
                    }}
                    className="ml-2"
                  >
                    Copiar
                  </Button>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-1">📱 Após o pagamento:</p>
                  <p className="text-sm text-blue-700">
                    Envie o comprovante para o WhatsApp{" "}
                    <span className="font-semibold">(12) 99636-7326</span>
                  </p>
                </div>
                
                <p className="text-xs text-blue-600 italic">
                  ⏳ Seu pedido será confirmado após a verificação do comprovante
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Alguma observação sobre seu pedido?"
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Processando..." : "Confirmar Pedido"}
      </Button>
    </form>
  )
}
