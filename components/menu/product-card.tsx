"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Product } from "@/types"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageError = () => {
    console.log("Image failed to load:", product.image)
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  // Check if image URL is a blob URL (which won't work)
  const isValidImageUrl =
    product.image &&
    !product.image.startsWith("blob:") &&
    (product.image.startsWith("http") || product.image.startsWith("/"))

  // Determina se deve mostrar a área da imagem
  const shouldShowImageArea = product.showImage !== false && isValidImageUrl
  
  // Determina se deve mostrar a imagem real (sem erro de carregamento)
  const shouldShowImage = shouldShowImageArea && !imageError

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      {/* Área da imagem - só renderiza se showImage for true E houver URL válida */}
      {shouldShowImageArea && (
        <div className="h-[150px] overflow-hidden bg-gray-100 flex items-center justify-center" onClick={onClick}>
          {shouldShowImage && (
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ display: imageLoading ? "none" : "block" }}
            />
          )}
          
          {imageLoading && shouldShowImage && (
            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
              <span className="text-gray-400 text-sm">Carregando...</span>
            </div>
          )}

          {imageError && (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sem imagem</span>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo do card - com padding e tamanhos ajustados baseado na presença da área de imagem */}
      <CardContent className={shouldShowImageArea ? "p-4" : "p-6"}>
        <div onClick={onClick}>
          <h3 className={`font-semibold mb-2 line-clamp-1 ${shouldShowImageArea ? "text-lg" : "text-xl"}`}>
            {product.productNumber ? `${product.productNumber} - ${product.name}` : product.name}
          </h3>
          <p className={`text-gray-600 mb-3 ${shouldShowImageArea ? "text-sm line-clamp-2" : "text-base line-clamp-3"}`}>
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-primary ${shouldShowImageArea ? "text-xl" : "text-2xl"}`}>
              {formatCurrency(product.price)}
            </span>
            <Button size={shouldShowImageArea ? "sm" : "default"} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
