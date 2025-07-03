"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard, Banknote, QrCode } from 'lucide-react'

interface CheckoutFormSimplifiedProps {
  onSubmit: (data: any) => void
  isLoading: boolean
}

export function CheckoutFormSimplified({ onSubmit, isLoading }: CheckoutFormSimplifiedProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "PIX",
    notes: "",
  })

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || "",
      }))
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações básicas
    if (!formData.name || !formData.phone || !formData.address) {
      alert("Por favor, preencha todos os campos obrigatórios")
      return
    }
    
    onSubmit(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Rua, número, complemento, bairro, cidade"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) => handleInputChange("paymentMethod", value)}
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="PIX" id="pix" />
              <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                <QrCode className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold">PIX</div>
                  <div className="text-sm text-gray-600">Pagamento após confirmação</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="CREDIT_CARD" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold">Cartão na Entrega</div>
                  <div className="text-sm text-gray-600">Débito ou crédito</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
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
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        disabled={isLoading}
      >
        {isLoading ? "Processando..." : "Confirmar Pedido"}
      </Button>
    </form>
  )
} 