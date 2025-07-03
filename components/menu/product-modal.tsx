"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Minus, Plus, User, LogIn, Pizza } from "lucide-react"
import type { Product } from "@/types"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"

interface ProductModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]?.name || "")
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [quantity, setQuantity] = useState(1)
  
  // Estados para pizza meio a meio
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false)
  const [availablePizzas, setAvailablePizzas] = useState<Product[]>([])
  const [secondHalfProduct, setSecondHalfProduct] = useState<string>("")
  const [firstHalfToppings, setFirstHalfToppings] = useState<string[]>([])
  const [secondHalfToppings, setSecondHalfToppings] = useState<string[]>([])
  
  // Estado para controlar qual aba de adicionais está ativa
  const [activeToppingsTab, setActiveToppingsTab] = useState<'first' | 'second'>('first')
  
  const { addItem } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  // Verificar se o produto é uma pizza
  const isPizza = product.name.toLowerCase().includes('pizza') || 
                  ['pizzas tradicionais', 'pizzas especiais'].some(cat => 
                    product.categoryId && cat.toLowerCase().includes('pizza'))

  // Carregar pizzas disponíveis quando o modal abrir
  useEffect(() => {
    if (isOpen && isPizza) {
      fetchAvailablePizzas()
    }
  }, [isOpen, isPizza])

  const fetchAvailablePizzas = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.products || [])
        // Filtrar apenas pizzas disponíveis, excluindo o produto atual
        const pizzas = products.filter((p: Product) => 
          p.id !== product.id && 
          p.available && 
          (p.name.toLowerCase().includes('pizza') || 
           ['pizzas tradicionais', 'pizzas especiais'].some(cat => 
             p.categoryId && cat.toLowerCase().includes('pizza')))
        )
        setAvailablePizzas(pizzas)
      }
    } catch (error) {
      console.error('Erro ao carregar pizzas:', error)
    }
  }

  const selectedSizePrice = Number(product.sizes?.find((size) => size.name === selectedSize)?.price || product.price)
  
  const toppingsPrice = isHalfAndHalf 
    ? (firstHalfToppings.reduce((total, topping) => {
        const toppingData = product.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0) + secondHalfToppings.reduce((total, topping) => {
        const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
        const toppingData = secondProduct?.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0)) / 2 // Dividir por 2 pois são metades
    : selectedToppings.reduce((total, topping) => {
        const toppingData = product.toppings?.find((t) => t.name === topping)
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

  const handleAddToCart = () => {
    if (!user) {
      onClose()
      router.push("/login")
      return
    }

    if (isHalfAndHalf && !secondHalfProduct) {
      alert("Por favor, selecione o segundo sabor para a pizza meio a meio")
      return
    }

    const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)

    // Limpar IDs dos produtos removendo caracteres inválidos
    const cleanProductId = product.id.toString().replace(/--+$/, '').trim()
    const cleanSecondProductId = secondHalfProduct ? secondHalfProduct.toString().replace(/--+$/, '').trim() : ''

    const cartItem = isHalfAndHalf 
      ? {
          id: `${cleanProductId}`, // Usar apenas o ID principal para simplificar
          name: `Pizza Meio a Meio: ${product.name} / ${secondProduct?.name}`,
          price: basePrice + toppingsPrice,
          quantity,
          image: product.image,
          size: selectedSize,
          notes: notes.trim() || undefined,
          isHalfAndHalf: true,
          halfAndHalf: {
            firstHalf: {
              productId: cleanProductId,
              productName: product.name,
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
          id: cleanProductId, // Usar ID limpo sem concatenações
          name: product.name,
          price: selectedSizePrice + toppingsPrice,
          quantity,
          image: product.image,
          size: selectedSize,
          toppings: selectedToppings,
          notes: notes.trim() || undefined,
        }

    addItem(cartItem)
    onClose()
    
    // Redirecionar para a página de checkout após adicionar ao carrinho
    router.push("/checkout")
  }

  const handleLoginRedirect = () => {
    onClose()
    router.push("/login")
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product.productNumber ? `${product.productNumber} - ${product.name}` : product.name}
            {isPizza && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                <Pizza className="w-3 h-3 mr-1" />
                Pizza
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Renderizar imagem apenas se showImage for true */}
          {product.showImage && (
            <div className="h-[150px] overflow-hidden rounded-lg">
              <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}

          <p className="text-gray-600">{product.description}</p>

          {/* Opção Pizza Meio a Meio - apenas para pizzas - COM DESTAQUE VISUAL */}
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

          {product.sizes && product.sizes.length > 0 && (
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
                  Primeiro sabor: <span className="font-bold">{product.name}</span>
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

              {/* Navegação melhorada para adicionais */}
              {secondHalfProduct && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                      <span className="text-lg">🧄</span>
                      Escolha os Adicionais para cada Metade
                    </h4>
                    
                    {/* Botões de navegação responsivos */}
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
                          {product.name.length > 14 ? product.name.substring(0, 14) + "..." : product.name}
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
                            Adicionais para: {product.name}
                          </h5>
                          {product.toppings && product.toppings.length > 0 ? (
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
                                  Adicionais para: {secondProduct?.name}
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
            product.toppings && product.toppings.length > 0 && (
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
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</div>
              {isHalfAndHalf && secondHalfProduct && (
                <p className="text-xs text-orange-600 font-medium">Preço médio dos dois sabores</p>
              )}
            </div>
          </div>

          {user ? (
            <Button onClick={handleAddToCart} className="w-full" size="lg">
              Adicionar ao Carrinho
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <User className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                Para adicionar ao carrinho, faça login ou cadastre-se
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleLoginRedirect} className="w-full" size="lg">
                  <LogIn className="w-4 h-4 mr-2" />
                  Fazer Login
                </Button>
                <Button onClick={() => { onClose(); router.push("/cadastro"); }} className="w-full" size="lg">
                  <User className="w-4 h-4 mr-2" />
                  Cadastrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 