import { QueryClient } from '@tanstack/react-query'

// Configurações de cache otimizadas para diferentes tipos de dados
export const QUERY_CONFIG = {
  // Dados que mudam frequentemente (pedidos, status)
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Dados que mudam ocasionalmente (produtos, categorias)
  SEMI_STATIC: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Dados que raramente mudam (clientes, configurações)
  STATIC: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Dados externos (CEP, APIs externas)
  EXTERNAL: {
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(2000 * 2 ** attemptIndex, 60000),
  },
  
  // Busca com debounce (search)
  SEARCH: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
    retryDelay: 1000,
  }
} as const

// Chaves de query padronizadas
export const QUERY_KEYS = {
  // Pedidos
  ORDERS: ['orders'] as const,
  ORDERS_BY_STATUS: (status?: string) => ['orders', 'status', status] as const,
  ORDER_STATS: ['orders', 'statistics'] as const,
  
  // Produtos
  PRODUCTS: ['products'] as const,
  PRODUCTS_ACTIVE: ['products', 'active'] as const,
  PRODUCTS_BY_CATEGORY: (categoryId?: string) => ['products', 'category', categoryId] as const,
  
  // Categorias
  CATEGORIES: ['categories'] as const,
  CATEGORIES_ACTIVE: ['categories', 'active'] as const,
  
  // Clientes
  CUSTOMERS: ['customers'] as const,
  CUSTOMERS_SEARCH: (term: string) => ['customers', 'search', term] as const,
  CUSTOMER_BY_ID: (id: string) => ['customers', id] as const,
  
  // CEP
  CEP: (cep: string) => ['cep', cep] as const,
} as const

// Configuração global do QueryClient
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Configurações padrão para todas as queries
        staleTime: QUERY_CONFIG.DYNAMIC.staleTime,
        gcTime: QUERY_CONFIG.DYNAMIC.gcTime,
        retry: QUERY_CONFIG.DYNAMIC.retry,
        retryDelay: QUERY_CONFIG.DYNAMIC.retryDelay,
        
        // Configurações de rede
        networkMode: 'online',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
      },
    },
  })
}

// Utilitários para invalidação de cache
export const invalidateQueries = {
  orders: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER_STATS })
  },
  
  products: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
  },
  
  categories: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES })
  },
  
  customers: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS })
  },
  
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries()
  }
}