import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Minus, Pizza, AlertCircle } from "lucide-react"
import { Product, CartItem } from '../types'
import Image from 'next/image'

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (item: CartItem) => void
  formatCurrency: (value: number) => string
}

export function ProductModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  formatCurrency
}: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [productNotes, setProductNotes] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false)
  const [secondHalfProduct, setSecondHalfProduct] = useState<Product | null>(null)
  const [availablePizzas, setAvailablePizzas] = useState<Product[]>([])
  const [firstHalfToppings, setFirstHalfToppings] = useState<string[]>([])
  const [secondHalfToppings, setSecondHalfToppings] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'first' | 'second'>('first')

  useEffect(() => {
    if (isOpen && product) {
      setSelectedSize(product.sizes?.[0]?.name || '')
      setSelectedToppings([])
      setProductNotes('')
      setQuantity(1)
      setIsHalfAndHalf(false)
      setSecondHalfProduct(null)
      setFirstHalfToppings([])
      setSecondHalfToppings([])
      setActiveTab('first')

      if (product.category_name?.toLowerCase().includes('pizza')) {
        fetchAvailablePizzas()
      }
    }
  }, [isOpen, product])

  const fetchAvailablePizzas = async () => {
    try {
      const response = await fetch('/api/products?category=pizza')
      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.products || [])
        setAvailablePizzas(products.filter((p: Product) => p.available))
      }
    } catch (error) {
      console.error('Erro ao carregar pizzas:', error)
    }
  }

  const calculateProductPrice = () => {
    if (!product) return 0

    let basePrice = product.price
    
    if (selectedSize && product.sizes) {
      const sizePrice = product.sizes.find(size => size.name === selectedSize)?.price || 0
      basePrice = sizePrice
    }

    if (isHalfAndHalf && secondHalfProduct) {
      let secondHalfPrice = secondHalfProduct.price
      if (selectedSize && secondHalfProduct.sizes) {
        const secondSizePrice = secondHalfProduct.sizes.find(size => size.name === selectedSize)?.price || 0
        secondHalfPrice = secondSizePrice
      }
      basePrice = Math.max(basePrice, secondHalfPrice)

      if (product.toppings) {
        const firstHalfToppingsPrice = firstHalfToppings.reduce((total, toppingName) => {
          const topping = product.toppings?.find(t => t.name === toppingName)
          return total + (topping?.price || 0)
        }, 0)
        basePrice += firstHalfToppingsPrice
      }

      if (secondHalfProduct.toppings) {
        const secondHalfToppingsPrice = secondHalfToppings.reduce((total, toppingName) => {
          const topping = secondHalfProduct.toppings?.find(t => t.name === toppingName)
          return total + (topping?.price || 0)
        }, 0)
        basePrice += secondHalfToppingsPrice
      }
    } else {
      if (product.toppings) {
        const toppingsPrice = selectedToppings.reduce((total, toppingName) => {
          const topping = product.toppings?.find(t => t.name === toppingName)
          return total + (topping?.price || 0)
        }, 0)
        basePrice += toppingsPrice
      }
    }

    return basePrice
  }

  const handleToppingToggle = (toppingName: string, checked: boolean) => {
    if (isHalfAndHalf) {
      if (activeTab === 'first') {
        setFirstHalfToppings(prev => 
          checked 
            ? [...prev, toppingName]
            : prev.filter(t => t !== toppingName)
        )
      } else {
        setSecondHalfToppings(prev => 
          checked 
            ? [...prev, toppingName]
            : prev.filter(t => t !== toppingName)
        )
      }
    } else {
      setSelectedToppings(prev => 
        checked 
          ? [...prev, toppingName]
          : prev.filter(t => t !== toppingName)
      )
    }
  }

  const resetHalfAndHalf = () => {
    setSecondHalfProduct(null)
    setFirstHalfToppings([])
    setSecondHalfToppings([])
    setActiveTab('first')
  }

  const toggleHalfAndHalf = () => {
    setIsHalfAndHalf(!isHalfAndHalf)
    if (!isHalfAndHalf) {
      setFirstHalfToppings(selectedToppings)
      setSelectedToppings([])
    } else {
      resetHalfAndHalf()
      setSelectedToppings(firstHalfToppings)
      setFirstHalfToppings([])
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    const totalPrice = calculateProductPrice()

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: totalPrice,
      quantity,
      image: product.image,
      size: selectedSize || undefined,
      toppings: isHalfAndHalf ? undefined : selectedToppings,
      notes: productNotes || undefined,
      isHalfAndHalf,
      halfAndHalf: isHalfAndHalf && secondHalfProduct ? {
        firstHalf: {
          productId: product.id,
          productName: product.name,
          toppings: firstHalfToppings
        },
        secondHalf: {
          productId: secondHalfProduct.id,
          productName: secondHalfProduct.name,
          toppings: secondHalfToppings
        }
      } : undefined
    }

    onAddToCart(cartItem)
    onClose()
  }

  if (!product) return null

  const totalPrice = calculateProductPrice()
  const isPizza = product.category_name?.toLowerCase().includes('pizza')
  const currentToppings = isHalfAndHalf 
    ? (activeTab === 'first' ? firstHalfToppings : secondHalfToppings)
    : selectedToppings
  const currentProduct = isHalfAndHalf && activeTab === 'second' ? secondHalfProduct : product

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product.showImage && product.image && (
              <div className="relative w-8 h-8 rounded overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {isPizza && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="half-and-half"
                  checked={isHalfAndHalf}
                  onCheckedChange={toggleHalfAndHalf}
                />
                <Label htmlFor="half-and-half" className="flex items-center gap-2 cursor-pointer">
                  <Pizza className="h-4 w-4" />
                  Pizza Meio a Meio
                </Label>
              </div>

              {isHalfAndHalf && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Segundo Sabor</Label>
                    <Select value={secondHalfProduct?.id || ''} onValueChange={(value) => {
                      const pizza = availablePizzas.find(p => p.id === value)
                      setSecondHalfProduct(pizza || null)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o segundo sabor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePizzas.filter(p => p.id !== product.id).map((pizza) => (
                          <SelectItem key={pizza.id} value={pizza.id}>
                            {pizza.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {secondHalfProduct && (
                    <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                      <Button
                        variant={activeTab === 'first' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('first')}
                        className="flex-1"
                      >
                        {product.name}
                      </Button>
                      <Button
                        variant={activeTab === 'second' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('second')}
                        className="flex-1"
                      >
                        {secondHalfProduct.name}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  {product.sizes.map((size) => (
                    <SelectItem key={size.name} value={size.name}>
                      {size.name} - {formatCurrency(size.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentProduct?.toppings && currentProduct.toppings.length > 0 && (
            <div className="space-y-2">
              <Label>
                Adicionais {isHalfAndHalf && `- ${activeTab === 'first' ? product.name : secondHalfProduct?.name}`}
              </Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {currentProduct.toppings.map((topping) => (
                  <div key={topping.name} className="flex items-center justify-between space-x-2 p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${activeTab}-${topping.name}`}
                        checked={currentToppings.includes(topping.name)}
                        onCheckedChange={(checked) => handleToppingToggle(topping.name, checked as boolean)}
                      />
                      <Label htmlFor={`${activeTab}-${topping.name}`} className="cursor-pointer">
                        {topping.name}
                      </Label>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      +{formatCurrency(topping.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="product-notes">Observações</Label>
            <Textarea
              id="product-notes"
              placeholder="Observações especiais para este item..."
              value={productNotes}
              onChange={(e) => setProductNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label>Quantidade:</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{formatCurrency(totalPrice)}</div>
              {isHalfAndHalf && secondHalfProduct && (
                <p className="text-xs text-orange-600 font-medium">Baseado no maior valor entre os sabores</p>
              )}
            </div>
          </div>

          {isHalfAndHalf && !secondHalfProduct && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecione o segundo sabor para continuar.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleAddToCart} 
            className="w-full h-14 text-lg font-bold"
            disabled={isHalfAndHalf && !secondHalfProduct}
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar ao Pedido - {formatCurrency(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}