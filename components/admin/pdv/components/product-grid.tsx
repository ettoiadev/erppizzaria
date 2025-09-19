import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Grid3X3, Plus, Package } from "lucide-react"
import { Product } from '../types'
import Image from 'next/image'

interface ProductGridProps {
  products: Product[]
  onProductSelect: (product: Product) => void
  formatCurrency: (value: number) => string
}

export function ProductGrid({ products, onProductSelect, formatCurrency }: ProductGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Produtos ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {product.showImage && product.image && (
                    <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
                      {product.productNumber && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          #{product.productNumber}
                        </Badge>
                      )}
                    </div>
                    
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {product.sizes && product.sizes.length > 0 ? (
                          <div className="space-y-1">
                            {product.sizes.map((size, index) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium">{size.name}:</span>
                                <span className="text-primary ml-1">
                                  {formatCurrency(size.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => onProductSelect(product)}
                        className="h-8 px-3"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}