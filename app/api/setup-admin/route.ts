import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { appLogger } from '@/lib/logging'

export async function POST() {
  try {
    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@pizzaria.com',
      password: 'admin123',
      email_confirm: true
    })

    if (authError) {
      appLogger.error('auth', 'Erro ao criar usuário no Auth', { error: authError })
      throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`)
    }

    if (!authData?.user) {
      appLogger.error('auth', 'Dados do usuário não retornados pelo Auth')
      throw new Error('Dados do usuário não retornados pelo Auth')
    }

    // Criar perfil do admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: 'Administrador',
        role: 'admin',
        active: true,
        phone: ''
      })

    if (profileError) {
      // Remover o usuário criado no Auth se houver erro ao criar o perfil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      appLogger.error('auth', 'Erro ao criar perfil do admin', { error: profileError })
      throw new Error(`Erro ao criar perfil do admin: ${profileError.message}`)
    }

    appLogger.info('auth', 'Usuário admin criado com sucesso', {
      userId: authData.user.id,
      email: authData.user.email
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário admin criado com sucesso'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    appLogger.error('auth', 'Erro ao criar usuário admin', { error: errorMessage })
    return NextResponse.json(
      { error: `Erro ao criar usuário admin: ${errorMessage}` },
      { status: 500 }
    )
  }
}