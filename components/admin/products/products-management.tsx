"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, ArrowUpDown } from "lucide-react"
import { ProductModal } from "./product-modal"
import { CategoryModal } from "./category-modal"
import { CategorySortModal } from "./category-sort-modal"
import { DeleteConfirmModal } from "./delete-confirm-modal"
import { formatCurrency } from "@/lib/utils"
import { logger } from "@/lib/debug-utils"
import { useToast } from "@/hooks/use-toast"
import type { Product, Category } from "@/types"

export function ProductsManagement() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categorySortModalOpen, setCategorySortModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: "product" | "category"; id: string; name: string } | null>(
    null,
  )

  // Load data
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      
      const products = Array.isArray(data) ? data : (data.products || [])
      const normalizedProducts = products.map((product: any) => ({
        ...product,
        name: product.name || "",
        description: product.description || "",
        categoryId: product.category_id || product.categoryId
      }))
      setProducts(normalizedProducts)
    } catch (error) {
      logger.error("Error loading products:", error)
      setLoadError("Falha ao carregar produtos. Tente novamente mais tarde.")
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos. Tente novamente mais tarde.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`)
      }
      const data = await response.json()
      
      // Filtrar apenas categorias ativas
      const activeCategories = (data.categories || []).filter((cat: Category) => cat.active !== false)
      setCategories(activeCategories)
    } catch (error) {
      logger.error("Error loading categories:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar categorias.",
        variant: "destructive"
      })
    }
  }

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory
    const matchesSearch =
      (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  }) || []

  // Product actions
  const handleCreateProduct = () => {
    setEditingProduct(null)
    setProductModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductModalOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setDeletingItem({ type: "product", id: product.id, name: product.name })
    setDeleteModalOpen(true)
  }

  const handleSaveProduct = async (productData: Partial<Product>) => {
    setSaving(true)
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const data = await response.json()
        const savedProduct = data.product || data

        if (editingProduct) {
          setProducts((prevProducts) =>
            prevProducts.map((p) => (p.id === editingProduct.id ? { ...p, ...savedProduct } : p)),
          )
          toast({
            title: "Sucesso",
            description: "Produto atualizado com sucesso!"
          })
        } else {
          const newProduct = {
            ...savedProduct,
            name: savedProduct.name || "",
            description: savedProduct.description || "",
            categoryId: savedProduct.category_id || savedProduct.categoryId
          }
          setProducts((prevProducts) => [...prevProducts, newProduct])
          toast({
            title: "Sucesso",
            description: "Produto criado com sucesso!"
          })
        }

        await queryClient.invalidateQueries({ queryKey: ["products"] })
        await queryClient.invalidateQueries({ queryKey: ["categories"] })

        setProductModalOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao salvar produto")
      }
    } catch (error) {
      logger.error("Error saving product:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar produto",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleProductAvailability = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      setProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === productId ? { ...p, available: !p.available } : p)),
      )

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !product.available }),
      })

      if (!response.ok) {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === productId ? { ...p, available: product.available } : p)),
        )
        toast({
          title: "Erro",
          description: "Falha ao alterar disponibilidade do produto",
          variant: "destructive"
        })
      } else {
        await queryClient.invalidateQueries({ queryKey: ["products"] })
        toast({
          title: "Sucesso",
          description: `Produto ${!product.available ? 'ativado' : 'desativado'} com sucesso!`
        })
      }
    } catch (error) {
      logger.error("Error toggling product availability:", error)
      const originalProduct = products.find((p) => p.id === productId)
      if (originalProduct) {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === productId ? { ...p, available: originalProduct.available } : p)),
        )
      }
      toast({
        title: "Erro",
        description: "Erro ao alterar disponibilidade do produto",
        variant: "destructive"
      })
    }
  }

  // Category actions
  const handleCreateCategory = () => {
    setEditingCategory(null)
    setCategoryModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setDeletingItem({ type: "category", id: category.id, name: category.name })
    setDeleteModalOpen(true)
  }

  const handleSortCategories = () => {
    setCategorySortModalOpen(true)
  }

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    setSaving(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"

      console.log('Enviando requisição:', { url, method, data: categoryData })

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      })

      console.log('Resposta recebida:', response.status, response.statusText)

      if (response.ok) {
        const savedCategory = await response.json()
        console.log('Dados salvos:', savedCategory)
        
        // Normalizar resposta (pode vir como objeto direto ou dentro de um wrapper)
        const categoryData = savedCategory.category || savedCategory

        if (editingCategory) {
          setCategories((prevCategories) =>
            prevCategories.map((c) => (c.id === editingCategory.id ? { ...c, ...categoryData } : c)),
          )
          toast({
            title: "Sucesso",
            description: "Categoria atualizada com sucesso!"
          })
        } else {
          setCategories((prevCategories) => [...prevCategories, categoryData])
          toast({
            title: "Sucesso", 
            description: "Categoria criada com sucesso!"
          })
        }

        await queryClient.invalidateQueries({ queryKey: ["categories"] })
        await queryClient.invalidateQueries({ queryKey: ["products"] })

        setCategoryModalOpen(false)
      } else {
        const errorData = await response.json()
        console.error('Erro da API:', errorData)
        throw new Error(errorData.error || "Falha ao salvar categoria")
      }
    } catch (error) {
      logger.error("Error saving category:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar categoria",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCategoryOrder = async () => {
    try {
      await loadCategories()
      await queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast({
        title: "Sucesso",
        description: "Ordem das categorias atualizada com sucesso!"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar ordem das categorias",
        variant: "destructive"
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return

    console.log('🗑️ Iniciando exclusão:', deletingItem)

    try {
      const endpoint = deletingItem.type === "product" ? "products" : "categories"
      const idToDelete = deletingItem.id

      console.log(`📡 Fazendo DELETE para /api/${endpoint}/${idToDelete}`)

      const response = await fetch(`/api/${endpoint}/${idToDelete}`, {
        method: "DELETE",
      })

      console.log('📡 Resposta da API:', response.status, response.statusText)

      if (response.ok) {
        const responseData = await response.json()
        console.log('📡 Dados da resposta:', responseData)

        if (deletingItem.type === "product") {
          setProducts((prevProducts) => prevProducts.filter((p) => p.id !== idToDelete))
          await queryClient.invalidateQueries({ queryKey: ["products"] })
          toast({
            title: "Sucesso",
            description: "Produto excluído com sucesso!"
          })
        } else {
          // Para categorias: atualizar estado local imediatamente
          setCategories((prevCategories) => {
            const updatedCategories = prevCategories.filter((c) => c.id !== idToDelete)
            console.log('📊 Categorias após remoção local:', updatedCategories.length)
            return updatedCategories
          })
          
          if (selectedCategory === idToDelete) {
            console.log('🎯 Resetando filtro de categoria selecionada')
            setSelectedCategory("all")
          }
          
          // Recarregar do servidor em background para garantir consistência
          setTimeout(async () => {
            await loadCategories()
            await queryClient.invalidateQueries({ queryKey: ["categories"] })
          }, 100)
          
          toast({
            title: "Sucesso", 
            description: "Categoria excluída com sucesso!"
          })
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Erro na API:', errorData)
        throw new Error(errorData.error || "Erro ao excluir item")
      }
    } catch (error) {
      console.error("❌ Error deleting item:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir item",
        variant: "destructive"
      })
    } finally {
      setDeleteModalOpen(false)
      setDeletingItem(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="text-gray-600">Adicione, edite e gerencie seus produtos e categorias</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateCategory}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Categorias</h2>
            <Button variant="outline" size="sm" onClick={handleSortCategories}>
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Ordenar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                    {category.sort_order && (
                      <p className="text-xs text-gray-500">Ordem: {category.sort_order}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loadError && (
        <div className="text-center py-12 text-red-600">
          <p>{loadError}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            {product.showImage && (
              <CardHeader className="p-0">
                <div className="h-[150px] overflow-hidden rounded-t-lg bg-gray-100">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              </CardHeader>
            )}
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {product.productNumber ? `${product.productNumber} - ${product.name}` : product.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                  </div>
                  <Badge variant={Boolean(product.available) ? "default" : "secondary"}>
                    {Boolean(product.available) ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>

                <div className="text-xl font-bold text-primary">{formatCurrency(product.price)}</div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={Boolean(product.available)}
                      onCheckedChange={() => toggleProductAvailability(product.id)}
                      disabled={loading}
                    />
                    <span className="text-sm">Disponível</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !loadError && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum produto encontrado</p>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
      />

      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      <CategorySortModal
        open={categorySortModalOpen}
        onOpenChange={setCategorySortModalOpen}
        categories={categories}
        onSave={handleSaveCategoryOrder}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        itemName={deletingItem?.name || ""}
        itemType={deletingItem?.type || "product"}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
} 