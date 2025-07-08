import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Buscar todos os usuários com email admin@williamdiskpizza.com
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'admin@williamdiskpizza.com')
    
    // Contar quantos existem
    const count = adminUsers?.length || 0
    
    return NextResponse.json({
      success: true,
      email: 'admin@williamdiskpizza.com',
      count: count,
      users: adminUsers,
      error: adminError
    })
    
  } catch (error: any) {
    console.error('Debug emails error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 