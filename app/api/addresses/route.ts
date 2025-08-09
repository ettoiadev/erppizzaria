import { NextResponse } from "next/server"
import { listAddresses, createAddress } from "@/lib/db-supabase"

// GET - Listar endereços do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "UserId não fornecido" }, { status: 400 })
    }

    const addresses = await listAddresses(userId)
    return NextResponse.json({ addresses })
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

    const address = await createAddress({
      user_id: customer_id,
      label: name || 'Endereço',
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zip_code,
      is_default: is_default || false,
    })
    console.log("POST /api/addresses - Endereço criado:", address)
    return NextResponse.json({ address })
  } catch (error) {
    console.error("Erro ao criar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
