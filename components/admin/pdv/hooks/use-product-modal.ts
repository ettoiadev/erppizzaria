import { useState, useEffect } from 'react'
import { Product, CartItem } from '../types'

export function useProductModal() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
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

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
    setSelectedSize(product.sizes?.[0]?.name || '')
    setSelectedToppings([])
    setProductNotes('')
    setQuantity(1)
    setIsHalfAndHalf(false)
    setSecondHalfProduct(null)
    setFirstHalfToppings([])
    setSecondHalfToppings([])
    setActiveTab('first')
  }

  const closeProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProduct(null)
    setSelectedSize('')
    setSelectedToppings([])
    setProductNotes('')
    setQuantity(1)
    setIsHalfAndHalf(false)
    setSecondHalfProduct(null)
    setFirstHalfToppings([])
    setSecondHalfToppings([])
    setActiveTab('first')
  }

  const fetchAvailablePizzas = async () => {
    try {
      const response = await fetch('/api/products?category=pizza')
      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.products || [])
        setAvailablePizzas(products.filter((product: Product) => product.available))
      }
    } catch (error) {
      console.error('Erro ao carregar pizzas:', error)
    }
  }

  useEffect(() => {
    if (isProductModalOpen && selectedProduct?.category_name?.toLowerCase().includes('pizza')) {
      fetchAvailablePizzas()
    }
  }, [isProductModalOpen, selectedProduct])

  const calculateProductPrice = () => {
    if (!selectedProduct) return 0

    let basePrice = selectedProduct.price
    
    // Preço do tamanho
    if (selectedSize && selectedProduct.sizes) {
      const sizePrice = selectedProduct.sizes.find(size => size.name === selectedSize)?.price || 0
      basePrice = sizePrice
    }

    if (isHalfAndHalf && secondHalfProduct) {
      // Para pizza meio a meio, usar o maior preço entre os dois sabores
      let secondHalfPrice = secondHalfProduct.price
      if (selectedSize && secondHalfProduct.sizes) {
        const secondSizePrice = secondHalfProduct.sizes.find(size => size.name === selectedSize)?.price || 0
        secondHalfPrice = secondSizePrice
      }
      basePrice = Math.max(basePrice, secondHalfPrice)

      // Adicionar preço dos adicionais da primeira metade
      if (selectedProduct.toppings) {
        const firstHalfToppingsPrice = firstHalfToppings.reduce((total, toppingName) => {
          const topping = selectedProduct.toppings?.find(t => t.name === toppingName)
          return total + (topping?.price || 0)
        }, 0)
        basePrice += firstHalfToppingsPrice
      }

      // Adicionar preço dos adicionais da segunda metade
      if (secondHalfProduct.toppings) {
        const secondHalfToppingsPrice = secondHalfToppings.reduce((total, toppingName) => {
          const topping = secondHalfProduct.toppings?.find(t => t.name === toppingName)
          return total + (topping?.price || 0)
        }, 0)
        basePrice += secondHalfToppingsPrice
      }
    } else {
      // Preço dos adicionais normais
      if (selectedProduct.toppings) {
        const toppingsPrice = selectedToppings.reduce((total, toppingName) => {
          const topping = selectedProduct.toppings?.find(t => t.name === toppingName)
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
      // Ao ativar meio a meio, mover os toppings atuais para a primeira metade
      setFirstHalfToppings(selectedToppings)
      setSelectedToppings([])
    } else {
      // Ao desativar meio a meio, limpar dados específicos
      resetHalfAndHalf()
      setSelectedToppings(firstHalfToppings)
      setFirstHalfToppings([])
    }
  }

  const handleAddToCart = (onAddToCart: (item: CartItem) => void) => {
    if (!selectedProduct) return

    const totalPrice = calculateProductPrice()

    const cartItem: CartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: totalPrice,
      quantity,
      image: selectedProduct.image,
      size: selectedSize || undefined,
      toppings: isHalfAndHalf ? undefined : selectedToppings,
      notes: productNotes || undefined,
      isHalfAndHalf,
      halfAndHalf: isHalfAndHalf && secondHalfProduct ? {
        firstHalf: {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
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
    closeProductModal()
  }

  return {
    selectedProduct,
    isProductModalOpen,
    selectedSize,
    setSelectedSize,
    selectedToppings,
    productNotes,
    setProductNotes,
    quantity,
    setQuantity,
    isHalfAndHalf,
    secondHalfProduct,
    setSecondHalfProduct,
    availablePizzas,
    firstHalfToppings,
    secondHalfToppings,
    activeTab,
    setActiveTab,
    openProductModal,
    closeProductModal,
    calculateProductPrice,
    handleToppingToggle,
    toggleHalfAndHalf,
    handleAddToCart
  }
}