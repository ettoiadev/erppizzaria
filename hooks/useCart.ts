import { useState } from "react"
import { CartItem } from "@/types/manual-order"

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item])
  }

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }
    
    setCartItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      let itemTotal = item.price * item.quantity
      
      // Adicionar preço dos adicionais
      if (item.additionals) {
        itemTotal += item.additionals.reduce((addTotal, additional) => 
          addTotal + (additional.price * item.quantity), 0
        )
      }
      
      return total + itemTotal
    }, 0)
  }

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  }
}