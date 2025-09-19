import { useState } from 'react'
import { CartItem } from '../types'

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addItemToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(cartItem => {
        if (cartItem.isHalfAndHalf && item.isHalfAndHalf) {
          return (
            cartItem.id === item.id &&
            cartItem.size === item.size &&
            cartItem.halfAndHalf?.firstHalf.productId === item.halfAndHalf?.firstHalf.productId &&
            cartItem.halfAndHalf?.secondHalf.productId === item.halfAndHalf?.secondHalf.productId &&
            JSON.stringify(cartItem.halfAndHalf?.firstHalf.toppings?.sort()) === JSON.stringify(item.halfAndHalf?.firstHalf.toppings?.sort()) &&
            JSON.stringify(cartItem.halfAndHalf?.secondHalf.toppings?.sort()) === JSON.stringify(item.halfAndHalf?.secondHalf.toppings?.sort()) &&
            cartItem.notes === item.notes
          )
        } else {
          return (
            cartItem.id === item.id &&
            cartItem.size === item.size &&
            JSON.stringify(cartItem.toppings?.sort()) === JSON.stringify(item.toppings?.sort()) &&
            cartItem.notes === item.notes &&
            !cartItem.isHalfAndHalf &&
            !item.isHalfAndHalf
          )
        }
      })

      if (existingItemIndex > -1) {
        const updatedItems = [...prev]
        updatedItems[existingItemIndex].quantity += item.quantity
        return updatedItems
      } else {
        return [...prev, item]
      }
    })
  }

  const removeItemFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCart(index)
      return
    }
    
    setCartItems(prev => {
      const updatedItems = [...prev]
      updatedItems[index].quantity = quantity
      return updatedItems
    })
  }

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    return {
      subtotal,
      total: subtotal
    }
  }

  const clearCart = () => {
    setCartItems([])
  }

  return {
    cartItems,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    calculateTotal,
    clearCart
  }
}