"use client"

import { forwardRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Smartphone, Banknote, Wallet } from "lucide-react"
import type { PaymentMethod } from '../pdv/types'

interface PaymentSectionProps {
  paymentMethod: PaymentMethod | null
  onPaymentMethodChange: (method: PaymentMethod) => void
}

export const PaymentSection = forwardRef<HTMLDivElement, PaymentSectionProps>(
  ({ paymentMethod, onPaymentMethodChange }, ref) => {
    return (
      <Card ref={ref}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Forma de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* PIX */}
            <Button
              type="button"
              variant={paymentMethod === "PIX" ? "default" : "outline"}
              onClick={() => onPaymentMethodChange("PIX")}
              className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                paymentMethod === "PIX"
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-lg scale-105"
                  : "border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
              }`}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-sm font-semibold">PIX</span>
            </Button>

            {/* Dinheiro */}
            <Button
              type="button"
              variant={paymentMethod === "Dinheiro" ? "default" : "outline"}
              onClick={() => onPaymentMethodChange("Dinheiro")}
              className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                paymentMethod === "Dinheiro"
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 shadow-lg scale-105"
                  : "border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300"
              }`}
            >
              <Banknote className="h-6 w-6" />
              <span className="text-sm font-semibold">Dinheiro</span>
            </Button>

            {/* Cartão de Crédito */}
            <Button
              type="button"
              variant={paymentMethod === "Cartão de Crédito" ? "default" : "outline"}
              onClick={() => onPaymentMethodChange("Cartão de Crédito")}
              className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                paymentMethod === "Cartão de Crédito"
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg scale-105"
                  : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              }`}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm font-semibold">Cartão Crédito</span>
            </Button>

            {/* Cartão de Débito */}
            <Button
              type="button"
              variant={paymentMethod === "Cartão de Débito" ? "default" : "outline"}
              onClick={() => onPaymentMethodChange("Cartão de Débito")}
              className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                paymentMethod === "Cartão de Débito"
                  ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-lg scale-105"
                  : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
              }`}
            >
              <Wallet className="h-6 w-6" />
              <span className="text-sm font-semibold">Cartão Débito</span>
            </Button>
          </div>
          
          {/* Indicador visual da seleção atual */}
          {paymentMethod && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  {paymentMethod === "PIX" && <Smartphone className="h-4 w-4 text-green-600" />}
                  {paymentMethod === "Dinheiro" && <Banknote className="h-4 w-4 text-yellow-600" />}
                  {paymentMethod === "Cartão de Crédito" && <CreditCard className="h-4 w-4 text-blue-600" />}
                  {paymentMethod === "Cartão de Débito" && <Wallet className="h-4 w-4 text-purple-600" />}
                  <span className="font-medium">Forma de pagamento selecionada:</span>
                </div>
                <span className="font-semibold text-gray-900">{paymentMethod}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

PaymentSection.displayName = "PaymentSection"