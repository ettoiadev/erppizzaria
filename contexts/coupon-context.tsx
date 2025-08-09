"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Coupon {
  id: string
  title: string
  description: string
  discount: string
  expiresAt: string
  isUsed: boolean
  isExpired: boolean
  isMaxUsesReached: boolean
  minValue: number
  discountType: 'percentage' | 'fixed' | 'free_delivery'
  discountValue: number
}

interface AppliedCoupon {
  code: string
  type: 'percentage' | 'fixed' | 'free_delivery'
  value: number
}

interface CouponContextType {
  availableCoupons: Coupon[]
  appliedCoupon: AppliedCoupon | null
  isLoading: boolean
  error: string | null
  fetchCoupons: (userId: string) => Promise<void>
  applyCoupon: (userId: string, couponCode: string, orderId?: string) => Promise<boolean>
  removeCoupon: () => void
}

const CouponContext = createContext<CouponContextType | undefined>(undefined)

export function CouponProvider({ children }: { children: ReactNode }) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar cupom aplicado do localStorage ao montar
  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      setAppliedCoupon(JSON.parse(savedCoupon))
    }
  }, [])

  // Salvar cupom aplicado no localStorage quando mudar
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon))
    } else {
      localStorage.removeItem("appliedCoupon")
    }
  }, [appliedCoupon])

  const fetchCoupons = async (userId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/coupons?userId=${userId}`)
      if (!response.ok) {
        throw new Error(`Erro ao buscar cupons: ${response.status}`)
      }
      const data = await response.json()
      setAvailableCoupons(data.coupons || [])
    } catch (err) {
      console.error('Erro ao buscar cupons:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar cupons')
    } finally {
      setIsLoading(false)
    }
  }

  const applyCoupon = async (userId: string, couponCode: string, orderId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, couponCode, orderId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aplicar cupom')
      }

      setAppliedCoupon({
        code: couponCode,
        type: data.discount.type,
        value: data.discount.value
      })
      return true
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao aplicar cupom')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
  }

  return (
    <CouponContext.Provider
      value={{
        availableCoupons,
        appliedCoupon,
        isLoading,
        error,
        fetchCoupons,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CouponContext.Provider>
  )
}

export function useCoupon() {
  const context = useContext(CouponContext)
  if (context === undefined) {
    throw new Error("useCoupon must be used within a CouponProvider")
  }
  return context
}