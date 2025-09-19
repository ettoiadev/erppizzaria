"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, User, Phone, MapPin, Package, Edit3, UserPlus, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Importar interfaces do arquivo types
import type { 
  Customer, 
  CustomerAddress, 
  ViaCEPResponse,
  OrderType
} from '../pdv/types'

interface CustomerSectionProps {
  orderType: OrderType
  selectedCustomer: Customer | null
  onCustomerChange: (customer: Customer | null) => void
  customerName: string
  onCustomerNameChange: (name: string) => void
  customerPhone: string
  onCustomerPhoneChange: (phone: string) => void
  customerEmail: string
  onCustomerEmailChange: (email: string) => void
  customerAddress: CustomerAddress
  onCustomerAddressChange: (address: CustomerAddress) => void
  isEditingCustomer: boolean
  onEditingCustomerChange: (editing: boolean) => void
}

export function CustomerSection({
  orderType,
  selectedCustomer,
  onCustomerChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  customerEmail,
  onCustomerEmailChange,
  customerAddress,
  onCustomerAddressChange,
  isEditingCustomer,
  onEditingCustomerChange
}: CustomerSectionProps) {
  // Estados de autocomplete
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Estados para busca de CEP
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [cepError, setCepError] = useState("")
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  // Buscar clientes com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    searchTimeoutRef.current = setTimeout(() => {
      searchCustomers(searchTerm.trim())
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const searchCustomers = async (term: string) => {
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(term)}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar clientes')
      }
      const data = await response.json()
      setSearchResults(data.customers || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerChange(customer)
    onCustomerNameChange(customer.name)
    onCustomerPhoneChange(customer.phone)
    onCustomerEmailChange(customer.email || "")
    setSearchTerm("") // Limpar termo de busca
    setShowResults(false)
    onEditingCustomerChange(false)
    
    // Se for pedido de telefone e cliente tem endereço, usar o endereço
    if (orderType === 'telefone' && customer.primaryAddress) {
      onCustomerAddressChange({
        street: customer.primaryAddress.street,
        number: customer.primaryAddress.number,
        complement: customer.primaryAddress.complement || "",
        neighborhood: customer.primaryAddress.neighborhood,
        city: customer.primaryAddress.city,
        state: customer.primaryAddress.state,
        zip_code: customer.primaryAddress.zip_code
      })
    }
  }

  const handleNewCustomer = () => {
    // Pré-preencher nome se houver termo de busca
    if (searchTerm.trim()) {
      onCustomerNameChange(searchTerm.trim())
    }
    
    onCustomerChange(null)
    onEditingCustomerChange(true)
    setShowResults(false)
    setSearchTerm("") // Limpar termo de busca
    
    // Limpar outros campos
    onCustomerPhoneChange("")
    onCustomerEmailChange("")
    
    // Limpar endereço
    onCustomerAddressChange({
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: ""
    })
  }

  const handleEditCustomer = () => {
    onEditingCustomerChange(true)
    setSearchTerm(customerName)
  }

  const handleClearCustomer = () => {
    onCustomerChange(null)
    onCustomerNameChange("")
    onCustomerPhoneChange("")
    onCustomerEmailChange("")
    setSearchTerm("")
    onEditingCustomerChange(false)
    setShowResults(false)
    
    // Limpar endereço
    onCustomerAddressChange({
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: ""
    })
  }

  // Função para buscar CEP
  const searchZipCode = async (zipCode: string) => {
    setIsLoadingCEP(true)
    setCepError("")
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`)
      const data: ViaCEPResponse = await response.json()
      
      if (data.erro) {
        setCepError("CEP não encontrado")
        return
      }
      
      onCustomerAddressChange({
        ...customerAddress,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
        zip_code: zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')
      })
      
      toast({
        title: "CEP encontrado",
        description: "Endereço preenchido automaticamente",
      })
    } catch (error) {
      setCepError("Erro ao buscar CEP")
    } finally {
      setIsLoadingCEP(false)
    }
  }

  const handleZipCodeChange = (value: string) => {
    // Formatar CEP automaticamente
    const numbersOnly = value.replace(/\D/g, "")
    const formatted = numbersOnly.replace(/(\d{5})(\d{3})/, '$1-$2')
    onCustomerAddressChange({ ...customerAddress, zip_code: formatted })
    setCepError("")
  }

  const handleZipCodeBlur = () => {
    const numbersOnly = customerAddress.zip_code.replace(/\D/g, "")
    if (numbersOnly.length === 8) {
      searchZipCode(numbersOnly)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Autocomplete de Clientes */}
        <div className="relative">
          <Label htmlFor="customer-search">Buscar Cliente *</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="customer-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={selectedCustomer && !isEditingCustomer 
                ? `${selectedCustomer.name} - ${selectedCustomer.phone}` 
                : "Digite nome ou telefone do cliente..."
              }
              disabled={!!selectedCustomer && !isEditingCustomer}
              className="pl-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Resultados da busca */}
          {showResults && searchTerm.length >= 2 && (
            <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border-2">
              <CardContent className="p-0">
                {/* Opção de criar novo cliente sempre no topo */}
                <div
                  onMouseDown={(e) => {
                    e.preventDefault() // Evita que o input perca foco antes do clique
                    handleNewCustomer()
                  }}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-dashed border-blue-300 bg-blue-50/30 transition-colors"
                >
                  <div className="flex items-center gap-2 text-blue-600">
                    <UserPlus className="h-4 w-4" />
                    <span className="font-medium">➕ Adicionar novo cliente</span>
                    {searchTerm.trim() && (
                      <span className="text-sm text-blue-500">"{searchTerm.trim()}"</span>
                    )}
                  </div>
                </div>

                {/* Lista de clientes encontrados */}
                {searchResults.length > 0 && (
                  <>
                    {searchResults.map((customer) => (
                      <div
                        key={customer.id}
                        onMouseDown={(e) => {
                          e.preventDefault() // Evita que o input perca foco antes do clique
                          handleCustomerSelect(customer)
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{customer.name}</span>
                              {customer.totalOrders > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <Package className="h-3 w-3 mr-1" />
                                  {customer.totalOrders} pedidos
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </span>
                              {orderType === 'telefone' && customer.primaryAddress && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {customer.primaryAddress.street}, {customer.primaryAddress.neighborhood}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Mensagem quando não há resultados */}
                {searchResults.length === 0 && (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    Nenhum cliente encontrado com "{searchTerm}"
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cliente selecionado */}
        {selectedCustomer && !isEditingCustomer && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Cliente Selecionado</span>
                  {selectedCustomer.totalOrders > 0 && (
                    <Badge variant="secondary">
                      <Package className="h-3 w-3 mr-1" />
                      {selectedCustomer.totalOrders} pedidos
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditCustomer}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCustomer}
                    className="text-red-600 hover:text-red-700"
                  >
                    Trocar Cliente
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Nome:</span> {selectedCustomer.name}
                  </div>
                  <div>
                    <span className="font-medium">Telefone:</span> {selectedCustomer.phone}
                  </div>
                </div>
                
                {orderType === 'telefone' && selectedCustomer.primaryAddress && (
                  <div>
                    <span className="font-medium">Endereço:</span>
                    <div className="text-gray-600 mt-1">
                      {selectedCustomer.primaryAddress.street}, {selectedCustomer.primaryAddress.number}
                      {selectedCustomer.primaryAddress.complement && ` - ${selectedCustomer.primaryAddress.complement}`}
                      {' '}- {selectedCustomer.primaryAddress.neighborhood}, {selectedCustomer.primaryAddress.city}/{selectedCustomer.primaryAddress.state}
                      {' '}CEP: {selectedCustomer.primaryAddress.zip_code}
                    </div>
                  </div>
                )}
                
                {selectedCustomer.email && (
                  <div>
                    <span className="font-medium">E-mail:</span> {selectedCustomer.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário de edição/criação de cliente */}
        {(isEditingCustomer || (!selectedCustomer && searchTerm.length >= 2)) && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nome Completo *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Telefone *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => onCustomerPhoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="customerEmail">E-mail (opcional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => onCustomerEmailChange(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Endereço para pedidos de telefone */}
            {orderType === 'telefone' && (
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço de Entrega *
                </Label>
                
                {/* Campo CEP com busca automática */}
                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="flex items-center gap-2">
                    CEP *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="zip_code"
                      value={customerAddress.zip_code}
                      onChange={(e) => handleZipCodeChange(e.target.value)}
                      onBlur={handleZipCodeBlur}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                      className="flex-1"
                      disabled={isLoadingCEP}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const numbersOnly = customerAddress.zip_code.replace(/\D/g, "")
                        if (numbersOnly.length === 8) {
                          searchZipCode(numbersOnly)
                        }
                      }}
                      disabled={isLoadingCEP || customerAddress.zip_code.replace(/\D/g, "").length !== 8}
                    >
                      {isLoadingCEP ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Digite o CEP e pressione Tab ou clique no botão para buscar automaticamente</p>
                </div>

                {/* Mensagem de erro do CEP */}
                {cepError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{cepError}</AlertDescription>
                  </Alert>
                )}

                {/* Campos de endereço */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Rua/Logradouro *</Label>
                    <Input
                      id="street"
                      value={customerAddress.street}
                      onChange={(e) => onCustomerAddressChange({ ...customerAddress, street: e.target.value })}
                      placeholder="Nome da rua"
                      required
                      readOnly={isLoadingCEP}
                      className={isLoadingCEP ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={customerAddress.number}
                      onChange={(e) => onCustomerAddressChange({ ...customerAddress, number: e.target.value })}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={customerAddress.neighborhood}
                      onChange={(e) => onCustomerAddressChange({ ...customerAddress, neighborhood: e.target.value })}
                      placeholder="Nome do bairro"
                      required
                      readOnly={isLoadingCEP}
                      className={isLoadingCEP ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={customerAddress.complement}
                      onChange={(e) => onCustomerAddressChange({ ...customerAddress, complement: e.target.value })}
                      placeholder="Apto, bloco, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={customerAddress.city}
                      onChange={(e) => onCustomerAddressChange({ ...customerAddress, city: e.target.value })}
                      placeholder="Nome da cidade"
                      required
                      readOnly={isLoadingCEP}
                      className={isLoadingCEP ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={customerAddress.state}
                      onChange={(e) => onCustomerAddressChange({ ...customerAddress, state: e.target.value.toUpperCase() })}
                      placeholder="UF"
                      maxLength={2}
                      required
                      readOnly={isLoadingCEP}
                      className={isLoadingCEP ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>

                {/* Pré-visualização do endereço completo */}
                {customerAddress.street && customerAddress.neighborhood && customerAddress.city && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">Endereço Completo:</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {customerAddress.street}
                      {customerAddress.number && `, ${customerAddress.number}`}
                      {customerAddress.complement && `, ${customerAddress.complement}`}
                      <br />
                      {customerAddress.neighborhood} - {customerAddress.city}/{customerAddress.state}
                      <br />
                      CEP: {customerAddress.zip_code}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}