"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Coupon {
  id: string
  title: string
  description: string
  discount: string
  expires_at: string
  is_used: boolean
  is_expired: boolean
  is_max_uses_reached: boolean
  min_value: number
  discount_type: 'percentage' | 'fixed' | 'free_delivery'
  discount_value: number
  
  // Compatibilidade com versões antigas (deprecated)
  /** @deprecated Use expires_at */
  expiresAt?: string
  /** @deprecated Use is_used */
  isUsed?: boolean
  /** @deprecated Use is_expired */
  isExpired?: boolean
  /** @deprecated Use is_max_uses_reached */
  isMaxUsesReached?: boolean
  /** @deprecated Use min_value */
  minValue?: number
  /** @deprecated Use discount_type */
  discountType?: 'percentage' | 'fixed' | 'free_delivery'
  /** @deprecated Use discount_value */
  discountValue?: number
}

interface AppliedCoupon {
  code: string
  type: 'percentage' | 'fixed' | 'free_delivery'
  value: number
}

interface CouponContextType {
  available_coupons: Coupon[]
  applied_coupon: AppliedCoupon | null
  is_loading: boolean
  error: string | null
  fetch_coupons: (userId: string) => Promise<void>
  apply_coupon: (userId: string, couponCode: string, orderId?: string) => Promise<boolean>
  remove_coupon: () => void
  
  // Compatibilidade com versões antigas (deprecated)
  /** @deprecated Use available_coupons */
  availableCoupons: Coupon[]
  /** @deprecated Use applied_coupon */
  appliedCoupon: AppliedCoupon | null
  /** @deprecated Use is_loading */
  isLoading: boolean
  /** @deprecated Use fetch_coupons */
  fetchCoupons: (userId: string) => Promise<void>
  /** @deprecated Use apply_coupon */
  applyCoupon: (userId: string, couponCode: string, orderId?: string) => Promise<boolean>
  /** @deprecated Use remove_coupon */
  removeCoupon: () => void
}

const CouponContext = createContext<CouponContextType | undefined>(undefined)

export function CouponProvider({ children }: { children: ReactNode }) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Garantir que o componente foi montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Carregar cupom aplicado do localStorage ao montar
  useEffect(() => {
    if (!mounted) return // Aguardar montagem no cliente
    
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon))
      } catch (error) {
        console.warn('Erro ao carregar cupom do localStorage:', error)
        localStorage.removeItem("appliedCoupon")
      }
    }
  }, [mounted])

  // Salvar cupom aplicado no localStorage quando mudar
  useEffect(() => {
    if (!mounted) return // Não salvar antes da montagem
    
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon))
    } else {
      localStorage.removeItem("appliedCoupon")
    }
  }, [appliedCoupon, mounted])

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
        // Nomenclaturas padronizadas (snake_case)
        available_coupons: availableCoupons,
        applied_coupon: appliedCoupon,
        is_loading: isLoading,
        error,
        fetch_coupons: fetchCoupons,
        apply_coupon: applyCoupon,
        remove_coupon: removeCoupon,
        
        // Compatibilidade com versões antigas (camelCase - deprecated)
        availableCoupons,
        appliedCoupon,
        isLoading,
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