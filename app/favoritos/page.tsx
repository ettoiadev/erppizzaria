"use client"

import { useState, useEffect } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface FavoriteProduct {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  category: string
  available: boolean
  rating?: number
}

export default function FavoritesPage() {
  const { addItem } = useCart()
  const { toast } = useToast()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/favorites')
      if (!response.ok) {
        throw new Error('Erro ao carregar favoritos')
      }
      
      const data = await response.json()
      setFavorites(data)
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error)
      setError('Erro ao carregar seus favoritos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: FavoriteProduct) => {
    if (!product.available) {
      toast({
        title: "Produto indisponível",
        description: "Este produto não está disponível no momento.",
        variant: "destructive"
      })
      return
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url || "/default-image.svg",
    })
    
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    })
  }

  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao remover favorito')
      }

      // Remove from local state
      setFavorites(favorites.filter(fav => fav.id !== productId))
      
      toast({
        title: "Removido dos favoritos",
        description: "O produto foi removido da sua lista de favoritos.",
      })
    } catch (error) {
      console.error('Erro ao remover favorito:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto dos favoritos.",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Faça login para ver seus favoritos</h3>
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para gerenciar sua lista de favoritos.
            </p>
            <Button asChild>
              <a href="/login">Fazer Login</a>
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar favoritos</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchFavorites}>Tentar Novamente</Button>
          </div>
        </div>
      </AuthenticatedLayout>
    )
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
                    src={product.image_url || "/default-image.svg"}
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
                  {!product.available && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold">Indisponível</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  {product.rating && (
                    <div className="flex items-center mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">R$ {Number(product.price).toFixed(2)}</span>
                    <Button 
                      size="sm" 
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.available}
                    >
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
