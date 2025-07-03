"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { AuthenticatedHeader } from "@/components/layout/authenticated-header"
import { Footer } from "@/components/layout/footer"
import { ProductGrid } from "@/components/menu/product-grid"
import { CategoryFilter } from "@/components/menu/category-filter"
import { CartSidebar } from "@/components/cart/cart-sidebar"
import { ProductModal } from "@/components/menu/product-modal"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ShoppingBag, User, Pizza, ArrowDown } from "lucide-react"
import type { Product, Category } from "@/types"

export default function MenuPage() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Query para produtos
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error("Erro ao carregar produtos")
      const data = await response.json()
      return Array.isArray(data) ? data : (data.products || [])
    },
  })

  // Query para categorias
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Erro ao carregar categorias")
      const data = await response.json()
      return Array.isArray(data.categories) ? data.categories : []
    },
  })

  // Organizar produtos por categoria
  const productsByCategory = categories.reduce((acc: Record<string, Product[]>, category: Category) => {
    acc[category.id] = (products || []).filter((product: Product) => product.categoryId === category.id)
    return acc
  }, {})

  // Filtrar produtos por categoria se uma categoria específica estiver selecionada
  const filteredProducts = selectedCategory === "all" 
    ? null // Quando "all" está selecionado, mostraremos por categoria
    : (products || []).filter((product: Product) => product.categoryId === selectedCategory)

  // Verificar se há pizzas no cardápio
  const hasPizzas = (products || []).some((product: Product) => 
    product.name.toLowerCase().includes('pizza') || 
    categories.some((cat: Category) => 
      cat.name.toLowerCase().includes('pizza') && product.categoryId === cat.id
    )
  )

  // Mostrar mensagem de boas-vindas para usuários recém-logados
  useEffect(() => {
    if (user) {
      const hasSeenWelcome = localStorage.getItem(`welcome-${user.id}`)
      if (!hasSeenWelcome) {
        setShowWelcome(true)
        localStorage.setItem(`welcome-${user.id}`, "true")
      }
    }
  }, [user])

  const handleDismissWelcome = () => {
    setShowWelcome(false)
  }

  // Função para rolar até uma categoria específica
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Determinar qual header usar baseado no estado de autenticação
  const HeaderComponent = user ? AuthenticatedHeader : Header

  // Loading state
  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent onCartClick={() => setIsCartOpen(true)} />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    )
  }

  // Error state
  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent onCartClick={() => setIsCartOpen(true)} />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Erro ao carregar o cardápio. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent onCartClick={() => setIsCartOpen(true)} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Mensagem de boas-vindas para usuários logados */}
        {showWelcome && user && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <User className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span>
                  Bem-vindo(a), <strong>{user.name.split(" ")[0]}</strong>! Explore nosso cardápio e faça seu pedido.
                </span>
                <Button variant="ghost" size="sm" onClick={handleDismissWelcome} className="text-green-600">
                  ✕
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mensagem informativa para usuários não logados */}
        {!user && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <User className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <span>
                  Para adicionar itens ao carrinho e fazer pedidos, faça <strong>login</strong> ou <strong>cadastre-se</strong>.
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild className="text-blue-600">
                    <a href="/login">Entrar</a>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="text-blue-600">
                    <a href="/cadastro">Cadastrar</a>
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mensagem informativa sobre Pizza Meio a Meio */}
        {hasPizzas && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Pizza className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-start gap-3">
                <span className="text-lg">🍕</span>
                <div>
                  <strong>Monte sua pizza meio a meio!</strong> Escolha dois sabores diferentes ao clicar na pizza desejada.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Nosso Cardápio</h1>
              <p className="text-gray-600">Escolha entre nossas deliciosas opções</p>
            </div>
            {user && itemCount > 0 && (
              <Button onClick={() => setIsCartOpen(true)} className="md:hidden flex items-center gap-2" size="sm">
                <ShoppingBag className="w-4 h-4" />
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </Button>
            )}
          </div>
        </div>

        {/* Navegação rápida por categorias */}
        {selectedCategory === "all" && categories.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-wrap gap-3">
              {categories.map((category: Category) => {
                const categoryProducts = productsByCategory[category.id] || []
                if (categoryProducts.length === 0) return null
                
                return (
                  <Button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-3 text-base rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                    size="lg"
                  >
                    <ArrowDown className="w-4 h-4" />
                    {category.name}
                    <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm font-bold ml-1">
                      {categoryProducts.length}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtros de categoria */}
        <div className="mb-8">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Exibição por categoria ou filtrada */}
        {selectedCategory === "all" ? (
          // Mostrar produtos organizados por categoria
          <div className="space-y-12">
            {categories.map((category: Category) => {
              const categoryProducts = productsByCategory[category.id] || []
              if (categoryProducts.length === 0) return null

              return (
                <div key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
                  {/* Título da categoria */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      {category.image && (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                        {category.description && (
                          <p className="text-gray-600 mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-primary via-primary/20 to-transparent"></div>
                  </div>

                  {/* Produtos da categoria */}
                  <ProductGrid products={categoryProducts} onProductClick={setSelectedProduct} />
                </div>
              )
            })}

            {/* Mensagem se não houver produtos */}
            {categories.every((category: Category) => (productsByCategory[category.id] || []).length === 0) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto disponível</h3>
                <p className="text-gray-600">Nosso cardápio está sendo atualizado. Volte em breve!</p>
              </div>
            )}
          </div>
        ) : (
          // Mostrar produtos filtrados por categoria específica
          <ProductGrid products={filteredProducts || []} onProductClick={setSelectedProduct} />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal do produto */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Sidebar do carrinho - apenas para usuários logados */}
      {user && (
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </div>
  )
}
