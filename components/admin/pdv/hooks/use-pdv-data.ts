import { useState, useEffect } from 'react'
import { Product, Category } from '../types'

export function usePDVData() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.products || [])
        setProducts(products.filter((product: Product) => product.available))
      } else {
        console.error('Erro ao carregar produtos')
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categories = Array.isArray(data) ? data : (data.categories || [])
        setCategories(categories.filter((category: Category) => category.active))
      } else {
        console.error('Erro ao carregar categorias')
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // Filtrar produtos por categoria
  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(product => product.categoryId === selectedCategory)

  return {
    products,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
    refetchProducts: fetchProducts,
    refetchCategories: fetchCategories
  }
}