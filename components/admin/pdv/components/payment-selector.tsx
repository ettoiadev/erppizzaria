import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { CreditCard, Smartphone, Banknote, Wallet, Loader2 } from "lucide-react"
import { PaymentMethod } from '../types'

interface PaymentSelectorProps {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  orderNotes: string
  onOrderNotesChange: (notes: string) => void
  onSubmitOrder: () => void
  isSubmitting: boolean
  total: number
  formatCurrency: (value: number) => string
  cartItemsCount: number
  paymentSectionRef: React.RefObject<HTMLDivElement>
}

export function PaymentSelector({
  paymentMethod,
  onPaymentMethodChange,
  orderNotes,
  onOrderNotesChange,
  onSubmitOrder,
  isSubmitting,
  total,
  formatCurrency,
  cartItemsCount,
  paymentSectionRef
}: PaymentSelectorProps) {
  useEffect(() => {
    if (paymentSectionRef.current) {
      paymentSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [paymentMethod, paymentSectionRef])

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'PIX':
        return <Smartphone className="h-4 w-4" />
      case 'Dinheiro':
        return <Banknote className="h-4 w-4" />
      case 'Cartão de Crédito':
        return <CreditCard className="h-4 w-4" />
      case 'Cartão de Débito':
        return <Wallet className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div ref={paymentSectionRef} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
              className="grid grid-cols-2 gap-4"
            >
              {(['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'] as PaymentMethod[]).map((method) => (
                <div key={method} className="flex items-center space-x-2">
                  <RadioGroupItem value={method} id={method} />
                  <Label htmlFor={method} className="flex items-center gap-2 cursor-pointer">
                    {getPaymentIcon(method)}
                    {method}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-notes">Observações do Pedido</Label>
            <Textarea
              id="order-notes"
              placeholder="Observações especiais..."
              value={orderNotes}
              onChange={(e) => onOrderNotesChange(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={onSubmitOrder}
            disabled={isSubmitting || cartItemsCount === 0}
            className="w-full h-14 text-lg font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Finalizar Pedido - ${formatCurrency(total)}`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}