import { useState, useEffect } from 'react'
import { Customer, CustomerAddress, ViaCEPResponse } from '../types'
import { useToast } from '@/hooks/use-toast'

export function useCustomer() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState<CustomerAddress>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [customerCode, setCustomerCode] = useState('')
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const { toast } = useToast()

  // Debounce para busca de clientes
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCustomers(searchTerm)
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  // Busca por código do cliente
  useEffect(() => {
    if (customerCode.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        searchCustomersByCode(customerCode)
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [customerCode])

  const searchCustomers = async (term: string) => {
    if (term.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(term)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.customers || [])
      } else {
        console.error('Erro ao buscar clientes')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const searchCustomersByCode = async (code: string) => {
    if (code.trim().length < 3) return

    try {
      const response = await fetch(`/api/customers/search?code=${encodeURIComponent(code)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.customers && data.customers.length > 0) {
          handleCustomerSelect(data.customers[0])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar cliente por código:', error)
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setCustomerEmail(customer.email || '')
    
    if (customer.primaryAddress) {
      setCustomerAddress({
        street: customer.primaryAddress.street,
        number: customer.primaryAddress.number,
        complement: customer.primaryAddress.complement || '',
        neighborhood: customer.primaryAddress.neighborhood,
        city: customer.primaryAddress.city,
        state: customer.primaryAddress.state,
        zip_code: customer.primaryAddress.zip_code
      })
    }
    
    setSearchTerm('')
    setSearchResults([])
    setCustomerCode('')
  }

  const handleCustomerSelectByCode = (customer: Customer) => {
    handleCustomerSelect(customer)
  }

  const handleNewCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setCustomerAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: ''
    })
    setIsEditingCustomer(true)
  }

  const handleEditCustomer = () => {
    setIsEditingCustomer(true)
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setCustomerAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: ''
    })
    setIsEditingCustomer(false)
    setSearchTerm('')
    setSearchResults([])
    setCustomerCode('')
  }

  const createNewCustomer = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive"
      })
      return null
    }

    try {
      const customerData = {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || null
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      })

      if (response.ok) {
        const newCustomer = await response.json()
        setSelectedCustomer(newCustomer)
        setIsEditingCustomer(false)
        return newCustomer
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao criar cliente",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar cliente",
        variant: "destructive"
      })
      return null
    }
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) {
      return numbers
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const searchZipCode = async (zipCode: string) => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    if (cleanZipCode.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)
      const data: ViaCEPResponse = await response.json()
      
      if (!data.erro) {
        setCustomerAddress(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
          zip_code: formatZipCode(data.cep)
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const handleZipCodeChange = (value: string) => {
    const formatted = formatZipCode(value)
    setCustomerAddress(prev => ({ ...prev, zip_code: formatted }))
  }

  const handleZipCodeBlur = () => {
    if (customerAddress.zip_code) {
      searchZipCode(customerAddress.zip_code)
    }
  }

  return {
    selectedCustomer,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    customerAddress,
    setCustomerAddress,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    customerCode,
    setCustomerCode,
    isEditingCustomer,
    setIsEditingCustomer,
    handleCustomerSelect,
    handleCustomerSelectByCode,
    handleNewCustomer,
    handleEditCustomer,
    handleClearCustomer,
    createNewCustomer,
    handleZipCodeChange,
    handleZipCodeBlur
  }
}