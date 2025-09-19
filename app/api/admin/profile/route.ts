import { NextResponse, type NextRequest } from "next/server"
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from "@/lib/auth-utils"
import { query } from "@/lib/db"
import { frontendLogger } from "@/lib/frontend-logger"

// Handler para requisições OPTIONS (CORS)
export const OPTIONS = createOptionsHandler()

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Validar autenticação admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado')
  }
  
  const admin = authResult.user
  
  try {
    frontendLogger.info('Busca de perfil admin iniciada', 'api', {
      adminEmail: admin.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

      // Get admin profile using PostgreSQL
      frontendLogger.info('Buscando perfil do admin no PostgreSQL', 'api')
      const profileResult = await query(
        'SELECT id, email, full_name, phone, created_at, updated_at, role FROM profiles WHERE id = $1 AND role = $2',
        [admin.id, 'admin']
      )
      const profile = profileResult.rows[0] || null

      frontendLogger.info('Resultado da query de perfil', 'api', {
        found: !!profile
      })

    if (!profile) {
      frontendLogger.info('Admin não encontrado', 'api', {
        adminId: admin.id
      })
      const response = NextResponse.json(
        { error: "Admin não encontrado" },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    frontendLogger.info('Perfil admin encontrado com sucesso', 'api', {
      adminId: profile.id,
      adminEmail: profile.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
    const response = NextResponse.json({
      success: true,
      profile
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar perfil admin', {
      error: error.message,
      stack: error.stack,
      adminId: admin.id
    }, error, 'api')

    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

export async function PUT(request: NextRequest) {
  // Validar autenticação admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado')
  }
  
  const admin = authResult.user
  
  try {
      frontendLogger.info('Atualização de perfil admin iniciada', 'api', {
        adminEmail: admin.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      const body = await request.json()
      const { full_name, phone } = body

      frontendLogger.info('Dados recebidos para atualização', 'api', {
        hasFullName: !!full_name,
        hasPhone: !!phone
      })

      // Validações
      if (!full_name || !full_name.trim()) {
        const response = NextResponse.json({ error: "Nome completo é obrigatório" }, { status: 400 })
        return addCorsHeaders(response)
      }

      // Update profile using PostgreSQL
      frontendLogger.info('Atualizando perfil no PostgreSQL', 'api')
      const updateResult = await query(
        `UPDATE profiles SET 
          full_name = $1, 
          phone = $2, 
          updated_at = $3 
        WHERE id = $4 AND role = $5
        RETURNING id, email, full_name, phone, created_at, updated_at, role`,
        [full_name.trim(), phone || null, new Date().toISOString(), admin.id, 'admin']
      )
      const updatedProfile = updateResult.rows[0] || null

      if (!updatedProfile) {
        frontendLogger.info('Perfil não encontrado para atualização', 'api', {
          adminId: admin.id
        })
        frontendLogger.logError('Falha na atualização do perfil', {
          adminId: admin.id,
          adminEmail: admin.email
        }, new Error('Profile not found'), 'api')
        const response = NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
        return addCorsHeaders(response)
      }
      frontendLogger.info('Perfil admin atualizado com sucesso', 'api', {
        adminId: updatedProfile.id,
        adminEmail: updatedProfile.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      frontendLogger.info('Perfil atualizado', 'api', {
        adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
        updatedFields: { full_name: !!full_name, phone: !!phone }
      })
      
      const response = NextResponse.json({ 
        message: "Perfil atualizado com sucesso",
        profile: updatedProfile,
        success: true,
        timestamp: new Date().toISOString()
      })
      return addCorsHeaders(response)
    } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar perfil', {
      error: error.message,
      adminEmail: admin?.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'unknown',
      stack: error.stack
    }, error, 'api')
    
    const response = NextResponse.json({ 
      error: "Erro interno do servidor",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}