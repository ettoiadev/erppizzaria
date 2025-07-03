"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { CartItem } from "@/types"

interface CartContextType {
  items: CartItem[]
  total: number
  itemCount: number
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  removeItemByIndex: (index: number) => void
  updateQuantity: (id: string, quantity: number) => void
  updateQuantityByIndex: (index: number, quantity: number) => void
  updateItemByIndex: (index: number, newItem: CartItem) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = (newItem: CartItem) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          item.id === newItem.id &&
          item.size === newItem.size &&
          JSON.stringify(item.toppings) === JSON.stringify(newItem.toppings) &&
          item.isHalfAndHalf === newItem.isHalfAndHalf &&
          JSON.stringify(item.halfAndHalf) === JSON.stringify(newItem.halfAndHalf)
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item === existingItem ? { ...item, quantity: item.quantity + newItem.quantity } : item,
        )
      }

      return [...currentItems, newItem]
    })
  }

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const removeItemByIndex = (index: number) => {
    setItems((currentItems) => currentItems.filter((_, i) => i !== index))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const updateQuantityByIndex = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemByIndex(index)
      return
    }

    setItems((currentItems) => currentItems.map((item, i) => (i === index ? { ...item, quantity } : item)))
  }

  const updateItemByIndex = (index: number, newItem: CartItem) => {
    setItems((currentItems) => currentItems.map((item, i) => (i === index ? newItem : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        addItem,
        removeItem,
        removeItemByIndex,
        updateQuantity,
        updateQuantityByIndex,
        updateItemByIndex,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
