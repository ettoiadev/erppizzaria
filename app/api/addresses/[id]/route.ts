import { NextResponse } from "next/server"
import { getAddressById, updateAddress, deleteAddress } from "@/lib/db-supabase"

// GET - Buscar um endereço específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const address = await getAddressById(params.id)
    if (!address) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }
    return NextResponse.json({ address })
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

    const address = await updateAddress(params.id, { is_default })
    return NextResponse.json({ address })
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

    const address = await updateAddress(params.id, { label: name || 'Endereço', street, number, complement, neighborhood, city, state, zip_code, is_default: is_default || false })
    return NextResponse.json({ address })
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Excluir um endereço
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("DELETE /api/addresses - Excluindo endereço:", params.id)

    await deleteAddress(params.id)
    return NextResponse.json({ message: "Endereço excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
