import { NextResponse } from "next/server"
import { query } from "@/lib/postgres"

// GET - Buscar dados de um usuário específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("GET /api/users - Buscando usuário:", params.id)

    const result = await query(
      `SELECT 
        id,
        email,
        full_name as name,
        phone,
        role
      FROM profiles 
      WHERE id = $1`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userData = result.rows[0]
    console.log("Dados do usuário encontrados:", userData)

    return NextResponse.json({ 
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        full_name: userData.name,
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

    // Verificar se o usuário existe
    const userCheck = await query(
      "SELECT id FROM profiles WHERE id = $1",
      [params.id]
    )

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Iniciar transação
    await query("BEGIN")

    try {
      // Atualizar dados na tabela profiles
      await query(
        `UPDATE profiles 
         SET full_name = $1, email = $2, phone = $3, updated_at = NOW() 
         WHERE id = $4`,
        [name.trim(), email, cleanPhone, params.id]
      )

      await query("COMMIT")

      console.log("Usuário atualizado com sucesso:", params.id)

      return NextResponse.json({ 
        message: "Dados atualizados com sucesso",
        user: {
          id: params.id,
          name: name.trim(),
          email: email,
          phone: cleanPhone
        }
      })
    } catch (transactionError) {
      await query("ROLLBACK")
      throw transactionError
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}