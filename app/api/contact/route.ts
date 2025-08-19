import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { frontendLogger } from '@/lib/frontend-logger'

// POST - Enviar mensagem de contato
export async function POST(request: Request) {
  let name, email, subject, message
  
  try {
    const body = await request.json()
    ;({ name, email, subject, message } = body)

    // Validar dados
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Nome, email e mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    // Inserir mensagem (Supabase)
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject: subject || 'Contato via site',
        message,
      })
      .select('*')
      .single()
    if (error) throw error

    return NextResponse.json({ message: "Mensagem enviada com sucesso", contact: data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const stack = error instanceof Error ? error.stack : undefined
    
    frontendLogger.logError('Erro ao enviar mensagem de contato', {
      errorMessage,
      stack,
      name,
      email,
      subject: subject || 'Contato via site'
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
