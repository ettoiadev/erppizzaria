"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Pizza } from "lucide-react"
import { Product, CartItem } from "../pdv/types"

interface AdminProductModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: (item: CartItem) => void
}

export function AdminProductModal({ product, isOpen, onClose, onAddToCart }: AdminProductModalProps) {
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [quantity, setQuantity] = useState(1)
  
  // Estados para pizza meio a meio
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false)
  const [secondHalfProduct, setSecondHalfProduct] = useState("")
  const [firstHalfToppings, setFirstHalfToppings] = useState<string[]>([])
  const [secondHalfToppings, setSecondHalfToppings] = useState<string[]>([])
  const [availablePizzas, setAvailablePizzas] = useState<Product[]>([])
  const [activeToppingsTab, setActiveToppingsTab] = useState<'first' | 'second'>('first')

  const isPizza = product.category_name?.toLowerCase().includes('pizza')

  useEffect(() => {
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].name)
    }
  }, [product])

  useEffect(() => {
    if (isPizza && isOpen) {
      loadAvailablePizzas()
    }
  }, [isPizza, isOpen])

  const loadAvailablePizzas = async () => {
    try {
      const response = await fetch('/api/admin/products?category=pizza')
      if (response.ok) {
        const pizzas = await response.json()
        
        console.log('🍕 [ADMIN] Pizzas disponíveis carregadas:', pizzas.length)
        console.log('🍕 [ADMIN] Produto atual:', product.name)
        console.log('🍕 [ADMIN] Lista de pizzas:', pizzas.map((p: any) => p.name))
        
        setAvailablePizzas(pizzas)
      } else {
        console.error('🍕 [ADMIN] Erro na resposta da API:', response.status)
      }
    } catch (error) {
      console.error('🍕 [ADMIN] Erro ao carregar pizzas:', error)
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
      }, 0))
    : selectedToppings.reduce((total, topping) => {
        const toppingData = product.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0)

  const basePrice = isHalfAndHalf && secondHalfProduct
    ? (() => {
        const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
        const secondProductSize = secondProduct?.sizes?.find(size => size.name === selectedSize)
        const secondPrice = Number(secondProductSize?.price || secondProduct?.price || 0)
        
        // Usar o MAIOR preço entre os dois sabores, conforme solicitado
        const higherPrice = Math.max(selectedSizePrice, secondPrice)
        
        console.log('🍕 [ADMIN] Precificação meio a meio:', {
          firstSabor: product.name,
          firstPrice: selectedSizePrice,
          secondSabor: secondProduct?.name,
          secondPrice: secondPrice,
          finalPrice: higherPrice
        })
        
        return higherPrice
      })()
    : selectedSizePrice

  const totalPrice = (basePrice + toppingsPrice) * quantity

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleAddToCart = () => {
    if (isHalfAndHalf && !secondHalfProduct) {
      alert("Por favor, selecione o segundo sabor para a pizza meio a meio")
      return
    }

    const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
    const cleanProductId = product.id.toString().replace(/--+$/, '').trim()
    const cleanSecondProductId = secondHalfProduct ? secondHalfProduct.toString().replace(/--+$/, '').trim() : ''

    const cartItem = isHalfAndHalf 
      ? {
          id: `${cleanProductId}`,
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
          id: cleanProductId,
          name: product.name,
          price: selectedSizePrice + toppingsPrice,
          quantity,
          image: product.image,
          size: selectedSize,
          toppings: selectedToppings,
          notes: notes.trim() || undefined,
        }

    onAddToCart(cartItem)
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

  const getDisplayToppings = () => {
    if (isHalfAndHalf) {
      const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
      return {
        firstHalf: product.toppings || [],
        secondHalf: secondProduct?.toppings || []
      }
    }
    return { all: product.toppings || [] }
  }

  const toppings = getDisplayToppings()

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
          {product.showImage && product.image && (
            <div className="h-[150px] overflow-hidden rounded-lg">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
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
                  💰 O preço será baseado no maior valor entre os dois sabores + adicionais
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

          {/* Tamanhos */}
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
                                      <span className="font-semibold">+ {formatCurrency(topping.price)}</span>
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
                                            <span className="font-semibold">+ {formatCurrency(topping.price)}</span>
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
              placeholder="Alguma observação sobre este item..."
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
                <p className="text-xs text-orange-600 font-medium">Baseado no maior valor entre os sabores</p>
              )}
            </div>
          </div>

          <Button onClick={handleAddToCart} className="w-full">
            Adicionar ao Pedido - {formatCurrency(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}