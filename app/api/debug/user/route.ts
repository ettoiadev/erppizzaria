import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Buscar usuário admin com todos os campos
    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'admin@williamdiskpizza.com')
      .single()
    
    console.log('Admin user:', adminUser)
    
    // Tentar buscar também por email em maiúscula/minúscula
    const { data: allUsers, error: allError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, password_hash, created_at')
      .limit(5)
    
    return NextResponse.json({
      success: true,
      adminUser: adminUser,
      adminUserError: userError,
      allUsers: allUsers,
      allUsersError: allError,
      searchEmail: 'admin@williamdiskpizza.com'
    })
    
  } catch (error: any) {
    console.error('Debug error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 })
  }
} 