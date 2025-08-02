import { type NextRequest, NextResponse } from "next/server"
import { query, withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    console.log("Verificando se o cliente existe...")

    // Verificar se o cliente existe usando PostgreSQL
    const customerResult = await query(`
      SELECT id, full_name, phone FROM profiles 
      WHERE id = $1 AND role = 'customer'
    `, [userId]);

    if (customerResult.rows.length === 0) {
      return NextResponse.json({
        error: "Cliente não encontrado ou inválido"
      }, { status: 404 })
    }

    const customer = customerResult.rows[0];
    console.log("Cliente encontrado:", customer.full_name)

    // Usar transação para garantir consistência
    const result = await withTransaction(async (client) => {
      // Criar pedido manual
      console.log("Criando pedido manual...")
      const orderResult = await client.query(`
        INSERT INTO orders (
          user_id, status, total, subtotal, delivery_fee, discount,
          payment_method, payment_status, customer_address, customer_phone,
          notes, estimated_delivery_time, customer_name, created_at, updated_at
        ) VALUES (
          $1, 'RECEIVED', $2, $3, $4, 0, $5, 'PENDING', $6, $7, $8, 
          NOW() + INTERVAL '45 minutes', $9, NOW(), NOW()
        ) RETURNING *
      `, [
        userId, total, subtotal, delivery_fee, paymentMethod,
        finalDeliveryAddress, customerPhone, notes || null, customerName
      ]);

      if (orderResult.rows.length === 0) {
        throw new Error('Falha ao criar pedido manual');
      }

      const order = orderResult.rows[0];
      console.log("Pedido manual criado com sucesso! ID:", order.id)

      // Inserir itens do pedido
      console.log(`Inserindo ${items.length} itens no pedido manual...`)
      
      const orderItems = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const unit_price = Number(item.price || item.unit_price || 0)
        const quantity = Number(item.quantity || 1)
        
        // Limpar product_id
        let product_id = item.product_id || item.id
        if (product_id) {
          product_id = product_id.toString().replace(/--+$/, '').trim()
        }

        console.log(`Preparando item ${i + 1}:`, {
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

        orderItems.push({
          order_id: order.id,
          product_id: product_id,
          name: item.name || '',
          quantity: quantity,
          unit_price: unit_price,
          total_price: quantity * unit_price,
          size: item.size || null,
          toppings: JSON.stringify(item.toppings || []),
          special_instructions: item.notes || null,
          half_and_half: item.halfAndHalf ? JSON.stringify(item.halfAndHalf) : null
        })
      }

      // Inserir todos os itens de uma vez
      if (orderItems.length > 0) {
        const itemsQuery = `
          INSERT INTO order_items (
            order_id, product_id, name, quantity, unit_price, total_price,
            size, toppings, special_instructions, half_and_half
          ) VALUES ${orderItems.map((_, index) => {
            const base = index * 10;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`
          }).join(', ')}
        `;

        const itemsValues = orderItems.flatMap(item => [
          item.order_id, item.product_id, item.name, item.quantity,
          item.unit_price, item.total_price, item.size, item.toppings,
          item.special_instructions, item.half_and_half
        ]);

        await client.query(itemsQuery, itemsValues);
      }

      console.log("Todos os itens inseridos com sucesso!")

      // Buscar pedido completo com itens para retornar
      const completeOrderResult = await client.query(`
        SELECT 
          o.*,
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
              'half_and_half', oi.half_and_half
            )
          ) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [order.id]);

      return completeOrderResult.rows[0] || order;
    });

    console.log("Pedido manual criado com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Pedido manual criado com sucesso!",
      order: result,
      orderId: result.id
    })

  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO POST /api/orders/manual ===")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    if (error.code) {
      console.error("Código:", error.code)
      console.error("Detalhe:", error.details)
    }

    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
      message: error.message || "Não foi possível criar o pedido manual",
      details: {
        type: error.constructor.name,
        code: error.code,
        message: error.message
      }
    }, { status: 500 })
  }
}