"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddressData {
  zipCode: string
  street: string
  neighborhood: string
  city: string
  state: string
  number: string
  complement: string
}

interface AddressInputProps {
  value: AddressData
  onChange: (address: AddressData) => void
  required?: boolean
}

interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function AddressInput({ value, onChange, required = false }: AddressInputProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const formatZipCode = (zipCode: string) => {
    // Remove all non-numeric characters
    const numbers = zipCode.replace(/\D/g, "")
    // Format as XXXXX-XXX
    if (numbers.length <= 5) {
      return numbers
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const handleZipCodeChange = async (zipCode: string) => {
    const formattedZipCode = formatZipCode(zipCode)

    onChange({
      ...value,
      zipCode: formattedZipCode,
    })

    // Only search when we have a complete ZIP code (8 digits)
    const numbersOnly = zipCode.replace(/\D/g, "")
    if (numbersOnly.length === 8) {
      await searchZipCode(numbersOnly)
    } else {
      // Clear address fields if ZIP code is incomplete
      onChange({
        ...value,
        zipCode: formattedZipCode,
        street: "",
        neighborhood: "",
        city: "",
        state: "",
      })
      setError("")
    }
  }

  const searchZipCode = async (zipCode: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`)
      const data: ViaCEPResponse = await response.json()

      if (data.erro) {
        setError("CEP não encontrado. Verifique o código postal informado.")
        return
      }

      onChange({
        ...value,
        zipCode: formatZipCode(zipCode),
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      })
    } catch (error) {
      setError("Erro ao buscar CEP. Tente novamente.")
      console.error("Error fetching ZIP code:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSearch = () => {
    const numbersOnly = value.zipCode.replace(/\D/g, "")
    if (numbersOnly.length === 8) {
      searchZipCode(numbersOnly)
    }
  }

  return (
    <div className="space-y-4">
      {/* ZIP Code Field */}
      <div className="space-y-2">
        <Label htmlFor="zipCode" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          CEP {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex gap-2">
          <Input
            id="zipCode"
            value={value.zipCode}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
            required={required}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleManualSearch}
            disabled={isLoading || value.zipCode.replace(/\D/g, "").length !== 8}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-sm text-gray-600">Digite o CEP para buscar o endereço automaticamente</p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Address Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="street">Rua/Logradouro {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="street"
            value={value.street}
            onChange={(e) => onChange({ ...value, street: e.target.value })}
            placeholder="Nome da rua"
            required={required}
            readOnly={isLoading}
            className={isLoading ? "bg-gray-50" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="neighborhood"
            value={value.neighborhood}
            onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
            placeholder="Nome do bairro"
            required={required}
            readOnly={isLoading}
            className={isLoading ? "bg-gray-50" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="city"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="Nome da cidade"
            required={required}
            readOnly={isLoading}
            className={isLoading ? "bg-gray-50" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="state"
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            placeholder="UF"
            maxLength={2}
            required={required}
            readOnly={isLoading}
            className={isLoading ? "bg-gray-50" : ""}
          />
        </div>
      </div>

      {/* Number and Complement */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Número {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="number"
            value={value.number}
            onChange={(e) => onChange({ ...value, number: e.target.value })}
            placeholder="123"
            required={required}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={value.complement}
            onChange={(e) => onChange({ ...value, complement: e.target.value })}
            placeholder="Apartamento, bloco, referência (opcional)"
          />
        </div>
      </div>

      {/* Full Address Preview */}
      {value.street && value.neighborhood && value.city && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium text-gray-700">Endereço Completo:</Label>
          <p className="text-sm text-gray-900 mt-1">
            {value.street}
            {value.number && `, ${value.number}`}
            {value.complement && `, ${value.complement}`}
            <br />
            {value.neighborhood} - {value.city}/{value.state}
            <br />
            CEP: {value.zipCode}
          </p>
        </div>
      )}
    </div>
  )
}
