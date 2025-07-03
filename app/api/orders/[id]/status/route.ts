import { NextResponse, NextRequest } from "next/server"
import { query } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== PATCH /api/orders/[id]/status - INÍCIO ===")
    console.log("Order ID:", params.id)
    
    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Request body:", body)
    } catch (parseError) {
      console.error("Erro ao fazer parse do body:", parseError)
      return NextResponse.json({ 
        error: "Corpo da requisição inválido" 
      }, { status: 400 })
    }

    const { status, notes } = body

    // Validate required parameters
    if (!params.id) {
      console.error("ID do pedido não fornecido")
      return NextResponse.json({ 
        error: "ID do pedido é obrigatório" 
      }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      console.error("ID do pedido inválido (não é UUID):", params.id)
      return NextResponse.json({ 
        error: "ID do pedido deve ser um UUID válido" 
      }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      console.error("Status inválido:", status)
      return NextResponse.json({ 
        error: "Status inválido. Deve ser: " + validStatuses.join(', ') 
      }, { status: 400 })
    }

    console.log("Validação inicial concluída. Buscando pedido no banco...")

    // Check if order exists and get current status
    const orderResult = await query(
      'SELECT id, status FROM orders WHERE id = $1',
      [params.id]
    )

    if (orderResult.rows.length === 0) {
      console.error("Pedido não encontrado:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const currentOrder = orderResult.rows[0]
    console.log("Pedido encontrado:", currentOrder)

    // Prevent status regression (optional business logic)
    const statusOrder = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)

    if (status !== 'CANCELLED' && currentIndex > newIndex && currentIndex !== -1) {
      console.error("Tentativa de retroceder status:", { currentStatus: currentOrder.status, newStatus: status })
      return NextResponse.json({ 
        error: "Não é possível retroceder o status do pedido" 
      }, { status: 400 })
    }

    console.log("Iniciando transação no banco...")

    // Begin transaction
    await query('BEGIN')

    try {
      console.log("Atualizando status do pedido para:", status)

      // Verificar estrutura da tabela orders
      const columnsResult = await query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
          AND column_name IN ('status', 'delivered_at', 'cancelled_at')
      `)
      
      const columns = columnsResult.rows
      const existingColumns = columns.map(col => col.column_name)
      const statusColumn = columns.find(col => col.column_name === 'status')
      
      console.log("Colunas disponíveis:", columns)
      console.log("Tipo da coluna status:", statusColumn)
      
      // Determinar como fazer cast do status baseado no tipo da coluna
      const isEnumStatus = statusColumn?.udt_name === 'order_status' || statusColumn?.data_type === 'USER-DEFINED'
      const statusCast = isEnumStatus ? 'CAST($1 AS order_status)' : '$1::VARCHAR'
      const statusComparison = isEnumStatus ? 'CAST($PARAM AS order_status)' : '$PARAM::VARCHAR'
      
      console.log("Usando ENUM para status:", isEnumStatus)
      
      // Construir query UPDATE de forma segura
      let updateQuery = `UPDATE orders SET status = ${statusCast}, updated_at = NOW()`
      const queryParams = [status]
      let paramCount = 2
      
      if (existingColumns.includes('delivered_at')) {
        const deliveredComparison = statusComparison.replace('$PARAM', `$${paramCount}`)
        updateQuery += `, delivered_at = CASE WHEN ${deliveredComparison} = 'DELIVERED' THEN NOW() ELSE delivered_at END`
        queryParams.push(status)
        paramCount++
      }
      
      if (existingColumns.includes('cancelled_at')) {
        const cancelledComparison = statusComparison.replace('$PARAM', `$${paramCount}`)
        updateQuery += `, cancelled_at = CASE WHEN ${cancelledComparison} = 'CANCELLED' THEN NOW() ELSE cancelled_at END`
        queryParams.push(status)
        paramCount++
      }
      
      updateQuery += ` WHERE id = $${paramCount}::UUID RETURNING *`
      queryParams.push(params.id)
      
      console.log("Query final:", updateQuery)
      console.log("Parâmetros:", queryParams)
      
      const updateResult = await query(updateQuery, queryParams)

      if (updateResult.rows.length === 0) {
        throw new Error("Falha ao atualizar pedido - nenhum registro retornado")
      }

      const updatedOrder = updateResult.rows[0]
      console.log("Pedido atualizado com sucesso")

      // Try to insert status history (optional - se a tabela não existir, ignorar)
      try {
        console.log("Tentando inserir histórico de status...")
        
        // Verificar se tabela order_status_history existe e qual tipo usa
        let historyStatusCast = isEnumStatus ? 'CAST($2 AS order_status)' : '$2::VARCHAR'
        let historyNewStatusCast = isEnumStatus ? 'CAST($3 AS order_status)' : '$3::VARCHAR'
        
        await query(
          `INSERT INTO order_status_history 
           (order_id, old_status, new_status, notes, changed_at) 
           VALUES ($1::UUID, ${historyStatusCast}, ${historyNewStatusCast}, $4::TEXT, NOW())`,
          [params.id, currentOrder.status, status, notes || null]
        )
        console.log("Histórico de status inserido com sucesso")
      } catch (historyError: any) {
        console.warn("Erro ao inserir histórico (ignorando):", historyError.message)
        // Não falhar se a tabela de histórico não existir
      }

      await query('COMMIT')
      console.log("Transação commitada com sucesso")

      return NextResponse.json({
        message: "Status do pedido atualizado com sucesso",
        order: updatedOrder
      })
    } catch (error) {
      console.error("Erro durante transação:", error)
      await query('ROLLBACK')
      throw error
    }
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO PATCH /api/orders/[id]/status ===")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) {
      console.error("Código PostgreSQL:", error.code)
      console.error("Detalhe:", error.detail)
      console.error("Hint:", error.hint)
    }
    
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
      details: {
        type: error.constructor.name,
        code: error.code,
        message: error.message
      }
    }, { status: 500 })
  }
}

// Handle DELETE requests (redirect to PATCH with CANCELLED status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== DELETE /api/orders/[id]/status - REDIRECIONANDO PARA PATCH ===")
    console.log("Order ID:", params.id)
    
    // Parse body to get cancellation notes if provided
    let notes = null
    try {
      const body = await request.json()
      notes = body.notes || body.motivoCancelamento || null
      console.log("Notas de cancelamento:", notes)
    } catch (parseError) {
      console.log("Nenhuma nota de cancelamento fornecida")
    }

    // Create a new request with PATCH method
    const patchRequest = new NextRequest(request.url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status: 'CANCELLED', 
        notes: notes 
      })
    })

    // Call the PATCH handler
    return await PATCH(patchRequest, { params })
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO DELETE /api/orders/[id]/status ===")
    console.error("Erro:", error.message)
    
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
      details: {
        type: error.constructor.name,
        message: error.message
      }
    }, { status: 500 })
  }
}
