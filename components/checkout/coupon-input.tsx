"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCoupon } from "@/contexts/coupon-context"
import { AlertCircle, CheckCircle2, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CouponInputProps {
  userId: string
  subtotal: number
}

export function CouponInput({ userId, subtotal }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("")
  const { appliedCoupon, applyCoupon, removeCoupon, isLoading, error } = useCoupon()

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    await applyCoupon(userId, couponCode.trim())
  }

  return (
    <div className="space-y-2">
      {!appliedCoupon ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleApplyCoupon} 
              disabled={!couponCode.trim() || isLoading}
              className="whitespace-nowrap"
              variant="outline"
            >
              {isLoading ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">Cupom aplicado: {appliedCoupon.code}</p>
              <p className="text-xs text-gray-600">
                {appliedCoupon.type === 'percentage' && `${appliedCoupon.value}% de desconto`}
                {appliedCoupon.type === 'fixed' && `R$ ${appliedCoupon.value.toFixed(2)} de desconto`}
                {appliedCoupon.type === 'free_delivery' && 'Frete grátis'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={removeCoupon}
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}