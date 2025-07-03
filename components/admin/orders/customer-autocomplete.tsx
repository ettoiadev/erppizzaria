"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Phone, MapPin, Package, Edit3, UserPlus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  primaryAddress?: {
    id: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    label: string
    is_default: boolean
  } | null
  totalOrders: number
  createdAt: string
}

interface CustomerAutocompleteProps {
  onCustomerSelect: (customer: Customer | null) => void
  orderType: 'balcao' | 'telefone'
  disabled?: boolean
}

export function CustomerAutocomplete({ onCustomerSelect, orderType, disabled = false }: CustomerAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const resultsRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar clientes com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.trim().length < 2) {
      setCustomers([])
      setShowResults(false)
      return
    }

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
      setIsSearching(true)
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(term)}&limit=10`)
      
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
        setShowResults(true)
      } else {
        console.error('Erro na busca de clientes')
        setCustomers([])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setCustomers([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearchTerm(customer.name)
    setShowResults(false)
    setIsEditing(false)
    onCustomerSelect(customer)
  }

  const handleNewCustomer = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para criar um novo cliente",
        variant: "destructive",
      })
      return
    }

    setSelectedCustomer(null)
    setShowResults(false)
    setIsEditing(true)
    onCustomerSelect(null)
  }

  const handleEditCustomer = () => {
    setIsEditing(true)
    onCustomerSelect(null)
  }

  const handleClearSelection = () => {
    setSelectedCustomer(null)
    setSearchTerm("")
    setIsEditing(false)
    setShowResults(false)
    onCustomerSelect(null)
  }

  const formatAddress = (address: Customer['primaryAddress']) => {
    if (!address) return "Endereço não cadastrado"
    return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}`
  }

  return (
    <div className="space-y-4">
      <div className="relative" ref={resultsRef}>
        <Label htmlFor="customer-search">
          Buscar Cliente *
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="customer-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite nome ou telefone do cliente..."
            disabled={disabled || (selectedCustomer && !isEditing)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Resultados da busca */}
        {showResults && customers.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border-2">
            <CardContent className="p-0">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
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
                        {orderType === 'telefone' && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {formatAddress(customer.primaryAddress)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Opção de criar novo cliente */}
        {showResults && searchTerm.length >= 2 && (
          <Card className="absolute z-40 w-full mt-1 shadow-lg border-2 border-dashed border-blue-300">
            <CardContent className="p-3">
              <Button
                variant="ghost"
                onClick={handleNewCustomer}
                className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Criar novo cliente: "{searchTerm}"
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cliente selecionado */}
      {selectedCustomer && !isEditing && (
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
                  onClick={handleClearSelection}
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
              
              {orderType === 'telefone' && (
                <div>
                  <span className="font-medium">Endereço:</span>
                  <div className="text-gray-600 mt-1">
                    {formatAddress(selectedCustomer.primaryAddress)}
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
    </div>
  )
} 