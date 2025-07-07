import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    // Buscar cupons válidos e disponíveis para o usuário
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select(`
        id,
        code,
        title,
        description,
        discount_type,
        discount_value,
        min_order_value,
        valid_from,
        valid_until,
        active,
        max_uses,
        current_uses,
        user_coupons!left (
          id,
          used_at
        )
      `)
      .eq('active', true)
      .gte('valid_until', new Date().toISOString())
      .lte('valid_from', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar cupons:', error)
      return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 })
    }

    // Processar cupons para verificar se já foram usados pelo usuário
    const processedCoupons = coupons?.map(coupon => {
      const userUsage = coupon.user_coupons?.find((uc: any) => uc.user_id === userId)
      const isUsed = !!userUsage
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

    // Verificar se o cupom existe e é válido
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .eq('active', true)
      .gte('valid_until', new Date().toISOString())
      .lte('valid_from', new Date().toISOString())
      .single()

    if (couponError || !coupon) {
      return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 400 })
    }

    // Verificar se o usuário já usou este cupom
    const { data: existingUsage } = await supabase
      .from('user_coupons')
      .select('id')
      .eq('user_id', userId)
      .eq('coupon_id', coupon.id)
      .single()

    if (existingUsage) {
      return NextResponse.json({ error: 'Cupom já foi utilizado' }, { status: 400 })
    }

    // Verificar limite de uso
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
    }

    // Registrar uso do cupom
    const { error: usageError } = await supabase
      .from('user_coupons')
      .insert({
        user_id: userId,
        coupon_id: coupon.id,
        order_id: orderId || null
      })

    if (usageError) {
      console.error('Erro ao registrar uso do cupom:', usageError)
      return NextResponse.json({ error: 'Erro ao aplicar cupom' }, { status: 500 })
    }

    // Atualizar contador de uso do cupom
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ current_uses: coupon.current_uses + 1 })
      .eq('id', coupon.id)

    if (updateError) {
      console.error('Erro ao atualizar contador do cupom:', updateError)
    }

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