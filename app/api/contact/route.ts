import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// POST - Enviar mensagem de contato
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

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
    const result = await query(
      `
      INSERT INTO contact_messages 
      (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [name, email, subject || "Contato via site", message]
    )

    // TODO: Enviar email de notificação para o administrador
    // Isso será implementado quando configurarmos o serviço de email

    return NextResponse.json({ 
      message: "Mensagem enviada com sucesso",
      contact: result.rows[0]
    })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
