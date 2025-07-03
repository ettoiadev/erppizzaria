import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Listar endereços do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "UserId não fornecido" }, { status: 400 })
    }

    const result = await query(
      'SELECT *, label as name FROM customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    )

    return NextResponse.json({ addresses: result.rows })
  } catch (error) {
    console.error("Erro ao buscar endereços:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Adicionar novo endereço
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_id, name, street, number, complement, neighborhood, city, state, zip_code, is_default } = body

    console.log("POST /api/addresses - Dados recebidos:", body)

    // Validações detalhadas dos campos obrigatórios
    if (!customer_id) {
      return NextResponse.json({ error: "ID do cliente é obrigatório" }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do endereço é obrigatório" }, { status: 400 })
    }
    if (!zip_code || !zip_code.trim()) {
      return NextResponse.json({ error: "CEP é obrigatório" }, { status: 400 })
    }
    const zipCodeNumbers = zip_code.replace(/\D/g, "")
    if (zipCodeNumbers.length !== 8) {
      return NextResponse.json({ error: "CEP deve ter 8 dígitos" }, { status: 400 })
    }
    if (!street || !street.trim()) {
      return NextResponse.json({ error: "Rua/Logradouro é obrigatório" }, { status: 400 })
    }
    if (!number || !number.trim()) {
      return NextResponse.json({ error: "Número é obrigatório" }, { status: 400 })
    }
    if (!neighborhood || !neighborhood.trim()) {
      return NextResponse.json({ error: "Bairro é obrigatório" }, { status: 400 })
    }
    if (!city || !city.trim()) {
      return NextResponse.json({ error: "Cidade é obrigatória" }, { status: 400 })
    }
    if (!state || !state.trim()) {
      return NextResponse.json({ error: "Estado é obrigatório" }, { status: 400 })
    }
    if (state.length !== 2) {
      return NextResponse.json({ error: "Estado deve ter 2 caracteres (UF)" }, { status: 400 })
    }

    // Se o novo endereço for padrão, remover o padrão dos outros
    if (is_default) {
      await query(
        'UPDATE customer_addresses SET is_default = false WHERE user_id = $1',
        [customer_id]
      )
    }

    // Inserir novo endereço
    const result = await query(
      `
      INSERT INTO customer_addresses 
      (user_id, label, street, number, complement, neighborhood, city, state, zip_code, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *, label as name
      `,
      [customer_id, name || 'Endereço', street, number, complement, neighborhood, city, state, zip_code, is_default || false]
    )

    console.log("POST /api/addresses - Endereço criado:", result.rows[0])

    return NextResponse.json({ address: result.rows[0] })
  } catch (error) {
    console.error("Erro ao criar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
