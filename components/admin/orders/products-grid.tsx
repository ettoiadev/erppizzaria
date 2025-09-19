"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { Product } from "../pdv/types"

interface ProductsGridProps {
  products: Product[]
  onProductClick: (product: Product) => void
  formatCurrency: (value: number) => string
}

export function ProductsGrid({ products, onProductClick, formatCurrency }: ProductsGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onProductClick(product)}
            >
              <div className="flex items-center gap-3">
                {product.showImage && product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">
                    {product.productNumber ? `${product.productNumber} - ${product.name}` : product.name}
                  </h4>
                  <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {product.description.substring(0, 50)}...
                    </p>
                  )}
                </div>
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}