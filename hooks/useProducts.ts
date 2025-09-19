import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Product } from "@/components/admin/pdv/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/products')
      if (!response.ok) {
        throw new Error('Falha ao carregar produtos')
      }
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar produtos",
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    products,
    loading,
    loadProducts
  }
}