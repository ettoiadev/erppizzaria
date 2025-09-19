"use client"

import { useState, useEffect } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddressInput } from "@/components/ui/address-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Plus, Edit, Trash2, Check, ArrowLeft, Loader2, AlertCircle } from "lucide-react"

interface Address {
  id: string
  name: string
  zip_code: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  is_default: boolean
}

export default function ManageAddressesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [view, setView] = useState<"list" | "form" | "edit">("list")
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [newAddress, setNewAddress] = useState({
    zipCode: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    number: "",
    complement: "",
  })
  const [addressName, setAddressName] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  // Carregar endereços do usuário
  useEffect(() => {
    async function loadAddresses() {
      if (!user?.id) return

      setLoading(true)
      setError("")

      try {
        console.log(`Carregando endereços para userId: ${user.id}`)
        const response = await fetch(`/api/addresses?userId=${user.id}`)

        if (!response.ok) {
          throw new Error(`Erro ao carregar endereços: ${response.status}`)
        }

        const data = await response.json()
        console.log("Endereços carregados:", data)

        if (data.addresses && Array.isArray(data.addresses)) {
          setAddresses(data.addresses)
        } else {
          console.log("Nenhum endereço encontrado")
          setAddresses([])
        }
      } catch (err) {
        console.error("Erro ao carregar endereços:", err)
        setError("Não foi possível carregar seus endereços. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadAddresses()
  }, [user?.id])

  // Validar campos obrigatórios do endereço
  const validateAddressForm = () => {
    if (!addressName.trim()) {
      setError("Nome do endereço é obrigatório")
      return false
    }
    if (!newAddress.zipCode.trim()) {
      setError("CEP é obrigatório")
      return false
    }
    if (!newAddress.street.trim()) {
      setError("Rua/Logradouro é obrigatório")
      return false
    }
    if (!newAddress.number.trim()) {
      setError("Número é obrigatório")
      return false
    }
    if (!newAddress.neighborhood.trim()) {
      setError("Bairro é obrigatório")
      return false
    }
    if (!newAddress.city.trim()) {
      setError("Cidade é obrigatória")
      return false
    }
    if (!newAddress.state.trim()) {
      setError("Estado é obrigatório")
      return false
    }
    if (newAddress.state.length !== 2) {
      setError("Estado deve ter 2 caracteres (UF)")
      return false
    }
    const zipCodeNumbers = newAddress.zipCode.replace(/\D/g, "")
    if (zipCodeNumbers.length !== 8) {
      setError("CEP deve ter 8 dígitos")
      return false
    }
    return true
  }

  // Salvar novo endereço ou editar existente
  const saveNewAddress = async () => {
    if (!user?.id) return
    
    if (!validateAddressForm()) return

    setSavingAddress(true)
    setError("")

    try {
      const addressData = {
        customer_id: user.id,
        name: addressName,
        zip_code: newAddress.zipCode,
        street: newAddress.street,
        number: newAddress.number,
        complement: newAddress.complement,
        neighborhood: newAddress.neighborhood,
        city: newAddress.city,
        state: newAddress.state,
        is_default: makeDefault,
      }

      const isEditing = view === "edit" && editingAddress
      const url = isEditing ? `/api/addresses/${editingAddress.id}` : "/api/addresses"
      const method = isEditing ? "PUT" : "POST"

      console.log(`${method} ${url} - Dados:`, addressData)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar endereço")
      }

      const { address } = await response.json()

      if (isEditing) {
        // Atualizar endereço existente na lista
        setAddresses((prev) => 
          prev.map((a) => {
            if (a.id === editingAddress.id) {
              return { ...address, is_default: makeDefault }
            }
            // Se o endereço editado se tornou padrão, remover o padrão dos outros
            return makeDefault ? { ...a, is_default: false } : a
          })
        )
      } else {
        // Adicionar novo endereço à lista
        setAddresses((prev) => {
          // Se o novo endereço for padrão, remover o padrão dos outros
          if (makeDefault) {
            return [{ ...address, is_default: true }, ...prev.map((a) => ({ ...a, is_default: false }))]
          }
          return [...prev, address]
        })
      }

      // Limpar o formulário
      resetForm()
      setView("list")

      toast({
        title: isEditing ? "Endereço atualizado" : "Endereço salvo",
        description: isEditing ? "Endereço atualizado com sucesso!" : "Endereço adicionado com sucesso!",
      })
    } catch (err) {
      console.error("Erro ao salvar endereço:", err)
      const errorMessage = err instanceof Error ? err.message : "Não foi possível salvar o endereço. Tente novamente."
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSavingAddress(false)
    }
  }

  // Excluir endereço
  const deleteAddress = async (addressId: string) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir endereço")
      }

      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))

      toast({
        title: "Endereço excluído",
        description: "Endereço removido com sucesso!",
      })
    } catch (err) {
      console.error("Erro ao excluir endereço:", err)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o endereço.",
        variant: "destructive",
      })
    }
  }

  // Marcar como padrão
  const setAsDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_default: true }),
      })

      if (!response.ok) {
        throw new Error("Erro ao definir endereço padrão")
      }

      // Atualizar estado local
      setAddresses((prev) =>
        prev.map((addr) => ({ ...addr, is_default: addr.id === addressId }))
      )

      toast({
        title: "Endereço padrão",
        description: "Endereço definido como padrão!",
      })
    } catch (err) {
      console.error("Erro ao definir endereço padrão:", err)
      toast({
        title: "Erro",
        description: "Não foi possível definir como endereço padrão.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setNewAddress({
      zipCode: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      number: "",
      complement: "",
    })
    setAddressName("")
    setMakeDefault(false)
    setEditingAddress(null)
  }

  const startEdit = (address: Address) => {
    setEditingAddress(address)
    setAddressName(address.name)
    setNewAddress({
      zipCode: address.zip_code,
      street: address.street,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      number: address.number,
      complement: address.complement || "",
    })
    setMakeDefault(address.is_default)
    setView("edit")
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/conta" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para Conta
              </a>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Endereços</h1>
          <p className="text-gray-600">Visualize, adicione e edite seus endereços de entrega</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de endereços */}
        {view === "list" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Seus Endereços</h2>
              <Button onClick={() => setView("form")}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Endereço
              </Button>
            </div>

            {addresses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
                  <p className="text-gray-600 mb-6">Adicione um endereço para facilitar seus pedidos.</p>
                  <Button onClick={() => setView("form")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Endereço
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <Card key={address.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{address.name}</h3>
                              {address.is_default && (
                                <Badge variant="default" className="text-xs">
                                  Padrão
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600">
                              {address.street}, {address.number}
                              {address.complement && `, ${address.complement}`}
                            </p>
                            <p className="text-gray-600">
                              {address.neighborhood} - {address.city}/{address.state}
                            </p>
                            <p className="text-gray-600">CEP: {address.zip_code}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!address.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAsDefault(address.id)}
                              title="Definir como padrão"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(address)}
                            title="Editar endereço"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteAddress(address.id)}
                            disabled={address.is_default && addresses.length === 1}
                            title="Excluir endereço"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulário para novo endereço ou edição */}
        {(view === "form" || view === "edit") && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {view === "edit" ? "Editar Endereço" : "Novo Endereço"}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { resetForm(); setView("list"); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressName">Nome do Endereço <span className="text-red-500">*</span></Label>
                <Input
                  id="addressName"
                  placeholder="Ex: Casa, Trabalho"
                  value={addressName}
                  onChange={(e) => setAddressName(e.target.value)}
                  required
                />
              </div>

              <AddressInput value={newAddress} onChange={setNewAddress} required />

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="makeDefault"
                  checked={makeDefault}
                  onCheckedChange={(checked) => setMakeDefault(checked === true)}
                />
                <Label htmlFor="makeDefault" className="text-sm font-normal">
                  Definir como endereço padrão
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => { resetForm(); setView("list"); }}>
                  Cancelar
                </Button>
                <Button onClick={saveNewAddress} disabled={savingAddress}>
                  {savingAddress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    view === "edit" ? "Salvar Alterações" : "Salvar Endereço"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
