import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    // Buscar cupons válidos e disponíveis para o usuário usando PostgreSQL
    const couponsResult = await query(`
      SELECT 
        c.id,
        c.code,
        c.title,
        c.description,
        c.discount_type,
        c.discount_value,
        c.min_order_value,
        c.valid_from,
        c.valid_until,
        c.active,
        c.max_uses,
        c.current_uses,
        uc.id as user_coupon_id,
        uc.used_at
      FROM coupons c
      LEFT JOIN user_coupons uc ON c.id = uc.coupon_id AND uc.user_id = $1
      WHERE c.active = true
        AND c.valid_until >= NOW()
        AND c.valid_from <= NOW()
      ORDER BY c.created_at DESC
    `, [userId])

    const coupons = couponsResult.rows

    // Processar cupons para verificar se já foram usados pelo usuário
    const processedCoupons = coupons?.map(coupon => {
      const isUsed = !!coupon.user_coupon_id
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

  } catch (error) {
    console.error('Erro na API de cupons:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, couponCode, orderId } = await request.json()

    if (!userId || !couponCode) {
      return NextResponse.json({ error: 'User ID e código do cupom são obrigatórios' }, { status: 400 })
    }

    // Verificar se o cupom existe e é válido usando PostgreSQL
    const couponResult = await query(`
      SELECT * FROM coupons 
      WHERE code = $1 
        AND active = true 
        AND valid_until >= NOW() 
        AND valid_from <= NOW()
    `, [couponCode])

    if (couponResult.rows.length === 0) {
      return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 400 })
    }

    const coupon = couponResult.rows[0]

    // Verificar se o usuário já usou este cupom
    const existingUsageResult = await query(`
      SELECT id FROM user_coupons 
      WHERE user_id = $1 AND coupon_id = $2
    `, [userId, coupon.id])

    if (existingUsageResult.rows.length > 0) {
      return NextResponse.json({ error: 'Cupom já foi utilizado' }, { status: 400 })
    }

    // Verificar limite de uso
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
    }

    // Registrar uso do cupom
    await query(`
      INSERT INTO user_coupons (user_id, coupon_id, order_id)
      VALUES ($1, $2, $3)
    `, [userId, coupon.id, orderId || null])

    // Atualizar contador de uso do cupom
    await query(`
      UPDATE coupons 
      SET current_uses = current_uses + 1 
      WHERE id = $1
    `, [coupon.id])

    return NextResponse.json({ 
      success: true,
      message: 'Cupom aplicado com sucesso',
      discount: {
        type: coupon.discount_type,
        value: coupon.discount_value
      }
    })

  } catch (error) {
    console.error('Erro ao aplicar cupom:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 