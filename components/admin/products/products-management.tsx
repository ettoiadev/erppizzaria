"use client"

import { useState, useEffect, useMemo } from "react"
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
// Função auxiliar para obter headers de autenticação
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  return headers
}

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
  const [deletingItem, setDeletingItem] = useState<{ type: "product" | "category"; id: string; name: string } | null>(null)

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
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      const data = await response.json()
      const productsData = Array.isArray(data) ? data : (data.products || [])
      setProducts(productsData)
    } catch (error) {
      logger.error("Error loading products:", error)
      setLoadError("Falha ao carregar produtos. Tente novamente mais tarde.")
      toast({ title: "Erro", description: "Falha ao carregar produtos.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`)
      const data = await response.json()
      const activeCategories = (data.categories || []).filter((cat: Category) => cat.active !== false)
      setCategories(activeCategories)
    } catch (error) {
      logger.error("Error loading categories:", error)
      toast({ title: "Erro", description: "Falha ao carregar categorias.", variant: "destructive" })
    }
  }

  const filteredProducts = useMemo(() => {
    return products?.filter((product) => {
      const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
      const matchesSearch =
        (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    }) || []
  }, [products, selectedCategory, searchTerm])

  // Product actions
  const handleCreateProduct = () => { setEditingProduct(null); setProductModalOpen(true) }
  const handleEditProduct = (product: Product) => { setEditingProduct(product); setProductModalOpen(true) }
  const handleDeleteProduct = (product: Product) => { setDeletingItem({ type: "product", id: product.id, name: product.name }); setDeleteModalOpen(true) }

  const handleSaveProduct = async (productData: Partial<Product>) => {
    setSaving(true)
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"
      const headers = await getAuthHeaders()
      const response = await fetch(url, { method, headers, body: JSON.stringify(productData) })
      if (response.ok) {
        const data = await response.json()
        const savedProduct = data.product || data
        if (editingProduct) {
          setProducts(prev => prev.map(p => (p.id === editingProduct.id ? { ...p, ...savedProduct } : p)))
        } else {
          setProducts(prev => [...prev, savedProduct])
        }
        await queryClient.invalidateQueries({ queryKey: ["products"] })
        toast({ title: "Sucesso", description: `Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!` })
        setProductModalOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao salvar produto")
      }
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar produto", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggleProductAvailability = async (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const originalAvailable = product.available
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, available: !p.available } : p))
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/products/${productId}`, { method: "PATCH", headers, body: JSON.stringify({ available: !originalAvailable }) })
      if (!response.ok) throw new Error("Falha ao alterar disponibilidade")
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      toast({ title: "Sucesso", description: `Produto ${!originalAvailable ? 'ativado' : 'desativado'}!` })
    } catch (error) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, available: originalAvailable } : p))
      toast({ title: "Erro", description: "Erro ao alterar disponibilidade do produto", variant: "destructive" })
    }
  }

  // Category actions
  const handleCreateCategory = () => { setEditingCategory(null); setCategoryModalOpen(true) }
  const handleEditCategory = (category: Category) => { setEditingCategory(category); setCategoryModalOpen(true) }
  const handleDeleteCategory = (category: Category) => { setDeletingItem({ type: "category", id: category.id, name: category.name }); setDeleteModalOpen(true) }
  const handleSortCategories = () => setCategorySortModalOpen(true)

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    setSaving(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"
      const headers = await getAuthHeaders()
      const response = await fetch(url, { method, headers, credentials: 'include', body: JSON.stringify(categoryData) })
      if (response.ok) {
        await loadCategories()
        await queryClient.invalidateQueries({ queryKey: ["categories", "products"] })
        toast({ title: "Sucesso", description: `Categoria ${editingCategory ? 'atualizada' : 'criada'} com sucesso!` })
        setCategoryModalOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao salvar categoria")
      }
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar categoria", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    const { type, id, name } = deletingItem
    const endpoint = type === "product" ? "products" : "categories"
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/${endpoint}/${id}`, { 
        method: "DELETE",
        headers,
        credentials: 'include'
      })
      if (response.ok) {
        if (type === "product") {
          setProducts(prev => prev.filter(p => p.id !== id))
        } else {
          setCategories(prev => prev.filter(c => c.id !== id))
          if (selectedCategory === id) setSelectedCategory("all")
        }
        await queryClient.invalidateQueries({ queryKey: [endpoint] })
        toast({ title: "Sucesso", description: `${type === 'product' ? 'Produto' : 'Categoria'} "${name}" excluído(a) com sucesso!` })
      } else {
        const errorData = await response.json()
        const err = new Error(errorData.error || `Erro ao excluir ${type}`)
        err.cause = errorData.details
        throw err
      }
    } catch (error) {
      let title = "Erro ao excluir"
      let description = "Ocorreu um problema ao tentar excluir o item."
      if (error instanceof Error) {
        if (error.message.includes("produtos associados")) {
          title = "Ação Bloqueada"
          description = error.cause as string || `Não é possível excluir a categoria "${name}" pois ela contém produtos.`
        } else {
          description = error.message
        }
      }
      toast({ title, description, variant: "destructive" })
    } finally {
      setDeleteModalOpen(false)
      setDeletingItem(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="text-gray-600">Adicione, edite e gerencie seus produtos e categorias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateCategory}><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
          <Button onClick={handleCreateProduct}><Plus className="w-4 h-4 mr-2" />Novo Produto</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Categorias</h2>
            <Button variant="outline" size="sm" onClick={handleSortCategories}><ArrowUpDown className="w-4 h-4 mr-2" />Ordenar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={category.image || "/default-image.svg"} alt={category.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loadError && <div className="text-center py-12 text-red-600"><p>{loadError}</p></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            {product.show_image && (
              <CardHeader className="p-0">
                <img src={product.image || "/default-image.svg"} alt={product.name} className="w-full h-[150px] object-cover rounded-t-lg" onError={(e) => { (e.target as HTMLImageElement).src = "/default-image.svg" }} />
              </CardHeader>
            )}
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{product.product_number ? `${product.product_number} - ${product.name}` : product.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                </div>
                <Badge variant={product.available ? "default" : "secondary"}>{product.available ? "Disponível" : "Indisponível"}</Badge>
              </div>
              <div className="text-xl font-bold text-primary">{formatCurrency(product.price)}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch checked={Boolean(product.available)} onCheckedChange={() => toggleProductAvailability(product.id)} disabled={loading} />
                  <span className="text-sm">Disponível</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loading && !loadError && filteredProducts.length === 0 && <div className="text-center py-12"><p className="text-gray-500">Nenhum produto encontrado</p></div>}

      <ProductModal open={productModalOpen} onOpenChange={setProductModalOpen} product={editingProduct} categories={categories} onSave={handleSaveProduct} />
      <CategoryModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} category={editingCategory} onSave={handleSaveCategory} />
      <CategorySortModal open={categorySortModalOpen} onOpenChange={setCategorySortModalOpen} categories={categories} onSave={loadCategories} />
      <DeleteConfirmModal 
        open={deleteModalOpen} 
        onOpenChange={setDeleteModalOpen} 
        itemName={deletingItem?.name || ""} 
        itemType={deletingItem?.type || 'product'} 
        onConfirm={handleConfirmDelete} 
      />
    </div>
  )
}