import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from "@/lib/frontend-logger"
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import bcrypt from "bcryptjs"

// Force dynamic rendering for this route  
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status)
  }
  
  const admin = authResult.user

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

      const supabase = getSupabaseServerClient()
      const { data: user, error } = await supabase
        .from('profiles')
        .select('password_hash')
        .eq('id', admin.id)
        .eq('role', 'admin')
        .maybeSingle()
      if (error) throw error

      if (!user) {
        frontendLogger.warn('Tentativa de alteração de senha para usuário inexistente', 'api', {
          adminId: admin.id,
          adminEmail: admin.email
        })
        const response = NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        return addCorsHeaders(response)
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash || '')

      if (!isCurrentPasswordValid) {
        frontendLogger.warn('Tentativa de alteração de senha com senha atual incorreta', 'api', {
          adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2')
        })
        const response = NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
        return addCorsHeaders(response)
      }

      // Gerar nova senha hasheada
      const newPasswordHash = await bcrypt.hash(newPassword, 12)

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
        .eq('id', admin.id)
        .eq('role', 'admin')
      if (updErr) throw updErr

      frontendLogger.info('Senha alterada com sucesso', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        adminId: admin.id
      })

      const response = NextResponse.json({ message: "Senha atualizada com sucesso" })
      return addCorsHeaders(response)
  } catch (error: any) {
    frontendLogger.logError('Erro ao alterar senha', {
      error: error.message,
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      stack: error.stack
    }, error, 'api')
    const response = NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// Handler para requisições OPTIONS (CORS)
export async function OPTIONS() {
  return createOptionsHandler()
}