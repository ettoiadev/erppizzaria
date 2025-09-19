import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { withValidation } from '@/lib/validation-utils'
import { withDatabaseErrorHandling } from '@/lib/error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { couponSchema } from '@/lib/validation-schemas'

// Handler GET para buscar cupons (sem middlewares)
async function getCouponsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    const couponsResult = await query(`
      SELECT 
        c.id, c.code, c.title, c.description, c.discount_type, c.discount_value, 
        c.min_order_value, c.valid_from, c.valid_until, c.active, c.max_uses, c.current_uses,
        COALESCE(
          json_agg(
            json_build_object('id', uc.id, 'user_id', uc.user_id, 'used_at', uc.used_at)
          ) FILTER (WHERE uc.id IS NOT NULL), 
          '[]'::json
        ) as user_coupons
      FROM coupons c
      LEFT JOIN user_coupons uc ON c.id = uc.coupon_id
      WHERE c.active = true 
        AND c.valid_until >= $1 
        AND c.valid_from <= $2
      GROUP BY c.id, c.code, c.title, c.description, c.discount_type, c.discount_value, 
               c.min_order_value, c.valid_from, c.valid_until, c.active, c.max_uses, c.current_uses, c.created_at
      ORDER BY c.created_at DESC
    `, [new Date(), new Date()])
    
    const coupons = couponsResult.rows

    // Processar cupons para verificar se já foram usados pelo usuário
    const processedCoupons = coupons?.map((coupon: any) => {
      const isUsed = Array.isArray(coupon.user_coupons) && coupon.user_coupons.some((uc: any) => uc.user_id === userId)
      const isExpired = new Date(coupon.valid_until) < new Date()
      const isMaxUsesReached = coupon.max_uses && coupon.current_uses >= coupon.max_uses

      return {
        id: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discount: coupon.discount_type === 'percentage' 
          ? `${coupon.discount_value}%`
          : coupon.discount_type === 'free_delivery'
          ? 'Frete Grátis'
          : `R$ ${coupon.discount_value?.toFixed(2)}`,
        expiresAt: coupon.valid_until,
        isUsed,
        isExpired,
        isMaxUsesReached,
        minValue: coupon.min_order_value,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value
      }
    }) || []

    return NextResponse.json({ coupons: processedCoupons })

  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler POST para aplicar cupom (sem middlewares)
async function applyCouponHandler(request: NextRequest, validatedData: any): Promise<NextResponse> {
  try {
    const { userId, couponCode, orderId } = validatedData

    const couponResult = await query(`
      SELECT * FROM coupons 
      WHERE code = $1 
        AND active = true 
        AND valid_until >= $2 
        AND valid_from <= $3
    `, [couponCode, new Date(), new Date()])
    
    if (couponResult.rows.length === 0) {
      return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 400 })
    }
    
    const coupon = couponResult.rows[0]

    // Verificar se o usuário já usou este cupom
    const existingResult = await query(
      'SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_id = $2',
      [userId, coupon.id]
    )
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Cupom já foi utilizado' }, { status: 400 })
    }

    // Verificar limite de uso
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
    }

    // Registrar uso do cupom
    await query(
      'INSERT INTO user_coupons (user_id, coupon_id, order_id) VALUES ($1, $2, $3)',
      [userId, coupon.id, orderId || null]
    )

    // Atualizar contador de uso do cupom
    await query(
      'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1',
      [coupon.id]
    )

    return NextResponse.json({ 
      success: true,
      message: 'Cupom aplicado com sucesso',
      discount: {
        type: coupon.discount_type,
        value: coupon.discount_value
      }
    })

  } catch (error: any) {
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET
export const GET = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getCouponsHandler
    )
  )
)

// Aplicar middlewares para POST
export const POST = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('public', {},
      withPresetSanitization('userForm', {},
        withValidation(couponSchema,
          withDatabaseErrorHandling(
            applyCouponHandler,
            {
              customErrorMessages: {
                unique_violation: 'Cupom já foi utilizado',
                foreign_key_violation: 'Cupom ou usuário não encontrado'
              }
            }
          )
        )
      )
    )
  )
)