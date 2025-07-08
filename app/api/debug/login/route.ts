import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    console.log('🔍 Debug Login - Email:', email)
    console.log('🔍 Debug Login - Password length:', password?.length)
    
    // Buscar usuário na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, password_hash')
      .eq('email', email.trim().toLowerCase())
      .single()
    
    console.log('🔍 Profile search result:', { profile, profileError })
    
    if (profileError || !profile) {
      return NextResponse.json({
        debug: true,
        step: 'profile_search',
        success: false,
        email_searched: email.trim().toLowerCase(),
        error: profileError?.message,
        message: 'Usuário não encontrado'
      })
    }
    
    // Verificar senha
    const bcrypt = require('bcryptjs')
    const isValidPassword = await bcrypt.compare(password, profile.password_hash)
    
    console.log('🔍 Password check:', {
      provided_password: password,
      stored_hash: profile.password_hash,
      is_valid: isValidPassword
    })
    
    return NextResponse.json({
      debug: true,
      step: isValidPassword ? 'success' : 'password_invalid',
      success: isValidPassword,
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        has_password_hash: !!profile.password_hash
      },
      password_check: {
        provided_length: password.length,
        hash_starts_with: profile.password_hash.substring(0, 10),
        is_valid: isValidPassword
      }
    })
    
  } catch (error: any) {
    console.error('Debug login error:', error)
    
    return NextResponse.json({
      debug: true,
      step: 'error',
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 