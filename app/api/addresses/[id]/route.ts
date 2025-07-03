import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - Buscar um endereço específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await query(
      'SELECT *, label as name FROM customer_addresses WHERE id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ address: result.rows[0] })
  } catch (error) {
    console.error("Erro ao buscar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH - Atualizar um endereço parcialmente (para marcar como padrão)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { is_default } = body

    console.log("PATCH /api/addresses - Atualizando endereço:", params.id, body)

    // Primeiro, buscar o endereço para ter o user_id
    const findResult = await query(
      'SELECT user_id FROM customer_addresses WHERE id = $1',
      [params.id]
    )

    if (findResult.rows.length === 0) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    const userId = findResult.rows[0].user_id

    // Se definindo como padrão, remover padrão dos outros
    if (is_default) {
      await query(
        'UPDATE customer_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, params.id]
      )
    }

    // Atualizar endereço
    const result = await query(
      'UPDATE customer_addresses SET is_default = $1, updated_at = NOW() WHERE id = $2 RETURNING *, label as name',
      [is_default, params.id]
    )

    console.log("PATCH /api/addresses - Endereço atualizado:", result.rows[0])

    return NextResponse.json({ address: result.rows[0] })
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar um endereço completo
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, street, number, complement, neighborhood, city, state, zip_code, is_default } = body

    console.log("PUT /api/addresses - Dados recebidos:", body)

    // Validações detalhadas dos campos obrigatórios
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

    // Primeiro, buscar o endereço para ter o user_id
    const findResult = await query(
      'SELECT user_id FROM customer_addresses WHERE id = $1',
      [params.id]
    )

    if (findResult.rows.length === 0) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    const userId = findResult.rows[0].user_id

    // Se o endereço for definido como padrão, remover o padrão dos outros
    if (is_default) {
      await query(
        'UPDATE customer_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, params.id]
      )
    }

    // Atualizar endereço
    const result = await query(
      `
      UPDATE customer_addresses 
      SET label = $1,
          street = $2, 
          number = $3, 
          complement = $4, 
          neighborhood = $5, 
          city = $6, 
          state = $7, 
          zip_code = $8,
          is_default = $9,
          updated_at = NOW()
      WHERE id = $10
      RETURNING *, label as name
      `,
      [name || 'Endereço', street, number, complement, neighborhood, city, state, zip_code, is_default || false, params.id]
    )

    console.log("PUT /api/addresses - Endereço atualizado:", result.rows[0])

    return NextResponse.json({ address: result.rows[0] })
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Excluir um endereço
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("DELETE /api/addresses - Excluindo endereço:", params.id)

    // Verificar se o endereço existe
    const checkResult = await query(
      'SELECT is_default, user_id FROM customer_addresses WHERE id = $1',
      [params.id]
    )

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    const { is_default, user_id } = checkResult.rows[0]

    // Não permitir excluir o endereço padrão se houver outros endereços
    if (is_default) {
      const countResult = await query(
        'SELECT COUNT(*) as total FROM customer_addresses WHERE user_id = $1',
        [user_id]
      )
      
      if (parseInt(countResult.rows[0].total) > 1) {
        return NextResponse.json(
          { error: "Não é possível excluir o endereço padrão. Defina outro endereço como padrão primeiro." },
          { status: 400 }
        )
      }
    }

    // Excluir endereço
    await query(
      'DELETE FROM customer_addresses WHERE id = $1',
      [params.id]
    )

    console.log("DELETE /api/addresses - Endereço excluído com sucesso")

    return NextResponse.json({ message: "Endereço excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
