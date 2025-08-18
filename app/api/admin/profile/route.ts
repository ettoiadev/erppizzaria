import { NextResponse, type NextRequest } from "next/server"
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from "@/lib/auth-utils"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from "@/lib/frontend-logger"

// Handler para requisições OPTIONS (CORS)
export async function OPTIONS() {
  return createOptionsHandler()
}

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

      // Get admin profile using Supabase
      frontendLogger.info('Buscando perfil do admin no Supabase', 'api')
      const supabase = getSupabaseServerClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, created_at, updated_at, role')
        .eq('id', admin.id)
        .eq('role', 'admin')
        .maybeSingle()
      if (error) throw error

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
    frontendLogger.error('Erro ao buscar perfil admin', 'api', {
      error: error.message,
      stack: error.stack,
      adminId: admin.id
    })
    frontendLogger.error("Erro ao buscar perfil do admin", {
      error: error.message,
      adminId: admin.id
    })

    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
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

      // Update profile using Supabase
      frontendLogger.info('Atualizando perfil no Supabase', 'api')
      const supabase = getSupabaseServerClient()
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ full_name: full_name.trim(), phone: phone || null, updated_at: new Date().toISOString() })
        .eq('id', admin.id)
        .eq('role', 'admin')
        .select('id, email, full_name, phone, created_at, updated_at, role')
        .single()
      if (error) throw error

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
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
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
    frontendLogger.error('Erro ao atualizar perfil admin', 'api', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      adminEmail: admin.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
    frontendLogger.logError('Erro ao atualizar perfil', {
      error: error.message,
      adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
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
}