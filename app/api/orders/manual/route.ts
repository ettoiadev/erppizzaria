import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let transactionStarted = false
  
  try {
    console.log("=== POST /api/orders/manual - INÍCIO ===")
    
    const body = await request.json()
    console.log("POST /api/orders/manual - Request body:", JSON.stringify(body, null, 2))

    // Extrair dados específicos para pedidos manuais
    const items = body.items || []
    const total = Number(body.total || 0)
    const subtotal = Number(body.subtotal || total)
    const delivery_fee = Number(body.delivery_fee || 0)
    const customerId = body.customerId // ID real do cliente
    const customerName = body.name || ""
    const customerPhone = body.phone || ""
    const orderType = body.orderType || "balcao" // "balcao" ou "telefone"
    const paymentMethod = body.paymentMethod || "PIX"
    const notes = body.notes || ""
    const deliveryAddress = body.deliveryAddress || ""

    // Definir endereço baseado no tipo se não fornecido
    const finalDeliveryAddress = deliveryAddress || (orderType === "balcao" ? "Manual (Balcão)" : "Manual (Telefone)")

    console.log("Dados extraídos para pedido manual:", {
      items_count: items.length,
      total,
      subtotal,
      delivery_fee,
      customerId,
      customerName,
      customerPhone,
      orderType,
      paymentMethod,
      deliveryAddress: finalDeliveryAddress
    })

    // Validações específicas para pedidos manuais
    if (!customerId || customerId.trim() === "") {
      return NextResponse.json({ 
        error: "ID do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!customerName || customerName.trim() === "") {
      return NextResponse.json({ 
        error: "Nome do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!customerPhone || customerPhone.trim() === "") {
      return NextResponse.json({ 
        error: "Telefone do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: "Itens do pedido são obrigatórios" 
      }, { status: 400 })
    }

    if (total <= 0) {
      return NextResponse.json({ 
        error: "Total do pedido deve ser maior que zero" 
      }, { status: 400 })
    }

    // Usar ID do cliente real
    const userId = customerId

    // Iniciar transação
    console.log("Iniciando transação para pedido manual...")
    await query("BEGIN")
    transactionStarted = true

    try {
      // Verificar se o cliente existe
      const customerCheck = await query(
        "SELECT id, full_name, phone FROM profiles WHERE id = $1 AND role = 'customer'",
        [userId]
      )

      if (customerCheck.rows.length === 0) {
        throw new Error("Cliente não encontrado ou inválido")
      }

      const customer = customerCheck.rows[0]
      console.log("Cliente encontrado:", customer.full_name)

      // Criar pedido manual
      console.log("Criando pedido manual...")
      const orderResult = await query(
        `INSERT INTO orders (
          user_id, status, total, subtotal, delivery_fee, discount,
          payment_method, payment_status, delivery_address, delivery_phone,
          delivery_instructions, estimated_delivery_time, customer_name,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *`,
        [
          userId,
          "RECEIVED",
          total,
          subtotal,
          delivery_fee,
          0, // discount
          paymentMethod,
          "PENDING",
          finalDeliveryAddress,
          customerPhone,
          notes || null,
          new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutos
          customerName
        ]
      )

      if (!orderResult.rows || orderResult.rows.length === 0) {
        throw new Error("Falha ao criar pedido manual")
      }

      const order = orderResult.rows[0]
      console.log("Pedido manual criado com sucesso! ID:", order.id)

      // Inserir itens do pedido
      console.log(`Inserindo ${items.length} itens no pedido manual...`)
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const unit_price = Number(item.price || item.unit_price || 0)
        const quantity = Number(item.quantity || 1)
        
        // Limpar product_id
        let product_id = item.product_id || item.id
        if (product_id) {
          product_id = product_id.toString().replace(/--+$/, '').trim()
        }

        console.log(`Inserindo item ${i + 1}:`, {
          product_id,
          name: item.name,
          quantity,
          unit_price,
          size: item.size,
          toppings: item.toppings,
          notes: item.notes,
          isHalfAndHalf: item.isHalfAndHalf,
          halfAndHalf: item.halfAndHalf
        })

        if (!product_id) {
          throw new Error(`Item ${i + 1} não possui ID do produto`)
        }

        // Validar UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(product_id)) {
          throw new Error(`Item ${i + 1} possui ID de produto inválido: ${product_id}`)
        }

        try {
          await query(
            `INSERT INTO order_items (
              order_id, product_id, name, quantity, unit_price, total_price,
              size, toppings, special_instructions, half_and_half
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              order.id,
              product_id,
              item.name || '',
              quantity,
              unit_price,
              quantity * unit_price,
              item.size || null,
              JSON.stringify(item.toppings || []),
              item.notes || null,
              item.halfAndHalf ? JSON.stringify(item.halfAndHalf) : null
            ]
          )
          console.log(`Item ${i + 1} inserido com sucesso`)
        } catch (insertError: any) {
          console.error(`Erro ao inserir item ${i + 1}:`, insertError)
          throw new Error(`Falha ao inserir item ${i + 1}: ${insertError.message}`)
        }
      }

      // Commit da transação
      console.log("Fazendo COMMIT da transação...")
      await query("COMMIT")
      transactionStarted = false
      console.log("Pedido manual criado com sucesso!")

      // Retornar resposta de sucesso
      return NextResponse.json({
        id: order.id,
        status: order.status,
        total: order.total,
        orderType: orderType,
        customerName: customerName,
        customerPhone: customerPhone,
        customerId: userId,
        deliveryAddress: finalDeliveryAddress,
        created_at: order.created_at,
        message: `Pedido manual ${orderType === 'balcao' ? '(Balcão)' : '(Telefone)'} criado com sucesso!`
      })
      
    } catch (innerError: any) {
      console.error("Erro durante criação do pedido manual:", innerError)
      
      if (transactionStarted) {
        console.log("Fazendo ROLLBACK da transação...")
        await query("ROLLBACK")
      }
      
      throw innerError
    }
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO POST /api/orders/manual ===")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) {
      console.error("Código PostgreSQL:", error.code)
      console.error("Detalhe:", error.detail)
      console.error("Hint:", error.hint)
    }
    
    // Fazer rollback se necessário
    if (transactionStarted) {
      try {
        await query("ROLLBACK")
      } catch (rollbackError) {
        console.error("Erro ao fazer rollback:", rollbackError)
      }
    }
    
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor ao criar pedido manual",
      details: {
        type: error.constructor.name,
        code: error.code,
        message: error.message,
        hint: error.hint,
        detail: error.detail
      }
    }, { status: 500 })
  }
} 