import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Product, Category } from '../types'

// Query keys para cache
const PRODUCTS_QUERY_KEY = 'products'
const CATEGORIES_QUERY_KEY = 'categories'

// Função para buscar produtos otimizada
const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch('/api/products')
  if (!response.ok) {
    throw new Error('Erro ao carregar produtos')
  }
  
  const data = await response.json()
  const products = Array.isArray(data) ? data : (data.products || [])
  return products.filter((product: Product) => product.available)
}

// Função para buscar categorias otimizada
const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/categories')
  if (!response.ok) {
    throw new Error('Erro ao carregar categorias')
  }
  
  const data = await response.json()
  const categories = Array.isArray(data) ? data : (data.categories || [])
  return categories.filter((category: Category) => category.active)
}

export function usePDVDataOptimized() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Query para buscar produtos com cache otimizado
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: [PRODUCTS_QUERY_KEY],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutos - produtos não mudam frequentemente
    gcTime: 10 * 60 * 1000, // 10 minutos - tempo de garbage collection
    refetchOnWindowFocus: false, // Não refetch ao focar na janela
    refetchOnMount: false, // Não refetch ao montar se já tem dados em cache
    retry: 2, // Tentar novamente 2 vezes em caso de erro
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
  })

  // Query para buscar categorias com cache otimizado
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useQuery({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutos - categorias mudam ainda menos
    gcTime: 15 * 60 * 1000, // 15 minutos - tempo de garbage collection
    refetchOnWindowFocus: false, // Não refetch ao focar na janela
    refetchOnMount: false, // Não refetch ao montar se já tem dados em cache
    retry: 2, // Tentar novamente 2 vezes em caso de erro
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
  })

  // Filtrar produtos por categoria de forma otimizada
  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(product => product.categoryId === selectedCategory)

  const loading = productsLoading || categoriesLoading
  const hasError = productsError || categoriesError

  // Log de erros para debug
  if (productsError) {
    console.error('Erro ao carregar produtos:', productsError)
  }
  if (categoriesError) {
    console.error('Erro ao carregar categorias:', categoriesError)
  }

  return {
    products,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
    refetchProducts,
    refetchCategories,
    hasError,
    productsError,
    categoriesError
  }
}