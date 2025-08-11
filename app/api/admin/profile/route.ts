import { NextResponse, type NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/auth-middleware"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from "@/lib/frontend-logger"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      console.log("[ADMIN_PROFILE] GET request iniciado")
      console.log(`[ADMIN_PROFILE] GET: Acesso autorizado para admin: ${admin.email}`)

      // Get admin profile using Supabase
      console.log("[ADMIN_PROFILE] Buscando perfil do admin (Supabase)...")
      const supabase = getSupabaseServerClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, created_at, updated_at, role')
        .eq('id', admin.id)
        .eq('role', 'admin')
        .maybeSingle()
      if (error) throw error

      console.log("[ADMIN_PROFILE] Resultado da query:", {
        found: !!profile,
      })

      if (!profile) {
        console.log("[ADMIN_PROFILE] Erro: Perfil não encontrado para ID:", admin.id)
        frontendLogger.warn('Perfil não encontrado', 'api', {
          adminId: admin.id,
          adminEmail: admin.email
        })
        return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
      }

      console.log("[ADMIN_PROFILE] Perfil encontrado:", profile.email)
      frontendLogger.info('Perfil consultado', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      })
      
      return NextResponse.json({ 
        profile,
        success: true,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      console.error("[ADMIN_PROFILE] Erro completo:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      frontendLogger.logError('Erro ao consultar perfil', {
        error: error.message,
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        stack: error.stack
      }, error, 'api')
      
      return NextResponse.json({ 
        error: "Erro interno do servidor",
        message: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      console.log("[ADMIN_PROFILE] PUT request iniciado")
      console.log(`[ADMIN_PROFILE] PUT: Acesso autorizado para admin: ${admin.email}`)

      const body = await request.json()
      const { full_name, phone } = body

      console.log("[ADMIN_PROFILE] PUT: Dados recebidos:", { full_name, phone })

      // Validações
      if (!full_name || !full_name.trim()) {
        return NextResponse.json({ error: "Nome completo é obrigatório" }, { status: 400 })
      }

      // Update profile using Supabase
      console.log("[ADMIN_PROFILE] PUT: Atualizando perfil (Supabase)...")
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
        console.log("[ADMIN_PROFILE] PUT: Perfil não encontrado para atualização")
        frontendLogger.logError('Falha na atualização do perfil', {
          adminId: admin.id,
          adminEmail: admin.email
        }, new Error('Profile not found'), 'api')
        return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
      }
      console.log("[ADMIN_PROFILE] PUT: Perfil atualizado com sucesso")
      frontendLogger.info('Perfil atualizado', 'api', {
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        updatedFields: { full_name: !!full_name, phone: !!phone }
      })
      
      return NextResponse.json({ 
        message: "Perfil atualizado com sucesso",
        profile: updatedProfile,
        success: true,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      console.error("[ADMIN_PROFILE] PUT: Erro completo:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      frontendLogger.logError('Erro ao atualizar perfil', {
        error: error.message,
        adminEmail: admin.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        stack: error.stack
      }, error, 'api')
      
      return NextResponse.json({ 
        error: "Erro interno do servidor",
        message: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  })
}