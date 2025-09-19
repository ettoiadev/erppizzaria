"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Customer } from "@/types/admin"

interface EditCustomerModalProps {
  customer: Customer
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CustomerFormData {
  name: string
  email: string
  phone: string
  address: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    complement: string
    zip_code: string
  }
}

export function EditCustomerModal({ customer, isOpen, onClose, onSuccess }: EditCustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      complement: '',
      zip_code: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [fetchingDetails, setFetchingDetails] = useState(false)

  // Buscar detalhes completos do cliente quando o modal abrir
  useEffect(() => {
    if (isOpen && customer) {
      fetchCustomerDetails()
    }
  }, [isOpen, customer])

  const fetchCustomerDetails = async () => {
    setFetchingDetails(true)
    try {
      const response = await fetch(`/api/customers/${customer.id}`)
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do cliente')
      }
      
      const data = await response.json()
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: {
          street: data.address?.street || '',
          number: data.address?.number || '',
          neighborhood: data.address?.neighborhood || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          complement: data.address?.complement || '',
          zip_code: data.address?.zip_code || ''
        }
      })
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do cliente:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive"
      })
    } finally {
      setFetchingDetails(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações básicas
    if (!formData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome é obrigatório",
        variant: "destructive"
      })
      return
    }

    if (!formData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "Email é obrigatório",
        variant: "destructive"
      })
      return
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro de validação",
        description: "Email deve ter um formato válido",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar cliente')
      }

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso",
        variant: "default"
      })

      onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o cliente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '')
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Cliente
            {customer.customer_code && (
              <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                #{customer.customer_code.toString().padStart(4, '0')}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {fetchingDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando dados do cliente...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo do cliente"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Endereço</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.address.number}
                    onChange={(e) => handleInputChange('address.number', e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address.neighborhood}
                    onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                    placeholder="Nome do bairro"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.address.zip_code}
                    onChange={(e) => handleInputChange('address.zip_code', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.address.complement}
                    onChange={(e) => handleInputChange('address.complement', e.target.value)}
                    placeholder="Apartamento, bloco, etc."
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}