import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Search, Loader2, UserPlus, Edit3 } from "lucide-react"
import { Customer, OrderType } from '../types'

interface CustomerSearchProps {
  orderType: OrderType
  selectedCustomer: Customer | null
  searchTerm: string
  onSearchTermChange: (term: string) => void
  searchResults: Customer[]
  isSearching: boolean
  customerCode: string
  onCustomerCodeChange: (code: string) => void
  onCustomerSelect: (customer: Customer) => void
  onNewCustomer: () => void
  onEditCustomer: () => void
  onClearCustomer: () => void
}

export function CustomerSearch({
  orderType,
  selectedCustomer,
  searchTerm,
  onSearchTermChange,
  searchResults,
  isSearching,
  customerCode,
  onCustomerCodeChange,
  onCustomerSelect,
  onNewCustomer,
  onEditCustomer,
  onClearCustomer
}: CustomerSearchProps) {
  if (orderType === 'balcao') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedCustomer ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-search">Buscar por nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-search"
                    placeholder="Digite o nome do cliente..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer-code">Código do cliente</Label>
                <Input
                  id="customer-code"
                  placeholder="Digite o código..."
                  value={customerCode}
                  onChange={(e) => onCustomerCodeChange(e.target.value)}
                />
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Resultados da busca:</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => onCustomerSelect(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {customer.totalOrders} pedidos
                          </Badge>
                          {customer.customer_code && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Código: {customer.customer_code}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum cliente encontrado</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onNewCustomer}
                  className="mt-2"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar novo cliente
                </Button>
              </div>
            )}

            <Separator />
            
            <Button 
              variant="outline" 
              onClick={onNewCustomer}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                {selectedCustomer.customer_code && (
                  <p className="text-xs text-muted-foreground">
                    Código: {selectedCustomer.customer_code}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onEditCustomer}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onClearCustomer}>
                  Trocar
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}