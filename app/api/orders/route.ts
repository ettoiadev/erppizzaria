import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId") || searchParams.get("user_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("GET /api/orders - Fetching orders with params:", { status, userId, limit, offset })

    // Construir a query base
    let queryText = `
      SELECT o.*, 
             p.full_name, p.phone,
             COALESCE(p.full_name, o.customer_name) as customer_display_name,
             COALESCE(o.delivery_phone, p.phone) as customer_display_phone,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'name', oi.name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price,
                 'size', oi.size,
                 'toppings', oi.toppings,
                 'special_instructions', oi.special_instructions,
                 'half_and_half', oi.half_and_half,
                 'products', json_build_object(
                   'name', pr.name,
                   'description', pr.description,
                   'image', pr.image
                 )
               )
             ) as order_items
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products pr ON oi.product_id = pr.id
    `

    const whereConditions = []
    const queryParams = []
    let paramCount = 1

    if (status && status !== "all") {
      whereConditions.push(`o.status = $${paramCount}`)
      queryParams.push(status)
      paramCount++
    }

    if (userId) {
      whereConditions.push(`o.user_id = $${paramCount}`)
      queryParams.push(userId)
      paramCount++
    }

    if (whereConditions.length > 0) {
      queryText += ` WHERE ${whereConditions.join(" AND ")}`
    }

    queryText += `
      GROUP BY o.id, p.full_name, p.phone
      ORDER BY o.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `

    queryParams.push(limit, offset)

    const result = await query(queryText, queryParams)
    const orders = result.rows

    // Buscar estatísticas - filtrar por usuário se fornecido
    let statsQuery = "SELECT status, total FROM orders"
    let statsParams = []
    
    if (userId) {
      statsQuery += " WHERE user_id = $1"
      statsParams.push(userId)
    }
    
    const statsResult = await query(statsQuery, statsParams)
    const stats = statsResult.rows

    const statistics = {
      total: stats.length,
      received: stats.filter((o) => o.status === "RECEIVED").length,
      preparing: stats.filter((o) => o.status === "PREPARING").length,
      onTheWay: stats.filter((o) => o.status === "ON_THE_WAY").length,
      delivered: stats.filter((o) => o.status === "DELIVERED").length,
      cancelled: stats.filter((o) => o.status === "CANCELLED").length,
      totalRevenue: stats
        .filter((o) => o.status === "DELIVERED")
        .reduce((sum, o) => sum + Number.parseFloat(o.total), 0),
    }

    return NextResponse.json({
      orders,
      statistics,
      pagination: {
        limit,
        offset,
        hasMore: orders.length === limit,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/orders:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let transactionStarted = false
  
  try {
    console.log("=== POST /api/orders - INÍCIO ===")
    
    const body = await request.json()
    console.log("POST /api/orders - Request body completo:", JSON.stringify(body, null, 2))

    // Extrair e validar dados com logs detalhados
    const user_id = body.customerId || body.user_id
    const items = body.items || []
    const total = Number(body.total || 0)
    const subtotal = Number(body.subtotal || total)
    const delivery_fee = Number(body.delivery_fee || 0)
    const delivery_address = body.address || body.delivery_address || ""
    const delivery_phone = body.phone || body.delivery_phone || ""
    const customer_name = body.name || ""
    const payment_method = body.paymentMethod || body.payment_method || "PIX"
    const delivery_instructions = body.notes || body.delivery_instructions || null

    console.log("Dados extraídos:", {
      user_id,
      items_count: items.length,
      total,
      subtotal,
      delivery_fee,
      delivery_address,
      delivery_phone,
      payment_method,
      delivery_instructions
    })

    // Validações com mensagens específicas
    if (!user_id) {
      console.error("ERRO: ID do usuário não fornecido")
      return NextResponse.json({ 
        error: "ID do usuário é obrigatório",
        details: "user_id não foi fornecido no body da requisição" 
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("ERRO: Itens inválidos ou vazios")
      return NextResponse.json({ 
        error: "Itens do pedido são obrigatórios",
        details: "Array de itens está vazio ou inválido" 
      }, { status: 400 })
    }

    if (!delivery_address) {
      console.error("ERRO: Endereço de entrega obrigatório", { delivery_address })
      return NextResponse.json({ 
        error: "Endereço de entrega é obrigatório",
        details: `Endereço: ${delivery_address || 'vazio'}` 
      }, { status: 400 })
    }

    if (total <= 0) {
      console.error("ERRO: Total inválido", { total })
      return NextResponse.json({ 
        error: "Total do pedido deve ser maior que zero",
        details: `Total recebido: ${total}` 
      }, { status: 400 })
    }

    // Iniciar transação
    console.log("Iniciando transação no banco...")
    await query("BEGIN")
    transactionStarted = true

    try {
      // Atualizar perfil do usuário com nome e telefone se fornecidos e não existirem
      if (customer_name || delivery_phone) {
        console.log("Atualizando perfil do usuário com dados do pedido...")
        
        const profileUpdateFields = []
        const profileUpdateValues = []
        let profileParamCount = 1

        if (customer_name) {
          profileUpdateFields.push(`full_name = COALESCE(full_name, $${profileParamCount})`)
          profileUpdateValues.push(customer_name)
          profileParamCount++
        }

        if (delivery_phone) {
          profileUpdateFields.push(`phone = COALESCE(phone, $${profileParamCount})`)
          profileUpdateValues.push(delivery_phone)
          profileParamCount++
        }

        if (profileUpdateFields.length > 0) {
          profileUpdateValues.push(user_id)
          const profileUpdateQuery = `
            UPDATE profiles 
            SET ${profileUpdateFields.join(', ')}, updated_at = NOW()
            WHERE id = $${profileParamCount}
          `
          await query(profileUpdateQuery, profileUpdateValues)
          console.log("Perfil do usuário atualizado com sucesso")
        }
      }
      // Criar pedido
      console.log("Inserindo pedido no banco com dados:", {
        user_id,
        status: "RECEIVED",
        total,
        subtotal,
        delivery_fee,
        payment_method,
        delivery_address: delivery_address.substring(0, 50) + "...", // Log parcial do endereço
        delivery_phone: delivery_phone || null,
        customer_name: customer_name || null
      })

      const orderResult = await query(
        `
        INSERT INTO orders (
          user_id, status, total, subtotal, delivery_fee, discount,
          payment_method, payment_status, delivery_address, delivery_phone,
          delivery_instructions, estimated_delivery_time, customer_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
        `,
        [
          user_id,
          "RECEIVED",
          total,
          subtotal,
          delivery_fee,
          0, // discount
          payment_method,
          "PENDING",
          delivery_address,
          delivery_phone,
          delivery_instructions,
          new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          customer_name,
        ]
      )

      if (!orderResult.rows || orderResult.rows.length === 0) {
        throw new Error("Falha ao criar pedido - nenhum registro retornado")
      }

      const order = orderResult.rows[0]
      console.log("Pedido criado com sucesso! ID:", order.id)

      // Criar itens do pedido
      console.log(`Inserindo ${items.length} itens do pedido...`)
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const unit_price = Number(item.price || item.unit_price || 0)
        const quantity = Number(item.quantity || 1)
        
        // Limpar product_id removendo caracteres inválidos como "--"
        let product_id = item.product_id || item.id
        if (product_id) {
          product_id = product_id.toString().replace(/--+$/, '') // Remove -- do final
          product_id = product_id.trim() // Remove espaços
        }

        console.log(`Item ${i + 1}:`, {
          product_id_original: item.product_id || item.id,
          product_id_limpo: product_id,
          name: item.name,
          quantity,
          unit_price,
          size: item.size,
          toppings: item.toppings,
          notes: item.notes,
          isHalfAndHalf: item.isHalfAndHalf,
          halfAndHalf: item.halfAndHalf,
          total: quantity * unit_price
        })

        if (!product_id) {
          console.error(`ERRO: Item ${i + 1} sem product_id`)
          throw new Error(`Item ${i + 1} não possui ID do produto`)
        }

        // Validar se é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(product_id)) {
          console.error(`ERRO: Item ${i + 1} com product_id inválido:`, product_id)
          throw new Error(`Item ${i + 1} possui ID de produto inválido: ${product_id}`)
        }

        try {
          // Inserir item com todas as informações
          await query(
            `
            INSERT INTO order_items (
              order_id, product_id, name, quantity, unit_price, total_price,
              size, toppings, special_instructions, half_and_half
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
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
          console.log(`Item ${i + 1} inserido com sucesso com todas as informações`)
        } catch (insertError: any) {
          console.error(`ERRO ao inserir item ${i + 1}:`, insertError)
          throw new Error(`Falha ao inserir item ${i + 1}: ${insertError.message}`)
        }
      }

      console.log("Fazendo COMMIT da transação...")
      await query("COMMIT")
      transactionStarted = false
      console.log("Transação concluída com sucesso!")

      // Sistema de atualização manual via interface administrativa

      // Retornar o pedido criado
      console.log("Pedido criado com sucesso! Retornando resposta...")
      
      return NextResponse.json({
        id: order.id,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
        message: "Pedido criado com sucesso!"
      })
      
    } catch (innerError: any) {
      console.error("ERRO durante criação do pedido:", innerError)
      
      if (transactionStarted) {
        console.log("Fazendo ROLLBACK da transação...")
        await query("ROLLBACK")
      }
      
      throw innerError
    }
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO POST /api/orders ===")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) {
      console.error("Código PostgreSQL:", error.code)
      console.error("Detalhe:", error.detail)
      console.error("Hint:", error.hint)
    }
    
    // Retornar erro detalhado
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
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
