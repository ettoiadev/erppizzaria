import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from '@/lib/frontend-logger'

// GET - Buscar dados de um usuário específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Busca de usuário por ID', 'api', { userId: params.id })

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
    frontendLogger.info('Dados do usuário encontrados', 'api', {
      userId: user.id,
      userEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

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
    frontendLogger.error('Erro ao buscar usuário', 'api', {
      userId: params.id,
      error: (error as any)?.message,
      stack: (error as any)?.stack
    })
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar dados de um usuário
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Atualização de usuário por ID', 'api', { userId: params.id })

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
    
    frontendLogger.info('Dados a serem atualizados', 'api', {
      userId: params.id,
      name,
      email: email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
      hasPhone: !!phone
    })

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

    frontendLogger.info('Usuário atualizado com sucesso', 'api', {
      userId: params.id,
      updatedName: updated.full_name,
      updatedEmail: updated.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

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
    frontendLogger.error('Erro ao atualizar usuário', 'api', {
      userId: params.id,
      error: (error as any)?.message,
      stack: (error as any)?.stack
    })
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}