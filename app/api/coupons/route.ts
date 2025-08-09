import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('id, code, title, description, discount_type, discount_value, min_order_value, valid_from, valid_until, active, max_uses, current_uses, user_coupons!left(id, user_id, used_at)')
      .eq('active', true)
      .gte('valid_until', new Date().toISOString())
      .lte('valid_from', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) throw error

    // Processar cupons para verificar se já foram usados pelo usuário
    const processedCoupons = coupons?.map(coupon => {
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

    const supabase = getSupabaseServerClient()
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .eq('active', true)
      .gte('valid_until', new Date().toISOString())
      .lte('valid_from', new Date().toISOString())
      .maybeSingle()
    if (error) throw error
    if (!coupon) {
      return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 400 })
    }

    // Verificar se o usuário já usou este cupom
    const { data: existing, error: exErr } = await supabase
      .from('user_coupons')
      .select('id')
      .eq('user_id', userId)
      .eq('coupon_id', coupon.id)
      .maybeSingle()
    if (exErr) throw exErr
    if (existing) {
      return NextResponse.json({ error: 'Cupom já foi utilizado' }, { status: 400 })
    }

    // Verificar limite de uso
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
    }

    // Registrar uso do cupom
    const { error: insErr } = await supabase
      .from('user_coupons')
      .insert({ user_id: userId, coupon_id: coupon.id, order_id: orderId || null })
    if (insErr) throw insErr

    // Atualizar contador de uso do cupom
    const { error: updErr } = await supabase
      .rpc('increment_coupon_usage', { p_coupon_id: coupon.id })
    if (updErr) {
      // fallback simples se função não existir
      await supabase.from('coupons').update({ current_uses: (coupon.current_uses || 0) + 1 }).eq('id', coupon.id)
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