import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { frontendLogger } from "@/lib/frontend-logger"
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import bcrypt from "bcryptjs"

// Configuração de runtime para suporte ao módulo bcrypt
export const runtime = 'nodejs'
// Force dynamic rendering for this route  
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)    
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Erro de autenticação')
  }
  
  const admin = authResult.user
  
  if (!admin) {
    return createAuthErrorResponse('Usuário não encontrado')
  }

  try {

      const { currentPassword, newPassword } = await request.json()

      if (!currentPassword || !newPassword) {
        const response = NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 })
        return addCorsHeaders(response)
      }

      if (newPassword.length < 6) {
        const response = NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 })
        return addCorsHeaders(response)
      }

      const result = await query(
        'SELECT password_hash FROM profiles WHERE id = $1 AND role = $2',
        [admin.id, 'admin']
      )

      if (result.rows.length === 0) {
        frontendLogger.warn('Tentativa de alteração de senha para usuário inexistente', 'api', {
          adminId: admin.id,
          adminEmail: admin?.email || 'unknown'
        })
        const response = NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        return addCorsHeaders(response)
      }

      const user = result.rows[0]
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash || '')

      if (!isCurrentPasswordValid) {
        frontendLogger.warn('Tentativa de alteração de senha com senha atual incorreta', 'api', {
          adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown'
        })
        const response = NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
        return addCorsHeaders(response)
      }

      // Gerar nova senha hasheada
      const newPasswordHash = await bcrypt.hash(newPassword, 12)

      await query(
        'UPDATE profiles SET password_hash = $1, updated_at = $2 WHERE id = $3 AND role = $4',
        [newPasswordHash, new Date().toISOString(), admin.id, 'admin']
      )

      frontendLogger.info('Senha alterada com sucesso', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        adminId: admin.id
      })

      const response = NextResponse.json({ message: "Senha atualizada com sucesso" })
      return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.logError('Erro ao alterar senha', {
      error: error.message,
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      stack: error.stack
    }, error, 'api')
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// Handler para requisições OPTIONS (CORS)
export const OPTIONS = createOptionsHandler()