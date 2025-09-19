import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Store, Phone } from "lucide-react"
import { OrderType } from '../types'

interface OrderTypeSelectorProps {
  orderType: OrderType
  onOrderTypeChange: (type: OrderType) => void
}

export function OrderTypeSelector({ orderType, onOrderTypeChange }: OrderTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Tipo de Pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={orderType} 
          onValueChange={(value) => onOrderTypeChange(value as OrderType)}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="balcao" id="balcao" />
            <Label htmlFor="balcao" className="flex items-center gap-2 cursor-pointer">
              <Store className="h-4 w-4" />
              Balcão
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="telefone" id="telefone" />
            <Label htmlFor="telefone" className="flex items-center gap-2 cursor-pointer">
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}