import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// GET - Buscar dados de um usuário específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("GET /api/users - Buscando usuário:", params.id)

    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw error

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userData = user
    console.log("Dados do usuário encontrados:", user)

    return NextResponse.json({ 
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.full_name,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role
      }
    })
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar dados de um usuário
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("PUT /api/users - Atualizando usuário:", params.id)

    const body = await request.json()
    const { name, email, phone } = body

    // Validações obrigatórias
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (name.trim().length < 2) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres" }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 })
    }
    const phoneNumbers = phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return NextResponse.json({ error: "Telefone deve ter 10 ou 11 dígitos" }, { status: 400 })
    }

    // Limpar telefone para salvar apenas números no banco
    const cleanPhone = phone.replace(/\D/g, "")
    
    console.log("Dados a serem atualizados:", { name, email, phone: phone, cleanPhone })

    const supabase = getSupabaseServerClient()
    const { data: existing, error: checkErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()
    if (checkErr) throw checkErr

    if (!existing) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }
    const { data: updated, error: updErr } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), email, phone: cleanPhone, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id, email, full_name, phone')
      .single()
    if (updErr) throw updErr

    console.log("Usuário atualizado com sucesso:", params.id)

    return NextResponse.json({ 
      message: "Dados atualizados com sucesso",
      user: {
        id: params.id,
        name: updated.full_name,
        email: updated.email,
        phone: updated.phone
      }
    })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}