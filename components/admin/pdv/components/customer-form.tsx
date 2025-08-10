import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { User, MapPin } from "lucide-react"
import { CustomerAddress, OrderType } from '../types'

interface CustomerFormProps {
  orderType: OrderType
  isEditingCustomer: boolean
  customerName: string
  onCustomerNameChange: (name: string) => void
  customerPhone: string
  onCustomerPhoneChange: (phone: string) => void
  customerEmail: string
  onCustomerEmailChange: (email: string) => void
  customerAddress: CustomerAddress
  onCustomerAddressChange: (address: CustomerAddress) => void
  onZipCodeChange: (value: string) => void
  onZipCodeBlur: () => void
  onSaveCustomer: () => void
  onCancelEdit: () => void
}

export function CustomerForm({
  orderType,
  isEditingCustomer,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  customerEmail,
  onCustomerEmailChange,
  customerAddress,
  onCustomerAddressChange,
  onZipCodeChange,
  onZipCodeBlur,
  onSaveCustomer,
  onCancelEdit
}: CustomerFormProps) {
  if (!isEditingCustomer) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Dados do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Nome *</Label>
            <Input
              id="customer-name"
              placeholder="Nome do cliente"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Telefone *</Label>
            <Input
              id="customer-phone"
              placeholder="(11) 99999-9999"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-email">E-mail</Label>
          <Input
            id="customer-email"
            type="email"
            placeholder="email@exemplo.com"
            value={customerEmail}
            onChange={(e) => onCustomerEmailChange(e.target.value)}
          />
        </div>

        {orderType === 'telefone' && (
          <>
            <div className="flex items-center gap-2 mt-6 mb-4">
              <MapPin className="h-5 w-5" />
              <Label className="text-base font-medium">Endereço de Entrega</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip-code">CEP</Label>
                <Input
                  id="zip-code"
                  placeholder="00000-000"
                  value={customerAddress.zip_code}
                  onChange={(e) => onZipCodeChange(e.target.value)}
                  onBlur={onZipCodeBlur}
                  maxLength={9}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  placeholder="Nome da rua"
                  value={customerAddress.street}
                  onChange={(e) => onCustomerAddressChange({ ...customerAddress, street: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  placeholder="123"
                  value={customerAddress.number}
                  onChange={(e) => onCustomerAddressChange({ ...customerAddress, number: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  placeholder="Apto, bloco, etc."
                  value={customerAddress.complement}
                  onChange={(e) => onCustomerAddressChange({ ...customerAddress, complement: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  placeholder="Nome do bairro"
                  value={customerAddress.neighborhood}
                  onChange={(e) => onCustomerAddressChange({ ...customerAddress, neighborhood: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  placeholder="Nome da cidade"
                  value={customerAddress.city}
                  onChange={(e) => onCustomerAddressChange({ ...customerAddress, city: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                placeholder="SP"
                value={customerAddress.state}
                onChange={(e) => onCustomerAddressChange({ ...customerAddress, state: e.target.value })}
                maxLength={2}
              />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={onSaveCustomer} className="flex-1">
            Salvar
          </Button>
          <Button variant="outline" onClick={onCancelEdit}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}