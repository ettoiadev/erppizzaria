"use client"

import { lazy, Suspense } from "react"
import { ProductCard } from "./product-card"
import type { Product } from "@/types"

// Lazy load framer-motion para reduzir bundle inicial
const MotionDiv = lazy(() => 
  import("framer-motion").then(module => ({ 
    default: module.motion.div 
  }))
)

interface ProductGridProps {
  products: Product[]
  onProductClick: (product: Product) => void
}

export function ProductGrid({ products = [], onProductClick }: ProductGridProps) {
  // Verificação de segurança
  if (!Array.isArray(products)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Carregando produtos...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum produto encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <Suspense key={product.id} fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64" />}>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ProductCard product={product} onClick={() => onProductClick(product)} />
          </MotionDiv>
        </Suspense>
      ))}
    </div>
  )
}
