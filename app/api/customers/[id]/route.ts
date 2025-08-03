import { NextRequest, NextResponse } from "next/server"
import { query, withTransaction } from '@/lib/postgres'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id

    // Buscar cliente específico
    const customerResult = await query(`
      SELECT id, email, full_name, phone, customer_code, created_at, updated_at, role
      FROM profiles 
      WHERE id = $1 AND role = 'customer'
    `, [customerId])

    if (customerResult.rows.length === 0) {
      return NextResponse.json({
        error: "Cliente não encontrado"
      }, { status: 404 })
    }

    const customer = customerResult.rows[0]

    // Buscar endereço principal do cliente
    const addressResult = await query(`
      SELECT id, street, number, neighborhood, city, state, complement, zip_code, label, is_default
      FROM customer_addresses 
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      LIMIT 1
    `, [customer.id])

    const address = addressResult.rows[0]

    return NextResponse.json({
      id: customer.id,
      customer_code: customer.customer_code,
      name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: {
        id: address?.id || null,
        street: address?.street || '',
        number: address?.number || '',
        neighborhood: address?.neighborhood || '',
        city: address?.city || '',
        state: address?.state || '',
        complement: address?.complement || '',
        zip_code: address?.zip_code || ''
      }
    })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao buscar cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    const body = await request.json()
    const { name, email, phone, address } = body

    // Validar dados obrigatórios
    if (!name || !email) {
      return NextResponse.json({
        error: "Nome e email são obrigatórios"
      }, { status: 400 })
    }

    // Verificar se o email já está em uso por outro cliente
    if (email) {
      const emailCheckResult = await query(`
        SELECT id FROM profiles 
        WHERE email = $1 AND id != $2
      `, [email, customerId])

      if (emailCheckResult.rows.length > 0) {
        return NextResponse.json({
          error: "Este email já está em uso por outro cliente"
        }, { status: 400 })
      }
    }

    const result = await withTransaction(async (client) => {
      // Atualizar dados do cliente
      await client.query(`
        UPDATE profiles 
        SET full_name = $1, email = $2, phone = $3, updated_at = NOW()
        WHERE id = $4 AND role = 'customer'
      `, [name, email, phone, customerId])

      // Se tem dados de endereço, atualizar ou criar
      if (address && (address.street || address.city)) {
        // Verificar se já existe endereço
        const existingAddressResult = await client.query(`
          SELECT id FROM customer_addresses 
          WHERE user_id = $1
          ORDER BY is_default DESC, created_at DESC
          LIMIT 1
        `, [customerId])

        if (existingAddressResult.rows.length > 0) {
          // Atualizar endereço existente
          await client.query(`
            UPDATE customer_addresses 
            SET street = $1, number = $2, neighborhood = $3, city = $4, 
                state = $5, complement = $6, zip_code = $7, updated_at = NOW()
            WHERE id = $8
          `, [
            address.street || '',
            address.number || '',
            address.neighborhood || '',
            address.city || '',
            address.state || '',
            address.complement || '',
            address.zip_code || '',
            existingAddressResult.rows[0].id
          ])
        } else {
          // Criar novo endereço
          await client.query(`
            INSERT INTO customer_addresses 
            (user_id, street, number, neighborhood, city, state, complement, zip_code, label, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            customerId,
            address.street || '',
            address.number || '',
            address.neighborhood || '',
            address.city || '',
            address.state || '',
            address.complement || '',
            address.zip_code || '',
            'Principal',
            true
          ])
        }
      }

      return { success: true }
    })

    return NextResponse.json({
      success: true,
      message: "Cliente atualizado com sucesso"
    })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao atualizar cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id

    // Verificar se o cliente existe
    const customerResult = await query(`
      SELECT id, customer_code FROM profiles 
      WHERE id = $1 AND role = 'customer'
    `, [customerId])

    if (customerResult.rows.length === 0) {
      return NextResponse.json({
        error: "Cliente não encontrado"
      }, { status: 404 })
    }

    const customer = customerResult.rows[0]

    // Verificar se o cliente tem pedidos
    const ordersResult = await query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE user_id = $1
    `, [customerId])

    const hasOrders = parseInt(ordersResult.rows[0].count) > 0

    await withTransaction(async (client) => {
      if (hasOrders) {
        // Se tem pedidos, anonimizar os dados em vez de excluir
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        
        await client.query(`
          UPDATE profiles 
          SET 
            full_name = $1,
            email = $2,
            phone = NULL,
            updated_at = NOW()
          WHERE id = $3 AND role = 'customer'
        `, [
          `[EXCLUÍDO] Cliente #${customer.customer_code || 'N/A'}`,
          `excluido.${timestamp}@sistema.local`,
          customerId
        ])

        // Excluir endereços (dados sensíveis)
        await client.query(`
          DELETE FROM customer_addresses 
          WHERE user_id = $1
        `, [customerId])

        console.log(`[CUSTOMERS] Cliente com pedidos anonimizado: ${customer.customer_code}`)
        
      } else {
        // Se não tem pedidos, pode excluir completamente
        // Excluir endereços do cliente
        await client.query(`
          DELETE FROM customer_addresses 
          WHERE user_id = $1
        `, [customerId])

        // Excluir o cliente
        await client.query(`
          DELETE FROM profiles 
          WHERE id = $1 AND role = 'customer'
        `, [customerId])

        // Verificar se este era o último cliente na sequência de códigos
        // e disponibilizar o código para reuso se necessário
        if (customer.customer_code) {
          const maxCodeResult = await client.query(`
            SELECT MAX(customer_code) as max_code FROM profiles 
            WHERE role = 'customer' AND customer_code IS NOT NULL
          `)

          const maxCode = maxCodeResult.rows[0]?.max_code
          
          console.log(`[CUSTOMERS] Cliente excluído tinha código ${customer.customer_code}, máximo atual: ${maxCode}`)
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: hasOrders 
        ? "Cliente anonimizado com sucesso (dados pessoais removidos, pedidos preservados)"
        : "Cliente excluído com sucesso"
    })

  } catch (error: any) {
    console.error("[CUSTOMERS] Erro ao excluir cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}