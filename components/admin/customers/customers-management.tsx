"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomerDetailsModal } from "./customer-details-modal"
import { CustomerOrderHistory } from "./customer-order-history"
import { Search, Eye, Phone, Mail, MapPin, Calendar, ShoppingBag, RefreshCw } from "lucide-react"
import type { Customer } from "@/types/admin"

export function CustomersManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showOrderHistory, setShowOrderHistory] = useState<string | null>(null)

  // Buscar clientes reais do banco de dados PostgreSQL
  const { data: customersData, isLoading, error, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      console.log("Buscando clientes da API...")
      
      const response = await fetch('/api/customers')
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Clientes carregados:", data.customers?.length || 0)
      
      return data
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  const customers = customersData?.customers || []

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(
      (customer: Customer) =>
        (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone || '').includes(searchTerm) ||
        (customer.address || '').toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a: Customer, b: Customer) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "orders":
          return b.totalOrders - a.totalOrders
        case "spent":
          return b.totalSpent - a.totalSpent
        case "recent":
        default:
          return new Date(b.lastOrderAt || b.createdAt).getTime() - new Date(a.lastOrderAt || a.createdAt).getTime()
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vip":
        return "bg-yellow-100 text-yellow-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "vip":
        return "VIP"
      case "active":
        return "Ativo"
      case "inactive":
        return "Inativo"
      default:
        return "Desconhecido"
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erro ao carregar clientes: {error.message}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Clientes</h1>
          <p className="text-gray-600">Visualize e gerencie informações dos clientes cadastrados</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-bold">{customers.filter((c: Customer) => c.status === "active").length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes VIP</p>
                <p className="text-2xl font-bold">{customers.filter((c: Customer) => c.status === "vip").length}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold">
                  R$ {customers.reduce((sum: number, c: Customer) => sum + Number(c.totalSpent || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
                <SelectItem value="orders">Mais Pedidos</SelectItem>
                <SelectItem value="spent">Maior Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cliente cadastrado</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ainda não há clientes cadastrados no sistema. Os clientes aparecerão aqui quando se registrarem na aplicação.
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar Dados
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer: Customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                      <Badge className={getStatusColor(customer.status)}>{getStatusLabel(customer.status)}</Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{customer.email || 'Email não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{customer.phone || 'Telefone não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs lg:text-sm break-words">{customer.address || 'Endereço não cadastrado'}</span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Cliente desde {new Date(customer.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="text-center lg:text-right">
                      <div className="text-sm text-gray-600">Pedidos</div>
                      <div className="text-xl font-bold text-primary">{customer.totalOrders}</div>
                    </div>
                    <div className="text-center lg:text-right">
                      <div className="text-sm text-gray-600">Total Gasto</div>
                      <div className="text-xl font-bold text-primary">R$ {Number(customer.totalSpent || 0).toFixed(2)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowOrderHistory(customer.id)}>
                        <ShoppingBag className="w-4 h-4 mr-1" />
                        Pedidos
                      </Button>
                    </div>
                  </div>
                </div>

                {customer.favoriteItems && customer.favoriteItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-2">Itens Favoritos:</div>
                    <div className="flex flex-wrap gap-2">
                      {customer.favoriteItems.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredCustomers.length === 0 && customers.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhum cliente encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Order History Modal */}
      {showOrderHistory && (
        <CustomerOrderHistory
          customerId={showOrderHistory}
          isOpen={!!showOrderHistory}
          onClose={() => setShowOrderHistory(null)}
        />
      )}
    </div>
  )
} 