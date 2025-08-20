"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2, Edit, Pizza } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useCoupon } from "@/contexts/coupon-context"
import { useAppSettings, calculateDeliveryFee } from "@/hooks/use-app-settings"
import { CouponInput } from "@/components/checkout/coupon-input"
import type { CartItem, Product } from "@/types"

interface OrderSummaryProps {
  items: CartItem[]
  total: number
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  const router = useRouter()
  const { removeItem, updateQuantity, updateItemByIndex } = useCart()
  const { settings } = useAppSettings()
  const { appliedCoupon } = useCoupon()
  const [editingItem, setEditingItem] = useState<{ item: CartItem; index: number } | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [userId, setUserId] = useState<string>("") // Será preenchido no useEffect
  
  // Calcular taxa de entrega considerando cupom de frete grátis
  const baseDeliveryFee = calculateDeliveryFee(total, settings)
  const deliveryFee = appliedCoupon?.type === 'free_delivery' ? 0 : baseDeliveryFee
  const finalTotal = total + deliveryFee
  
  // Buscar ID do usuário logado
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user?.id) {
            setUserId(data.user.id)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar ID do usuário:', error)
      }
    }
    
    fetchUserId()
  }, [])

  // Função para buscar dados do produto e abrir modal de edição
  const handleEditItem = async (item: CartItem, index: number) => {
    try {
      console.log('Item do carrinho para edição:', item)
      
      // Buscar dados completos do produto da API
      // Para pizza meio a meio, usar o productId da primeira metade
      // Para produtos normais, usar o id do item
      let productId: string | undefined
      
      if (item.isHalfAndHalf && item.halfAndHalf?.firstHalf?.productId) {
        productId = item.halfAndHalf.firstHalf.productId
        console.log('Pizza meio a meio detectada, usando productId da primeira metade:', productId)
      } else {
        productId = item.id
        console.log('Produto normal detectado, usando item.id:', productId)
      }
      
      // Validar se temos um productId válido
      if (!productId || productId.trim() === '') {
        console.error('ProductId inválido:', productId)
        console.error('Item completo:', JSON.stringify(item, null, 2))
        throw new Error('ID do produto não encontrado no item do carrinho')
      }
      
      // Limpar productId de caracteres extras se necessário
      const cleanProductId = productId.toString().replace(/--+$/, '').trim()
      console.log('ProductId limpo para requisição:', cleanProductId)
      
      const response = await fetch(`/api/products/${cleanProductId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro na API:', response.status, errorText)
        throw new Error(`Produto não encontrado: ${response.status} - ${errorText}`)
      }

      const productData = await response.json()
      
      // A API retorna { product: ... }, então precisamos acessar a propriedade product
      const product = productData.product || productData
      
      // Validar se os dados do produto são válidos
      if (!product || !product.id || !product.name) {
        console.error('Resposta da API:', productData)
        console.error('Produto extraído:', product)
        throw new Error('Dados do produto inválidos recebidos da API')
      }
      
      // Garantir que o produto tenha as propriedades necessárias com valores padrão
      const normalizedProduct = {
        ...product,
        sizes: product.sizes || [],
        toppings: product.toppings || [],
        image: product.image || '',
        description: product.description || '',
        categoryId: product.categoryId || product.category_id || '',
        available: product.available !== undefined ? product.available : true,
        showImage: product.showImage !== undefined ? product.showImage : true,
        productNumber: product.productNumber || product.product_number || null,
        price: product.price || 0
      }
      
      console.log('Produto normalizado para edição:', normalizedProduct)
      
      setEditingItem({ item, index })
      setEditingProduct(normalizedProduct)
      setIsEditModalOpen(true)
    } catch (error) {
      console.error('Erro ao carregar produto para edição:', error)
      console.error('Item que causou o erro:', JSON.stringify(item, null, 2))
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert(`Erro ao carregar dados do produto para edição: ${errorMessage}\n\nVerifique o console para mais detalhes.`)
    }
  }

  // Função para fechar o modal de edição
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingItem(null)
    setEditingProduct(null)
  }

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle>Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    
                    {item.isHalfAndHalf && item.halfAndHalf ? (
                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                        <div className="bg-blue-50 p-2 rounded border">
                          <p className="font-medium text-blue-800 mb-1">🍕 Pizza Meio a Meio:</p>
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium">1ª metade:</span> {item.halfAndHalf.firstHalf.productName}
                              {item.halfAndHalf.firstHalf.toppings && item.halfAndHalf.firstHalf.toppings.length > 0 && (
                                <div className="text-gray-500 ml-2">+ {item.halfAndHalf.firstHalf.toppings.join(", ")}</div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">2ª metade:</span> {item.halfAndHalf.secondHalf.productName}
                              {item.halfAndHalf.secondHalf.toppings && item.halfAndHalf.secondHalf.toppings.length > 0 && (
                                <div className="text-gray-500 ml-2">+ {item.halfAndHalf.secondHalf.toppings.join(", ")}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {item.size && <div className="text-gray-600 mt-1">Tamanho: {item.size}</div>}
                      </div>
                    ) : (
                      <>
                        {item.size && <div className="text-gray-600 text-sm">Tamanho: {item.size}</div>}
                        {item.toppings && item.toppings.length > 0 && (
                          <div className="text-gray-600 text-sm">Adicionais: {item.toppings.join(", ")}</div>
                        )}
                      </>
                    )}
                    
                    {item.notes && (
                      <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 mt-2">
                        <span className="font-medium">📝 Observações:</span> {item.notes}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                    title="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="font-medium text-sm bg-white px-3 py-1 rounded border min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(item, index)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3"
                      title="Editar item"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    
                    <div className="font-medium text-primary">
                      R$ {(Number(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            {userId && <CouponInput userId={userId} subtotal={total} />}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                  {deliveryFee === 0 ? "Grátis" : `R$ ${deliveryFee.toFixed(2)}`}
                  {appliedCoupon?.type === 'free_delivery' && deliveryFee === 0 && " (cupom)"}
                </span>
              </div>
              {total < parseFloat(settings.freeDeliveryMinimum || '50') && appliedCoupon?.type !== 'free_delivery' && (
                <div className="text-sm text-gray-600">
                  Frete grátis para pedidos acima de R$ {parseFloat(settings.freeDeliveryMinimum || '50').toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">R$ {finalTotal.toFixed(2)}</span>
          </div>

          <Separator />

          <Button 
            variant="outline" 
            className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white" 
            onClick={() => router.push("/cardapio")}
          >
            <span className="text-lg mr-2">+</span>
            Adicionar mais itens
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Edição de Item */}
      {editingProduct && editingItem && (
        <EditProductModal
          product={editingProduct}
          item={editingItem.item}
          itemIndex={editingItem.index}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onUpdate={updateItemByIndex}
        />
      )}
    </>
  )
}

// Componente EditProductModal personalizado para edição de itens no carrinho
function EditProductModal({ 
  product, 
  item, 
  itemIndex, 
  isOpen, 
  onClose, 
  onUpdate 
}: {
  product: Product
  item: CartItem
  itemIndex: number
  isOpen: boolean
  onClose: () => void
  onUpdate: (index: number, newItem: CartItem) => void
}) {
  // Todos os hooks devem ser chamados antes de qualquer return condicional
  const [selectedSize, setSelectedSize] = useState(item.size || product?.sizes?.[0]?.name || "")
  const [selectedToppings, setSelectedToppings] = useState<string[]>(item.toppings || [])
  const [notes, setNotes] = useState(item.notes || "")
  const [quantity, setQuantity] = useState(item.quantity)
  
  // Estados para pizza meio a meio
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(item.isHalfAndHalf || false)
  const [availablePizzas, setAvailablePizzas] = useState<Product[]>([])
  const [secondHalfProduct, setSecondHalfProduct] = useState<string>(item.halfAndHalf?.secondHalf.productId || "")
  const [firstHalfToppings, setFirstHalfToppings] = useState<string[]>(item.halfAndHalf?.firstHalf.toppings || [])
  const [secondHalfToppings, setSecondHalfToppings] = useState<string[]>(item.halfAndHalf?.secondHalf.toppings || [])
  
  // Estado para controlar qual aba de adicionais está ativa
  const [activeToppingsTab, setActiveToppingsTab] = useState<'first' | 'second'>('first')
  
  // Verificar se o produto é uma pizza - com validações de segurança
  const isPizza = (product?.name?.toLowerCase()?.includes('pizza')) || 
                  ['pizzas tradicionais', 'pizzas especiais'].some(cat => 
                    product?.categoryId && cat.toLowerCase().includes('pizza'))

  // Carregar pizzas disponíveis quando o modal abrir
  useEffect(() => {
    if (isOpen && isPizza) {
      fetchAvailablePizzas()
    }
  }, [isOpen, isPizza])

  // Validação de segurança inicial - após todos os hooks
  if (!product || !product.id || !product.name) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent aria-describedby="error-modal-description">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription id="error-modal-description">
              Dados do produto inválidos. Tente novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>Dados do produto inválidos. Tente novamente.</p>
            <Button onClick={onClose} className="mt-4">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const fetchAvailablePizzas = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.products || [])
        // Filtrar apenas pizzas disponíveis, excluindo o produto atual
        const pizzas = products.filter((p: Product) => 
          p?.id !== product?.id && 
          p?.available && 
          p?.name &&
          (p.name.toLowerCase().includes('pizza') || 
           ['pizzas tradicionais', 'pizzas especiais'].some(cat => 
             p?.categoryId && cat.toLowerCase().includes('pizza')))
        )
        setAvailablePizzas(pizzas)
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar pizzas:', error)
    }
  }

  const selectedSizePrice = Number(product?.sizes?.find((size) => size.name === selectedSize)?.price || product?.price || 0)
  
  const toppingsPrice = isHalfAndHalf 
    ? (firstHalfToppings.reduce((total, topping) => {
        const toppingData = product?.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0) + secondHalfToppings.reduce((total, topping) => {
        const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
        const toppingData = secondProduct?.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0)) / 2 // Dividir por 2 pois são metades
    : selectedToppings.reduce((total, topping) => {
        const toppingData = product?.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0)

  // Para pizza meio a meio, calcular preço médio das duas metades
  const basePrice = isHalfAndHalf && secondHalfProduct
    ? (() => {
        const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
        const secondProductSize = secondProduct?.sizes?.find(size => size.name === selectedSize)
        const secondPrice = Number(secondProductSize?.price || secondProduct?.price || 0)
        return (selectedSizePrice + secondPrice) / 2
      })()
    : selectedSizePrice

  const totalPrice = (basePrice + toppingsPrice) * quantity

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency", 
      currency: "BRL",
    }).format(value)
  }

  const handleUpdateItem = () => {
    if (isHalfAndHalf && !secondHalfProduct) {
      alert("Por favor, selecione o segundo sabor para a pizza meio a meio")
      return
    }

    const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)

    // Limpar IDs dos produtos removendo caracteres inválidos
    const cleanProductId = product?.id?.toString().replace(/--+$/, '').trim() || ''
    const cleanSecondProductId = secondHalfProduct ? secondHalfProduct.toString().replace(/--+$/, '').trim() : ''

    const updatedItem: CartItem = isHalfAndHalf 
      ? {
          id: `${cleanProductId}`,
          name: `Pizza Meio a Meio: ${product?.name || ''} / ${secondProduct?.name || ''}`,
          price: basePrice + toppingsPrice,
          quantity,
          image: product?.image || '',
          size: selectedSize,
          notes: notes.trim() || undefined,
          isHalfAndHalf: true,
          halfAndHalf: {
            firstHalf: {
              productId: cleanProductId,
              productName: product?.name || '',
              toppings: firstHalfToppings
            },
            secondHalf: {
              productId: cleanSecondProductId,
              productName: secondProduct?.name || '',
              toppings: secondHalfToppings
            }
          }
        }
      : {
          id: cleanProductId,
          name: product?.name || '',
          price: selectedSizePrice + toppingsPrice,
          quantity,
          image: product?.image || '',
          size: selectedSize,
          toppings: selectedToppings,
          notes: notes.trim() || undefined,
        }

    onUpdate(itemIndex, updatedItem)
    onClose()
  }

  const handleToppingChange = (topping: string, checked: boolean, isSecondHalf = false) => {
    if (isHalfAndHalf) {
      if (isSecondHalf) {
        if (checked) {
          setSecondHalfToppings([...secondHalfToppings, topping])
        } else {
          setSecondHalfToppings(secondHalfToppings.filter((t) => t !== topping))
        }
      } else {
        if (checked) {
          setFirstHalfToppings([...firstHalfToppings, topping])
        } else {
          setFirstHalfToppings(firstHalfToppings.filter((t) => t !== topping))
        }
      }
    } else {
      if (checked) {
        setSelectedToppings([...selectedToppings, topping])
      } else {
        setSelectedToppings(selectedToppings.filter((t) => t !== topping))
      }
    }
  }

  const resetHalfAndHalfState = () => {
    setSecondHalfProduct("")
    setFirstHalfToppings([])
    setSecondHalfToppings([])
    setActiveToppingsTab('first')
  }

  const handleHalfAndHalfToggle = (enabled: boolean) => {
    setIsHalfAndHalf(enabled)
    if (!enabled) {
      resetHalfAndHalfState()
    } else {
      setSelectedToppings([]) // Limpar toppings normais
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-product-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar: {product?.productNumber ? `${product.productNumber} - ${product.name}` : (product?.name || 'Produto')}
            {isPizza && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                <Pizza className="w-3 h-3 mr-1" />
                Pizza
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription id="edit-product-modal-description">
            Edite as configurações do produto no seu carrinho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Renderizar imagem apenas se showImage for true */}
          {product?.showImage && product?.image && (
            <div className="h-[150px] overflow-hidden rounded-lg">
              <img src={product.image || "/default-image.svg"} alt={product.name || 'Produto'} className="w-full h-full object-cover" />
            </div>
          )}

          {product?.description && <p className="text-gray-600">{product.description}</p>}

          {/* Opção Pizza Meio a Meio - apenas para pizzas */}
          {isPizza && (
            <div className={`border-2 rounded-lg p-4 transition-all duration-200 ${
              isHalfAndHalf 
                ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300 shadow-md' 
                : 'bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="half-and-half"
                  checked={isHalfAndHalf}
                  onCheckedChange={handleHalfAndHalfToggle}
                  className="border-2"
                />
                <Label htmlFor="half-and-half" className="text-base font-bold text-blue-800 cursor-pointer flex items-center gap-2">
                  <span className="text-xl">🍕</span>
                  Pizza Meio a Meio (2 Sabores)
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white animate-pulse">
                    Popular!
                  </Badge>
                </Label>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-blue-700 font-medium">
                  ✨ Escolha dois sabores diferentes para sua pizza
                </p>
                <p className="text-xs text-blue-600">
                  💰 O preço será a média dos dois sabores selecionados + adicionais
                </p>
              </div>
              {isHalfAndHalf && (
                <div className="mt-3 p-2 bg-white rounded border border-orange-200">
                  <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    Modo Meio a Meio Ativado - Configure os sabores abaixo
                  </p>
                </div>
              )}
            </div>
          )}

          {product?.sizes && product.sizes.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Escolha o tamanho</Label>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                {product.sizes.map((size) => (
                  <div key={size.name} className="flex items-center space-x-2">
                    <RadioGroupItem value={size.name} id={size.name} />
                    <Label htmlFor={size.name} className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span>{size.name}</span>
                        <span className="font-semibold">{formatCurrency(size.price)}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Seleção de sabores - Normal ou Meio a Meio */}
          {isHalfAndHalf ? (
            <div className="space-y-4 bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <Pizza className="w-5 h-5 text-orange-600" />
                <Label className="text-base font-bold text-orange-800">Configure sua Pizza Meio a Meio</Label>
              </div>
              
              {/* Seleção do segundo sabor */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-orange-700">
                  Primeiro sabor: <span className="font-bold">{product?.name || 'Pizza'}</span>
                </Label>
                <Label className="text-sm font-medium text-orange-700">Segundo sabor:</Label>
                <Select value={secondHalfProduct} onValueChange={setSecondHalfProduct}>
                  <SelectTrigger className="border-orange-200 focus:border-orange-400">
                    <SelectValue placeholder="Selecione o segundo sabor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePizzas.map((pizza) => (
                      <SelectItem key={pizza.id} value={pizza.id}>
                        {pizza.productNumber ? `${pizza.productNumber} - ${pizza.name}` : pizza.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Navegação para adicionais */}
              {secondHalfProduct && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                      <span className="text-lg">🧄</span>
                      Escolha os Adicionais para cada Metade
                    </h4>
                    
                    {/* Botões de navegação */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <Button
                        type="button"
                        variant={activeToppingsTab === 'first' ? 'default' : 'outline'}
                        onClick={() => setActiveToppingsTab('first')}
                        className={`w-full text-sm font-medium p-3 h-auto flex flex-col items-center gap-1 ${
                          activeToppingsTab === 'first' 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                            : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                      >
                        <span className="text-xs opacity-80">1ª Metade</span>
                        <span className="font-bold text-center leading-tight">
                          {(() => {
                            const name = product?.name || 'Pizza'
                            return name.length > 14 ? name.substring(0, 14) + "..." : name
                          })()}
                        </span>
                        {firstHalfToppings.length > 0 && (
                          <Badge variant="secondary" className="text-xs bg-white/20 text-current">
                            {firstHalfToppings.length} item{firstHalfToppings.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant={activeToppingsTab === 'second' ? 'default' : 'outline'}
                        onClick={() => setActiveToppingsTab('second')}
                        className={`w-full text-sm font-medium p-3 h-auto flex flex-col items-center gap-1 ${
                          activeToppingsTab === 'second' 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                            : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                      >
                        <span className="text-xs opacity-80">2ª Metade</span>
                        <span className="font-bold text-center leading-tight">
                          {(() => {
                            const secondName = availablePizzas.find(p => p.id === secondHalfProduct)?.name || ''
                            return secondName.length > 14 ? secondName.substring(0, 14) + "..." : secondName
                          })()}
                        </span>
                        {secondHalfToppings.length > 0 && (
                          <Badge variant="secondary" className="text-xs bg-white/20 text-current">
                            {secondHalfToppings.length} item{secondHalfToppings.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </Button>
                    </div>

                    {/* Conteúdo dos adicionais */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      {activeToppingsTab === 'first' ? (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            Adicionais para: {product?.name || 'Pizza'}
                          </h5>
                          {product?.toppings && product.toppings.length > 0 ? (
                            <div className="space-y-3">
                              {product.toppings.map((topping) => (
                                <div key={topping.name} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`first-${topping.name}`}
                                    checked={firstHalfToppings.includes(topping.name)}
                                    onCheckedChange={(checked) => handleToppingChange(topping.name, checked as boolean, false)}
                                  />
                                  <Label htmlFor={`first-${topping.name}`} className="flex-1 cursor-pointer">
                                    <div className="flex justify-between">
                                      <span>{topping.name}</span>
                                      <span className="font-semibold">+ {formatCurrency(topping.price / 2)}</span>
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">Nenhum adicional disponível para este sabor</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {(() => {
                            const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
                            return (
                              <div>
                                <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                  Adicionais para: {secondProduct?.name || 'Pizza'}
                                </h5>
                                {secondProduct?.toppings && secondProduct.toppings.length > 0 ? (
                                  <div className="space-y-3">
                                    {secondProduct.toppings.map((topping) => (
                                      <div key={topping.name} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`second-${topping.name}`}
                                          checked={secondHalfToppings.includes(topping.name)}
                                          onCheckedChange={(checked) => handleToppingChange(topping.name, checked as boolean, true)}
                                        />
                                        <Label htmlFor={`second-${topping.name}`} className="flex-1 cursor-pointer">
                                          <div className="flex justify-between">
                                            <span>{topping.name}</span>
                                            <span className="font-semibold">+ {formatCurrency(topping.price / 2)}</span>
                                          </div>
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">Nenhum adicional disponível para este sabor</p>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Adicionais normais */
            product?.toppings && product.toppings.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Adicionais (opcionais)</Label>
                <div className="space-y-3">
                  {product.toppings.map((topping) => (
                    <div key={topping.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={topping.name}
                        checked={selectedToppings.includes(topping.name)}
                        onCheckedChange={(checked) => handleToppingChange(topping.name, checked as boolean)}
                      />
                      <Label htmlFor={topping.name} className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <span>{topping.name}</span>
                          <span className="font-semibold">+ {formatCurrency(topping.price)}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Campo de Observações */}
          <div>
            <Label htmlFor="notes" className="text-base font-semibold mb-3 block">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma observação sobre seu pedido? Ex: tirar cebola, maionese à parte, etc."
              maxLength={140}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {notes.length}/140 caracteres
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Label className="font-semibold">Quantidade:</Label>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalPrice)}
              </div>
            </div>
          </div>

          <Button onClick={handleUpdateItem} className="w-full">
            Atualizar Item - {formatCurrency(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
