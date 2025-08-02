import { NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Buscar o usuário admin
    const adminResult = await query(
      'SELECT id, email, full_name, role, password_hash FROM profiles WHERE email = $1',
      ['admin@pizzaria.com']
    )

    if (adminResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Admin não encontrado'
      })
    }

    const admin = adminResult.rows[0]
    
    // Verificar se tem hash de senha
    const hasPasswordHash = !!admin.password_hash
    
    // Testar algumas senhas comuns
    const testPasswords = ['123456', 'admin', 'password', 'williamdisk', 'pizza123']
    let validPassword = null
    
    if (hasPasswordHash) {
      for (const testPassword of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, admin.password_hash)
          if (isValid) {
            validPassword = testPassword
            break
          }
        } catch (error) {
          // Ignora erros de comparação
        }
      }
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        hasPasswordHash,
        validPassword: validPassword || 'Nenhuma das senhas testadas funcionou'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}