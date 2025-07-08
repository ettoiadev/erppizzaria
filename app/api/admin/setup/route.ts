import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🔧 Iniciando setup do administrador...')
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Dados do usuário admin
    const adminEmail = 'admin@williamdiskpizza.com'
    const adminPassword = 'admin123'
    const adminName = 'Administrador Sistema'
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    // Verificar se o usuário já existe
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('email', adminEmail)
      .single()
    
    if (existingUser) {
      console.log('✅ Usuário admin já existe:', existingUser)
      return NextResponse.json({
        success: true,
        message: 'Usuário admin já existe',
        user: existingUser
      })
    }
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário:', findError)
      throw findError
    }
    
    // Criar usuário admin
    console.log('👤 Criando usuário administrador...')
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          email: adminEmail,
          password_hash: hashedPassword,
          full_name: adminName,
          role: 'ADMIN',
          phone: '(11) 99999-0000'
        }
      ])
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError)
      throw createError
    }
    
    console.log('✅ Usuário administrador criado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Usuário administrador criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      },
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro no setup:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao configurar administrador',
      error: error.message,
      details: error
    }, { status: 500 })
  }
} 