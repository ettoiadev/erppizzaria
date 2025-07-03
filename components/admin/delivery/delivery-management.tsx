"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DeliveryPersonModal } from "./delivery-person-modal"
import { AssignOrderModal } from "./assign-order-modal"
import { Search, Plus, Edit, Eye, Phone, Mail, MapPin, Clock, Package, Bike, RefreshCw, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  vehicle_type: 'motorcycle' | 'bicycle' | 'car'
  vehicle_plate: string
  status: 'available' | 'busy' | 'offline'
  current_location: string
  total_deliveries: number
  average_rating: number
  average_delivery_time: number
  created_at: string
  updated_at: string
  last_active_at: string
  currentOrders: string[]
}

interface DriversData {
  drivers: Driver[]
  statistics: {
    total: number
    available: number
    busy: number
    offline: number
    averageDeliveryTime: number
  }
  _source?: string
  _notice?: string
}

export function DeliveryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<Driver | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<Driver | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Função para converter Driver para DeliveryPerson (compatibilidade com modal)
  const convertDriverToDeliveryPerson = (driver: Driver) => {
    return {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicleType: driver.vehicle_type,
      vehiclePlate: driver.vehicle_plate,
      status: driver.status,
      currentLocation: driver.current_location,
      totalDeliveries: driver.total_deliveries,
      averageRating: driver.average_rating,
      averageDeliveryTime: driver.average_delivery_time,
      createdAt: driver.created_at,
      lastActiveAt: driver.last_active_at,
      currentOrders: driver.currentOrders
    }
  }

  // Buscar entregadores da API
  const {
    data: driversData,
    isLoading,
    error,
    refetch
  } = useQuery<DriversData>({
    queryKey: ["drivers", statusFilter],
    queryFn: async () => {
      console.log("Buscando entregadores da API...")
      
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/drivers?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Entregadores carregados:", data)
      
      return data
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })

  // Mutation para criar entregador
  const createDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar entregador')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast({
        title: "Sucesso",
        description: "Entregador criado com sucesso",
      })
      setShowAddModal(false)
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar entregador",
        variant: "destructive",
      })
    },
  })

  // Mutation para atualizar entregador
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar entregador')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast({
        title: "Sucesso",
        description: "Entregador atualizado com sucesso",
      })
      setSelectedDeliveryPerson(null)
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar entregador",
        variant: "destructive",
      })
    },
  })

  // Mutation para deletar entregador
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      console.log(`[DELETE_DRIVER] Iniciando exclusão do entregador ID: ${driverId}`)
      
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      })

      console.log(`[DELETE_DRIVER] Resposta da API:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const error = await response.json()
        console.error(`[DELETE_DRIVER] Erro na API:`, error)
        throw new Error(error.error || 'Erro ao excluir entregador')
      }

      const result = await response.json()
      console.log(`[DELETE_DRIVER] Sucesso na API:`, result)
      return result
    },
    // Optimistic update - atualizar estado imediatamente
    onMutate: async (driverId) => {
      console.log(`[DELETE_DRIVER] Aplicando atualização otimista para ID: ${driverId}`)
      
      // Cancelar queries em andamento para evitar conflitos
      await queryClient.cancelQueries({ queryKey: ["drivers"] })
      
      // Snapshot do estado atual
      const previousDrivers = queryClient.getQueryData<DriversData>(["drivers", statusFilter])
      
      // Atualizar cache otimisticamente - remover entregador da lista
      if (previousDrivers) {
        const updatedDrivers = {
          ...previousDrivers,
          drivers: previousDrivers.drivers.filter(driver => driver.id !== driverId),
          statistics: {
            ...previousDrivers.statistics,
            total: previousDrivers.statistics.total - 1,
            available: previousDrivers.drivers.find(d => d.id === driverId)?.status === 'available' 
              ? previousDrivers.statistics.available - 1 
              : previousDrivers.statistics.available,
            busy: previousDrivers.drivers.find(d => d.id === driverId)?.status === 'busy' 
              ? previousDrivers.statistics.busy - 1 
              : previousDrivers.statistics.busy,
            offline: previousDrivers.drivers.find(d => d.id === driverId)?.status === 'offline' 
              ? previousDrivers.statistics.offline - 1 
              : previousDrivers.statistics.offline,
          }
        }
        
        queryClient.setQueryData(["drivers", statusFilter], updatedDrivers)
        console.log(`[DELETE_DRIVER] Estado local atualizado otimisticamente`)
      }
      
      return { previousDrivers }
    },
    onSuccess: (data, driverId) => {
      console.log(`[DELETE_DRIVER] Exclusão confirmada pelo servidor:`, data)
      
      // Invalidar todas as queries relacionadas a drivers
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] })
      
      // Forçar refetch para garantir sincronização
      refetch()
      
      // Mensagem diferenciada baseada no tipo de exclusão
      const isDeactivation = data.message?.includes('desativado') || data.details?.action === 'soft_delete'
      const isSoftDelete = data.details?.action === 'soft_delete'
      const isPhysicalDelete = data.details?.action === 'physical_delete'
      
      toast({
        title: "Sucesso",
        description: isSoftDelete 
          ? "Entregador desativado com sucesso. Dados históricos preservados."
          : isPhysicalDelete 
          ? "Entregador removido permanentemente do sistema."
          : data.message || "Entregador processado com sucesso",
      })
      setShowDeleteModal(null)
      
      console.log(`[DELETE_DRIVER] Processo de exclusão concluído com sucesso`)
    },
    onError: (error: any, driverId, context) => {
      console.error(`[DELETE_DRIVER] Erro durante exclusão:`, error)
      
      // Reverter estado otimista em caso de erro
      if (context?.previousDrivers) {
        console.log(`[DELETE_DRIVER] Revertendo estado otimista devido ao erro`)
        queryClient.setQueryData(["drivers", statusFilter], context.previousDrivers)
      }
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir entregador",
        variant: "destructive",
      })
      setShowDeleteModal(null)
    },
    onSettled: () => {
      // Sempre invalidar queries no final para garantir consistência
      console.log(`[DELETE_DRIVER] Finalizando - invalidando todas as queries de drivers`)
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
    },
  })

  const drivers = driversData?.drivers || []
  const statistics = driversData?.statistics || {
    total: 0,
    available: 0,
    busy: 0,
    offline: 0,
    averageDeliveryTime: 0
  }

  // FALLBACK DEFENSIVO: Verificar se há entregadores
  if (!isLoading && (!drivers || drivers.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Entregadores</h1>
            <p className="text-gray-600">Gerencie sua equipe de entrega</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Entregador
          </Button>
        </div>

        {/* Componente de Nenhum Entregador */}
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bike className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum entregador cadastrado</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {error 
                ? "Erro ao conectar com o banco de dados. Verifique se o PostgreSQL está configurado corretamente."
                : "Você ainda não possui entregadores cadastrados. Adicione o primeiro entregador para começar."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setShowAddModal(true)} disabled={!!error}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Entregador
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Dados
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600">
                  ⚠️ Problema de conectividade: {error.message}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Verifique se o PostgreSQL está rodando e a tabela drivers foi criada.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para adicionar entregador */}
        {showAddModal && (
          <DeliveryPersonModal
            deliveryPerson={null}
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={(data) => createDriverMutation.mutate(data)}
          />
        )}
      </div>
    )
  }

  // Filter delivery persons
  const filteredDeliveryPersons = drivers
    .filter((person) => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone.includes(searchTerm)

      return matchesSearch
    })
    .sort((a, b) => {
      // Sort by status priority: available > busy > offline
      const statusPriority = { available: 3, busy: 2, offline: 1 }
      return statusPriority[b.status] - statusPriority[a.status]
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível"
      case "busy":
        return "Ocupado"
      case "offline":
        return "Offline"
      default:
        return "Desconhecido"
    }
  }

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "motorcycle":
        return <Bike className="w-4 h-4" />
      case "bicycle":
        return "🚲"
      case "car":
        return "🚗"
      default:
        return <Bike className="w-4 h-4" />
    }
  }

  const getVehicleLabel = (vehicleType: string) => {
    switch (vehicleType) {
      case "motorcycle":
        return "Moto"
      case "bicycle":
        return "Bicicleta"
      case "car":
        return "Carro"
      default:
        return "Veículo"
    }
  }

  // Função para formatar data no padrão brasileiro
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleDeleteDriver = () => {
    if (showDeleteModal) {
      deleteDriverMutation.mutate(showDeleteModal.id)
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erro ao carregar entregadores: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Entregadores</h1>
          <p className="text-gray-600">Gerencie sua equipe de entrega</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Entregador
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Entregadores</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Bike className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">{statistics.available}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Entrega</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.busy}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.averageDeliveryTime}min</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="available">Disponíveis ({statistics.available})</SelectItem>
                <SelectItem value="busy">Ocupados ({statistics.busy})</SelectItem>
                <SelectItem value="offline">Offline ({statistics.offline})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Carregando entregadores...</p>
        </div>
      )}

      {/* Delivery Persons List */}
      {!isLoading && (
        <div className="grid gap-4">
          {filteredDeliveryPersons.map((person) => (
            <Card key={person.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                      <Badge className={getStatusColor(person.status)}>{getStatusLabel(person.status)}</Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        {getVehicleIcon(person.vehicle_type)}
                        <span>{getVehicleLabel(person.vehicle_type)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{person.vehicle_plate}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{person.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{person.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{person.current_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Cadastrado em: {formatDate(person.created_at)}</span>
                      </div>
                    </div>

                    {person.currentOrders.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                        <div className="text-sm text-yellow-800">
                          <strong>Pedidos em andamento:</strong> {person.currentOrders.length} pedido(s)
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-600">Entregas</div>
                        <div className="text-lg font-bold text-primary">{person.total_deliveries}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Avaliação</div>
                        <div className="text-lg font-bold text-primary">⭐ {Number(person.average_rating || 0).toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Tempo Médio</div>
                        <div className="text-lg font-bold text-primary">{person.average_delivery_time}min</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDeliveryPerson(person)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Detalhes
                      </Button>
                      {person.status === "available" && (
                        <Button size="sm" onClick={() => setShowAssignModal(person.id)}>
                          <Package className="w-4 h-4 mr-1" />
                          Atribuir Pedido
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setSelectedDeliveryPerson(person)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowDeleteModal(person)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredDeliveryPersons.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhum entregador encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <Dialog open={!!showDeleteModal} onOpenChange={() => setShowDeleteModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o entregador <strong>{showDeleteModal.name}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita. O entregador será removido permanentemente do sistema.
                {showDeleteModal.currentOrders.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Atenção:</strong> Este entregador possui {showDeleteModal.currentOrders.length} pedido(s) em andamento.
                      A exclusão pode não ser permitida.
                    </p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteDriver}
                disabled={deleteDriverMutation.isPending}
              >
                {deleteDriverMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Excluir Entregador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modals */}
      {(selectedDeliveryPerson || showAddModal) && (
        <DeliveryPersonModal
          deliveryPerson={selectedDeliveryPerson ? convertDriverToDeliveryPerson(selectedDeliveryPerson) : null}
          isOpen={!!selectedDeliveryPerson || showAddModal}
          onClose={() => {
            setSelectedDeliveryPerson(null)
            setShowAddModal(false)
          }}
          onSave={(data) => {
            if (selectedDeliveryPerson) {
              updateDriverMutation.mutate({ id: selectedDeliveryPerson.id, data })
            } else {
              createDriverMutation.mutate(data)
            }
          }}
        />
      )}

      {showAssignModal && (
        <AssignOrderModal
          deliveryPersonId={showAssignModal}
          isOpen={!!showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onAssign={() => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] })
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            setShowAssignModal(null)
          }}
        />
      )}
    </div>
  )
}
