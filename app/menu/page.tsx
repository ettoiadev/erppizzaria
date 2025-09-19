"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { CategoryFilter } from "@/components/menu/category-filter"
import { ProductGrid } from "@/components/menu/product-grid"
import { ProductModal } from "@/components/menu/product-modal"
import { CartSidebar } from "@/components/cart/cart-sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Product } from "@/types"

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error("Erro ao carregar produtos")
      return response.json()
    },
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Erro ao carregar categorias")
      return response.json()
    },
  })

  const products = Array.isArray(productsData) ? productsData : (productsData?.products || [])
  const categories = categoriesData?.categories || []

  const filteredProducts = (products || []).filter(
    (product: Product) => selectedCategory === "all" || product.categoryId === selectedCategory,
  )

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout onCartClick={() => setIsCartOpen(true)}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nosso Cardápio</h1>
          <p className="text-gray-600">Escolha seus sabores favoritos</p>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <ProductGrid products={filteredProducts} onProductClick={setSelectedProduct} />
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </AuthenticatedLayout>
  )
}
