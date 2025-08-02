import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/postgres'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')?.trim() || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log(`[CUSTOMER_SEARCH] Termo de busca: "${searchTerm}", Limite: ${limit}`)

    if (!searchTerm) {
      return NextResponse.json({ customers: [] })
    }

    // Função para normalizar strings (remover acentos, converter para minúsculas)
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .trim()
    }

    const normalizedSearchTerm = normalizeString(searchTerm)
    const phoneOnlyNumbers = searchTerm.replace(/\D/g, '') // Apenas números do telefone

    console.log(`[CUSTOMER_SEARCH] Termo normalizado: "${normalizedSearchTerm}", Telefone: "${phoneOnlyNumbers}"`)

    // Buscar clientes usando PostgreSQL
    const profilesResult = await query(`
      SELECT id, full_name, phone, email, customer_code, created_at
      FROM profiles 
      WHERE role = 'customer'
      ORDER BY created_at DESC
    `);

    const profiles = profilesResult.rows;
    console.log(`[CUSTOMER_SEARCH] Total de perfis encontrados: ${profiles.length}`)

    // Filtrar e processar clientes no frontend
    const matchingCustomers = []
    
    for (const profile of profiles) {
      try {
        const normalizedName = normalizeString(profile.full_name || '')
        const normalizedEmail = normalizeString(profile.email || '')
        const profilePhoneNumbers = (profile.phone || '').replace(/\D/g, '')

        // Verificar se há match
        const nameMatch = normalizedName.includes(normalizedSearchTerm)
        const emailMatch = normalizedEmail.includes(normalizedSearchTerm)
        const phoneMatch = phoneOnlyNumbers && profilePhoneNumbers.includes(phoneOnlyNumbers)
        const codeMatch = profile.customer_code && profile.customer_code.includes(searchTerm.toUpperCase())

        if (nameMatch || emailMatch || phoneMatch || codeMatch) {
          // Buscar endereço principal
          const addressResult = await query(`
            SELECT street, number, neighborhood, city, state, complement, zip_code
            FROM customer_addresses 
            WHERE user_id = $1
            ORDER BY is_default DESC, created_at DESC
            LIMIT 1
          `, [profile.id]);

          const address = addressResult.rows[0];
          
          // Montar endereço completo
          let fullAddress = 'Endereço não cadastrado'
          if (address) {
            const parts = [
              address.street,
              address.number,
              address.neighborhood,
              address.city,
              address.state
            ].filter(Boolean)
            
            if (parts.length > 0) {
              fullAddress = parts.join(', ')
            }
          }

          // Buscar estatísticas de pedidos
          const ordersResult = await query(`
            SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent
            FROM orders 
            WHERE user_id = $1
          `, [profile.id]);

          const orderStats = ordersResult.rows[0];

          matchingCustomers.push({
            id: profile.id,
            customer_code: profile.customer_code,
            name: profile.full_name || 'Nome não informado',
            phone: profile.phone || 'Telefone não informado',
            email: profile.email || 'Email não informado',
            address: fullAddress,
            totalOrders: parseInt(orderStats.total_orders) || 0,
            totalSpent: parseFloat(orderStats.total_spent) || 0,
            createdAt: profile.created_at,
            // Destacar o termo encontrado
            matchType: nameMatch ? 'name' : emailMatch ? 'email' : 'phone'
          })

          // Limitar resultados
          if (matchingCustomers.length >= limit) {
            break
          }
        }
      } catch (error) {
        console.warn(`[CUSTOMER_SEARCH] Erro ao processar cliente ${profile.id}:`, error)
      }
    }

    console.log(`[CUSTOMER_SEARCH] Retornando ${matchingCustomers.length} clientes encontrados`)

    return NextResponse.json({
      customers: matchingCustomers,
      total: matchingCustomers.length,
      searchTerm: searchTerm
    })

  } catch (error: any) {
    console.error("[CUSTOMER_SEARCH] Erro na busca:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível realizar a busca",
      customers: [] 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, address } = body

    console.log("[CUSTOMER_SEARCH] Criando novo cliente:", { name, phone, email })

    // Validações
    if (!name?.trim()) {
      return NextResponse.json({ 
        error: "Nome é obrigatório" 
      }, { status: 400 })
    }

    if (!phone?.trim()) {
      return NextResponse.json({ 
        error: "Telefone é obrigatório" 
      }, { status: 400 })
    }

    // Limpar telefone (apenas números)
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ 
        error: "Telefone deve ter pelo menos 10 dígitos" 
      }, { status: 400 })
    }

    // Verificar se já existe cliente com este telefone
    const existingByPhoneResult = await query(`
      SELECT id FROM profiles 
      WHERE phone = $1 AND role = 'customer'
      LIMIT 1
    `, [phone]);

    if (existingByPhoneResult.rows.length > 0) {
      return NextResponse.json({ 
        error: "Já existe um cliente cadastrado com este telefone" 
      }, { status: 400 })
    }

    // Gerar email se não fornecido
    const customerEmail = email?.trim() || `cliente_${cleanPhone}@temp.williamdiskpizza.com`

    // Verificar se email já existe
    const existingByEmailResult = await query(`
      SELECT id FROM profiles 
      WHERE email = $1
      LIMIT 1
    `, [customerEmail]);

    if (existingByEmailResult.rows.length > 0) {
      return NextResponse.json({ 
        error: "Este e-mail já está cadastrado" 
      }, { status: 400 })
    }

    // Criar perfil do cliente
    const newCustomerResult = await query(`
      INSERT INTO profiles (email, full_name, role, password_hash, phone, created_at, updated_at)
      VALUES ($1, $2, 'customer', '$2b$10$defaulthashforcustomer', $3, NOW(), NOW())
      RETURNING id, email, full_name, phone, customer_code, created_at
    `, [customerEmail, name.trim(), phone]);

    const newCustomer = newCustomerResult.rows[0];

    console.log("[CUSTOMER_SEARCH] Cliente criado:", newCustomer)

    // Se endereço foi fornecido, criar endereço
    if (address?.street && address?.number) {
      await query(`
        INSERT INTO customer_addresses (
          user_id, street, number, complement, neighborhood, city, state, zip_code, label, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Principal', true)
      `, [
        newCustomer.id,
        address.street,
        address.number,
        address.complement || '',
        address.neighborhood || 'Centro',
        address.city || 'Cidade',
        address.state || 'SP',
        address.zipCode || '00000-000'
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Cliente criado com sucesso",
      customer: {
        id: newCustomer.id,
        customer_code: newCustomer.customer_code,
        name: newCustomer.full_name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: address ? `${address.street}, ${address.number}` : 'Endereço não cadastrado',
        totalOrders: 0,
        totalSpent: 0,
        createdAt: newCustomer.created_at
      }
    })

  } catch (error: any) {
    console.error("[CUSTOMER_SEARCH] Erro ao criar cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível criar o cliente",
      details: error.message
    }, { status: 500 })
  }
}