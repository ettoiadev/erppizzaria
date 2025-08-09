import { NextResponse, type NextRequest } from "next/server"
import { getOrderById } from '@/lib/db-supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/orders/[id] - Buscando pedido:", params.id)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      console.log("ID inválido fornecido:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = await getOrderById(params.id)
    if (!order) {
      console.log("Pedido não encontrado:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }
    console.log("Pedido encontrado:", order.id, "com", order.items?.length || 0, "itens")
    return NextResponse.json(order)
  } catch (error: any) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, delivery_instructions, estimated_delivery_time } = body

    // Preparar dados para atualização
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (status) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++
    }

    if (delivery_instructions !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      updateValues.push(delivery_instructions)
      paramIndex++
    }

    if (estimated_delivery_time) {
      updateFields.push(`estimated_delivery_time = $${paramIndex}`)
      updateValues.push(estimated_delivery_time)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    // Sempre atualizar updated_at
    updateFields.push(`updated_at = NOW()`)

    // Adicionar ID no final
    updateValues.push(params.id)

    // Atualização via Supabase (atualmente apenas status/estimated/notes estão mapeados em outro endpoint)
    const { getSupabaseServerClient } = await import('@/lib/supabase')
    const supabase = getSupabaseServerClient()
    const updates: any = {}
    if (status) updates.status = status
    if (delivery_instructions !== undefined) updates.notes = delivery_instructions
    if (estimated_delivery_time) updates.estimated_delivery_time = estimated_delivery_time
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }
      throw error
    }
    return NextResponse.json({ message: "Pedido atualizado com sucesso", order: data })
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase')
    const supabase = getSupabaseServerClient()
    const existing = await getOrderById(params.id)
    if (!existing) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Apenas permitir exclusão de certos status
    if (!['RECEIVED', 'CANCELLED'].includes(existing.status)) {
      return NextResponse.json({ 
        error: "Não é possível excluir pedidos em andamento" 
      }, { status: 400 })
    }
    const { error } = await supabase.from('orders').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ message: "Pedido excluído com sucesso" })
  } catch (error: any) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}