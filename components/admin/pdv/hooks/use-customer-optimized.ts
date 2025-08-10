import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

// Tipos
export interface Customer {
  id: string
  customer_code?: string
  name: string
  email: string
  phone: string
  address: string
  complement?: string
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
  createdAt?: string
  lastOrderAt?: string | null
  totalOrders?: number
  totalSpent?: number
  status?: string
  favoriteItems?: any[]
}

export interface CustomerAddress {
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  complement?: string
  zip_code: string
}

// Query keys para cache
const CUSTOMER_SEARCH_QUERY_KEY = 'customer-search'
const CUSTOMERS_LIST_QUERY_KEY = 'customers-list'
const CEP_QUERY_KEY = 'cep'

// Função para buscar clientes por termo de busca
const searchCustomers = async (searchTerm: string, codeSearch?: string): Promise<Customer[]> => {
  if (!searchTerm && !codeSearch) {
    return []
  }

  const params = new URLSearchParams()
  if (searchTerm) params.append('q', searchTerm)
  if (codeSearch) params.append('code', codeSearch)
  params.append('limit', '10')

  const response = await fetch(`/api/customers/search?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Erro ao buscar clientes')
  }

  const data = await response.json()
  return data.customers || []
}

// Função para buscar todos os clientes
const fetchAllCustomers = async (): Promise<Customer[]> => {
  const response = await fetch('/api/customers')
  if (!response.ok) {
    throw new Error('Erro ao carregar clientes')
  }

  const data = await response.json()
  return data.customers || []
}

// Função para buscar CEP
const fetchCEP = async (cep: string): Promise<any> => {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos')
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
  if (!response.ok) {
    throw new Error('Erro ao buscar CEP')
  }

  const data = await response.json()
  if (data.erro) {
    throw new Error('CEP não encontrado')
  }

  return data
}

export function useCustomerOptimized() {
  const [searchTerm, setSearchTerm] = useState('')
  const [codeSearch, setCodeSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [addressData, setAddressData] = useState<CustomerAddress>({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    zip_code: '',
  })

  // Debounce do termo de busca para evitar muitas requisições
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const debouncedCodeSearch = useDebounce(codeSearch, 300)

  // Query para busca de clientes com debounce
  const {
    data: searchResults = [],
    isLoading: isSearching,
    error: searchError
  } = useQuery({
    queryKey: [CUSTOMER_SEARCH_QUERY_KEY, debouncedSearchTerm, debouncedCodeSearch],
    queryFn: () => searchCustomers(debouncedSearchTerm, debouncedCodeSearch),
    enabled: !!(debouncedSearchTerm || debouncedCodeSearch), // Só executa se houver termo de busca
    staleTime: 2 * 60 * 1000, // 2 minutos - resultados de busca ficam frescos por pouco tempo
    gcTime: 5 * 60 * 1000, // 5 minutos - tempo de garbage collection
    refetchOnWindowFocus: false,
    retry: 1, // Apenas 1 tentativa para buscas
  })

  // Query para lista completa de clientes (usado quando necessário)
  const {
    data: allCustomers = [],
    isLoading: isLoadingAll,
    refetch: refetchAllCustomers
  } = useQuery({
    queryKey: [CUSTOMERS_LIST_QUERY_KEY],
    queryFn: fetchAllCustomers,
    enabled: false, // Só executa quando explicitamente chamado
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  })

  // Query para busca de CEP
  const {
    data: cepData,
    isLoading: isLoadingCEP,
    error: cepError,
    refetch: searchCEP
  } = useQuery({
    queryKey: [CEP_QUERY_KEY, addressData.zip_code],
    queryFn: () => fetchCEP(addressData.zip_code),
    enabled: false, // Só executa quando explicitamente chamado
    staleTime: 24 * 60 * 60 * 1000, // 24 horas - CEP não muda
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 dias
    refetchOnWindowFocus: false,
    retry: 1,
  })

  // Função para buscar CEP
  const handleSearchCEP = async () => {
    const cleanCep = addressData.zip_code.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const result = await searchCEP()
        if (result.data) {
          setAddressData(prev => ({
            ...prev,
            street: result.data.logradouro || '',
            neighborhood: result.data.bairro || '',
            city: result.data.localidade || '',
            state: result.data.uf || '',
          }))
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }

  // Função para selecionar cliente
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    })
    setAddressData({
      street: customer.street || '',
      number: customer.number || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      state: customer.state || '',
      complement: customer.complement || '',
      zip_code: customer.zip_code || '',
    })
    setSearchTerm('')
    setCodeSearch('')
  }

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedCustomer(null)
    setCustomerData({ name: '', email: '', phone: '' })
    setAddressData({
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      complement: '',
      zip_code: '',
    })
    setSearchTerm('')
    setCodeSearch('')
  }

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return numbers.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  // Memoizar resultados filtrados para performance
  const filteredResults = useMemo(() => {
    return searchResults.slice(0, 10) // Limitar a 10 resultados
  }, [searchResults])

  return {
    // Estados
    searchTerm,
    setSearchTerm,
    codeSearch,
    setCodeSearch,
    selectedCustomer,
    customerData,
    setCustomerData,
    addressData,
    setAddressData,
    
    // Resultados de busca
    searchResults: filteredResults,
    isSearching,
    searchError,
    
    // Lista completa
    allCustomers,
    isLoadingAll,
    refetchAllCustomers,
    
    // CEP
    cepData,
    isLoadingCEP,
    cepError,
    handleSearchCEP,
    
    // Ações
    handleSelectCustomer,
    clearSelection,
    formatCEP,
  }
}