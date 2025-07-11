import { NextResponse, type NextRequest } from "next/server"
import { verifyAdmin } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log("[ADMIN_PROFILE] GET request iniciado")
    
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    console.log("[ADMIN_PROFILE] Auth header presente:", !!authHeader)
    console.log("[ADMIN_PROFILE] Token extraído:", !!token)

    if (!token) {
      console.log("[ADMIN_PROFILE] Erro: Token não fornecido")
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    // Verify admin access
    console.log("[ADMIN_PROFILE] Verificando admin...")
    const admin = await verifyAdmin(token)
    
    if (!admin) {
      console.log("[ADMIN_PROFILE] Erro: Verificação de admin falhou")
      return NextResponse.json({ error: "Acesso negado - usuário não é admin" }, { status: 403 })
    }

    console.log("[ADMIN_PROFILE] Admin verificado:", admin.email, "ID:", admin.id)

    // Get admin profile
    console.log("[ADMIN_PROFILE] Buscando perfil do admin...")
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, phone, created_at, updated_at, role')
      .eq('id', admin.id)
      .single()

    console.log("[ADMIN_PROFILE] Resultado da query:", {
      found: !!profile,
      error: profileError?.message
    })

    if (profileError || !profile) {
      console.log("[ADMIN_PROFILE] Erro: Perfil não encontrado para ID:", admin.id)
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }
    console.log("[ADMIN_PROFILE] Perfil encontrado:", profile.email)
    
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
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[ADMIN_PROFILE] PUT request iniciado")
    
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      console.log("[ADMIN_PROFILE] PUT: Token não fornecido")
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    // Verify admin access
    console.log("[ADMIN_PROFILE] PUT: Verificando admin...")
    const admin = await verifyAdmin(token)
    
    if (!admin) {
      console.log("[ADMIN_PROFILE] PUT: Verificação de admin falhou")
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, phone } = body

    console.log("[ADMIN_PROFILE] PUT: Dados recebidos:", { full_name, phone })

    // Validações
    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: "Nome completo é obrigatório" }, { status: 400 })
    }

    // Update profile
    console.log("[ADMIN_PROFILE] PUT: Atualizando perfil...")
    const supabaseAdmin = getSupabaseAdmin()
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        phone: phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', admin.id)
      .select('id, email, full_name, phone, created_at, updated_at, role')
      .single()

    if (updateError || !updatedProfile) {
      console.log("[ADMIN_PROFILE] PUT: Perfil não encontrado para atualização")
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }
    console.log("[ADMIN_PROFILE] PUT: Perfil atualizado com sucesso")
    
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
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
