"use client"

import { useState } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"

export default function FavoritesPage() {
  const { addItem } = useCart()
  const { toast } = useToast()

  // Mock favorites data - replace with real API call
  const [favorites] = useState([
    {
      id: "1",
      name: "Pizza Margherita",
      description: "Molho de tomate, mussarela, manjericão fresco",
      price: 32.9,
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.8,
      category: "Pizzas Tradicionais",
    },
    {
      id: "2",
      name: "Pizza Pepperoni",
      description: "Molho de tomate, mussarela, pepperoni",
      price: 36.9,
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.9,
      category: "Pizzas Tradicionais",
    },
  ])

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    })
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    })
  }

  const handleRemoveFromFavorites = (productId: string) => {
    // In production, make API call to remove from favorites
    toast({
      title: "Removido dos favoritos",
      description: "O produto foi removido da sua lista de favoritos.",
    })
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Favoritos</h1>
          <p className="text-gray-600">Seus produtos favoritos em um só lugar</p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => handleRemoveFromFavorites(product.id)}
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">R$ {Number(product.price).toFixed(2)}</span>
                    <Button size="sm" onClick={() => handleAddToCart(product)}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum favorito ainda</h3>
            <p className="text-gray-600 mb-4">
              Adicione produtos aos seus favoritos para encontrá-los facilmente aqui.
            </p>
            <Button asChild>
              <a href="/cardapio">Explorar Cardápio</a>
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
