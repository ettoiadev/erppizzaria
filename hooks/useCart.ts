import { useState } from "react"
import { CartItem } from "@/components/admin/pdv/types"

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
      
      // Nota: Adicionais não estão implementados no tipo CartItem atual
      
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