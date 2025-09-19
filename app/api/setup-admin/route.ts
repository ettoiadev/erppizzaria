import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { appLogger } from '@/lib/logging'
import bcrypt from 'bcryptjs'

// Configuração de runtime para suporte ao módulo bcrypt
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const email = 'admin@pizzaria.com'
    const password = 'admin123'
    
    // Verificar se o usuário já existe
    const existingUser = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    )
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Usuário admin já existe'
      }, { status: 400 })
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Criar usuário admin
    const userResult = await query(`
      INSERT INTO profiles (email, password_hash, role, full_name, phone)
      VALUES ($1, $2, 'admin', 'Administrador', '')
      RETURNING id, email
    `, [email, hashedPassword])
    
    const newUser = userResult.rows[0]
    
    appLogger.info('auth', 'Usuário admin criado com sucesso', {
      userId: newUser.id,
      email: newUser.email
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário admin criado com sucesso'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    appLogger.error('auth', 'Erro ao criar usuário admin', undefined, { errorMessage })
    return NextResponse.json(
      { error: `Erro ao criar usuário admin: ${errorMessage}` },
      { status: 500 }
    )
  }
}