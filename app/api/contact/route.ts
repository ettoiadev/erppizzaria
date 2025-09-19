import { NextResponse } from "next/server"
import { query } from '@/lib/db'
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

    // Inserir mensagem
    const contactRows = await query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, subject || 'Contato via site', message]
    )
    const data = contactRows.rows[0]

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
