"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
