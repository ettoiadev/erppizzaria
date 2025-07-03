"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddressInput } from "@/components/ui/address-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Plus, Check, ArrowLeft, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface SmartDeliverySectionProps {
  userId: string
  onAddressSelect: (addressData: any) => void
  selectedAddress: any
}

export function SmartDeliverySection({ userId, onAddressSelect, selectedAddress }: SmartDeliverySectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [view, setView] = useState<"default" | "list" | "form">("default")
  const [newAddress, setNewAddress] = useState({
    zipCode: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    number: "",
    complement: "",
  })
  const [addressName, setAddressName] = useState("Meu Endereço")
  const [makeDefault, setMakeDefault] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  // Selecionar um endereço - declarada antes dos useEffects
  const selectAddress = useCallback((address: Address) => {
    console.log("[SmartDeliverySection] Selecionando endereço:", address)
    
    const formattedAddress = `${address.street}, ${address.number}${
      address.complement ? `, ${address.complement}` : ""
    } - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zip_code}`

    const addressData = {
      zipCode: address.zip_code,
      street: address.street,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
    }

    onAddressSelect({
      name: address.name,
      phone: "", // Será preenchido pelo componente pai com dados do usuário
      address: formattedAddress,
      addressData,
    })

    setView("default")
  }, [onAddressSelect])

  // Carregar endereços do usuário
  useEffect(() => {
    async function loadAddresses() {
      if (!userId) return

      setLoading(true)
      setError("")

      try {
        console.log(`[SmartDeliverySection] Carregando endereços para userId: ${userId}`)
        const response = await fetch(`/api/addresses?userId=${userId}`)

        if (!response.ok) {
          throw new Error(`Erro ao carregar endereços: ${response.status}`)
        }

        const data = await response.json()
        console.log("[SmartDeliverySection] Endereços carregados:", data)

        if (data.addresses && Array.isArray(data.addresses)) {
          setAddresses(data.addresses)

          // Se houver um endereço padrão, selecione-o automaticamente
          const defaultAddress = data.addresses.find((addr: Address) => addr.is_default) || data.addresses[0]
          if (defaultAddress && !selectedAddress?.zipCode) {
            console.log("[SmartDeliverySection] Selecionando endereço padrão automaticamente:", defaultAddress)
            selectAddress(defaultAddress)
          }

          // Se não houver endereços, mostrar o formulário
          if (data.addresses.length === 0) {
            setView("form")
          }
        } else {
          console.log("[SmartDeliverySection] Nenhum endereço encontrado ou formato inválido")
          setAddresses([])
          setView("form")
        }
      } catch (err) {
        console.error("[SmartDeliverySection] Erro ao carregar endereços:", err)
        setError("Não foi possível carregar seus endereços. Tente novamente.")
        setView("form")
      } finally {
        setLoading(false)
      }
    }

    loadAddresses()
  }, [userId, selectAddress, selectedAddress?.zipCode])

  // Selecionar automaticamente endereço padrão quando necessário
  useEffect(() => {
    if (!loading && addresses.length > 0 && view === "default" && !selectedAddress?.zipCode) {
      const selectedAddr = addresses.find((a) => a.is_default) || addresses[0]
      if (selectedAddr) {
        console.log("[SmartDeliverySection] Selecionando endereço padrão via useEffect:", selectedAddr)
        selectAddress(selectedAddr)
      }
    }
  }, [addresses, view, selectedAddress?.zipCode, loading, selectAddress])

  // Salvar novo endereço
  const saveNewAddress = async () => {
    if (!userId) return

    setSavingAddress(true)

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: userId,
          name: addressName,
          zip_code: newAddress.zipCode,
          street: newAddress.street,
          number: newAddress.number,
          complement: newAddress.complement,
          neighborhood: newAddress.neighborhood,
          city: newAddress.city,
          state: newAddress.state,
          is_default: makeDefault,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar endereço")
      }

      const { address } = await response.json()

      // Adicionar o novo endereço à lista
      setAddresses((prev) => {
        // Se o novo endereço for padrão, remover o padrão dos outros
        if (makeDefault) {
          return [{ ...address, is_default: true }, ...prev.map((a) => ({ ...a, is_default: false }))]
        }
        return [...prev, address]
      })

      // Selecionar o novo endereço
      selectAddress(address)

      // Limpar o formulário
      setNewAddress({
        zipCode: "",
        street: "",
        neighborhood: "",
        city: "",
        state: "",
        number: "",
        complement: "",
      })
      setAddressName("Meu Endereço")
      setMakeDefault(false)

      // Voltar para a visualização padrão
      setView("default")
    } catch (err) {
      console.error("Erro ao salvar endereço:", err)
      setError("Não foi possível salvar o endereço. Tente novamente.")
    } finally {
      setSavingAddress(false)
    }
  }

  // Renderizar com base no estado atual
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Carregando seus endereços...</p>
        </CardContent>
      </Card>
    )
  }

  if (view === "form") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{addresses.length > 0 ? "Novo Endereço" : "Adicionar Endereço de Entrega"}</CardTitle>
          {addresses.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addressName">Nome do Endereço</Label>
            <Input
              id="addressName"
              placeholder="Ex: Casa, Trabalho"
              value={addressName}
              onChange={(e) => setAddressName(e.target.value)}
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            {addresses.length > 0 && (
              <Button variant="outline" onClick={() => setView("list")}>
                Cancelar
              </Button>
            )}
            <Button onClick={saveNewAddress} disabled={savingAddress}>
              {savingAddress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Endereço"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (view === "list") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Selecione um Endereço</CardTitle>
          {selectedAddress && (
            <Button variant="ghost" size="sm" onClick={() => setView("default")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`flex items-start border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedAddress?.id === address.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => selectAddress(address)}
            >
              <div className="mr-3 mt-1">
                <MapPin className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium">{address.name}</h3>
                  {address.is_default && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Padrão
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {address.street}, {address.number}
                  {address.complement && `, ${address.complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {address.neighborhood} - {address.city}/{address.state}
                </p>
                <p className="text-sm text-gray-600">CEP: {address.zip_code}</p>
              </div>
              {selectedAddress?.id === address.id && <Check className="h-5 w-5 text-primary" />}
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full mt-4 flex items-center justify-center"
            onClick={() => setView("form")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo Endereço
          </Button>
        </CardContent>
      </Card>
    )
  }

  // View === "default"  
  const selectedAddr = addresses.find((a) => a.is_default) || addresses[0]

  if (!selectedAddr) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center py-4 text-gray-500">Você ainda não possui endereços cadastrados.</p>
          <Button className="w-full" onClick={() => setView("form")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Endereço de Entrega
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereço de Entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-1" />
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{selectedAddr.name}</h3>
                {selectedAddr.is_default && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Padrão
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAddr.street}, {selectedAddr.number}
                {selectedAddr.complement && `, ${selectedAddr.complement}`}
              </p>
              <p className="text-sm text-gray-600">
                {selectedAddr.neighborhood} - {selectedAddr.city}/{selectedAddr.state}
              </p>
              <p className="text-sm text-gray-600">CEP: {selectedAddr.zip_code}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1" variant="outline" onClick={() => setView("list")}>
            Trocar Endereço
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => setView("form")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Endereço
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
