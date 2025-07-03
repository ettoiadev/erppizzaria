import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')?.trim()
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ customers: [] })
    }

    console.log(`[CUSTOMER_SEARCH] Buscando clientes com termo: "${searchTerm}"`)

    // Normalizar termo de busca (remover acentos e converter para minúsculas)
    const normalizeString = (str: string) => {
      return str.normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '')
               .toLowerCase()
               .trim()
    }

    const normalizedSearchTerm = normalizeString(searchTerm)
    const phoneOnlyNumbers = searchTerm.replace(/\D/g, '')

    console.log(`[CUSTOMER_SEARCH] Termo normalizado: "${normalizedSearchTerm}", Telefone: "${phoneOnlyNumbers}"`)

    // Buscar clientes por nome ou telefone com correspondência estrita
    const searchQuery = `
      SELECT 
        p.id,
        p.full_name as name,
        p.phone,
        p.email,
        p.created_at,
        -- Buscar endereço principal
        (
          SELECT json_build_object(
            'id', ca.id,
            'street', ca.street,
            'number', ca.number,
            'complement', ca.complement,
            'neighborhood', ca.neighborhood,
            'city', ca.city,
            'state', ca.state,
            'zip_code', ca.zip_code,
            'label', ca.label,
            'is_default', ca.is_default
          )
          FROM customer_addresses ca 
          WHERE ca.user_id = p.id 
          ORDER BY ca.is_default DESC, ca.created_at DESC 
          LIMIT 1
        ) as primary_address,
        -- Contar pedidos
        (
          SELECT COUNT(*) 
          FROM orders o 
          WHERE o.user_id = p.id
        ) as total_orders
      FROM profiles p
      WHERE p.role = 'customer'
        AND (
          -- Busca no nome (case insensitive, apenas se o termo não for vazio)
          (
            LENGTH($1) > 0 AND 
            LOWER(p.full_name) LIKE LOWER($2)
          )
          OR
          -- Busca no telefone (apenas números, apenas se o termo não for vazio)
          (
            LENGTH($3) > 0 AND 
            TRANSLATE(p.phone, '()- .', '') LIKE $4
          )
        )
      ORDER BY 
        -- Priorizar correspondências exatas e por início
        CASE 
          WHEN LOWER(p.full_name) = LOWER($5) THEN 1
          WHEN TRANSLATE(p.phone, '()- .', '') = $6 THEN 1
          WHEN LOWER(p.full_name) LIKE LOWER($7) THEN 2
          WHEN TRANSLATE(p.phone, '()- .', '') LIKE $8 THEN 2
          ELSE 3
        END,
        p.created_at DESC
      LIMIT $9
    `

    const searchPattern = `%${normalizedSearchTerm}%`
    const phonePattern = `%${phoneOnlyNumbers}%`
    const exactTerm = normalizedSearchTerm
    const exactPhone = phoneOnlyNumbers
    const startPattern = `${normalizedSearchTerm}%`
    const startPhonePattern = `${phoneOnlyNumbers}%`

    const result = await query(searchQuery, [
      normalizedSearchTerm,  // $1 - termo normalizado para verificação
      searchPattern,         // $2 - nome pattern
      phoneOnlyNumbers,      // $3 - telefone para verificação
      phonePattern,          // $4 - telefone pattern
      exactTerm,             // $5 - nome exato
      exactPhone,            // $6 - telefone exato
      startPattern,          // $7 - nome começa com
      startPhonePattern,     // $8 - telefone começa com
      limit                  // $9 - limit
    ])

    const rawCustomers = result.rows.map((customer: any) => ({
      id: customer.id,
      name: customer.name || 'Nome não informado',
      phone: customer.phone || '',
      email: customer.email || '',
      primaryAddress: customer.primary_address,
      totalOrders: parseInt(customer.total_orders) || 0,
      createdAt: customer.created_at
    }))

    console.log(`[CUSTOMER_SEARCH] Clientes brutos encontrados: ${rawCustomers.length}`)

         // Filtragem adicional no JavaScript para garantir correspondência precisa
     const filteredCustomers = rawCustomers.filter(customer => {
       const customerNameNormalized = normalizeString(customer.name)
       const customerPhoneClean = customer.phone.replace(/\D/g, '')
       
       // Verificar se o termo de busca realmente existe no nome ou telefone
       const nameMatches = normalizedSearchTerm.length > 0 && customerNameNormalized.includes(normalizedSearchTerm)
       const phoneMatches = phoneOnlyNumbers.length > 0 && customerPhoneClean.includes(phoneOnlyNumbers)
       
       const matches = nameMatches || phoneMatches
       
       console.log(`[CUSTOMER_SEARCH] Cliente "${customer.name}":`, {
         customerNameNormalized,
         customerPhoneClean,
         searchTerm: normalizedSearchTerm,
         phoneSearchTerm: phoneOnlyNumbers,
         nameMatches,
         phoneMatches,
         finalMatch: matches
       })
       
       return matches
     })

    console.log(`[CUSTOMER_SEARCH] Clientes filtrados: ${filteredCustomers.length}`)

    return NextResponse.json({ customers: filteredCustomers })

  } catch (error: any) {
    console.error("[CUSTOMER_SEARCH] Erro na busca:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
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
    const existingCustomer = await query(
      'SELECT id FROM profiles WHERE phone = $1 AND role = $2',
      [phone, 'customer']
    )

    if (existingCustomer.rows.length > 0) {
      return NextResponse.json({ 
        error: "Já existe um cliente cadastrado com este telefone" 
      }, { status: 400 })
    }

    // Gerar email se não fornecido
    const customerEmail = email?.trim() || `cliente_${cleanPhone}@temp.williamdiskpizza.com`

    // Verificar se email já existe
    const existingEmail = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [customerEmail]
    )

    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ 
        error: "Este e-mail já está cadastrado" 
      }, { status: 400 })
    }

    // Iniciar transação
    await query('BEGIN')

    try {
      // Criar perfil do cliente
      const profileResult = await query(
        `INSERT INTO profiles (full_name, phone, email, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, full_name as name, phone, email, created_at`,
        [name.trim(), phone, customerEmail, 'customer']
      )

      const newCustomer = profileResult.rows[0]

      // Criar endereço se fornecido
      let primaryAddress = null
      if (address && address.street?.trim()) {
        // Validar campos obrigatórios do endereço
        const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zip_code']
        for (const field of requiredFields) {
          if (!address[field]?.trim()) {
            throw new Error(`Campo ${field} do endereço é obrigatório`)
          }
        }

        // Validar CEP
        const cleanZipCode = address.zip_code.replace(/\D/g, '')
        if (cleanZipCode.length !== 8) {
          throw new Error("CEP deve ter 8 dígitos")
        }

        // Validar estado
        if (address.state.length !== 2) {
          throw new Error("Estado deve ter 2 caracteres (UF)")
        }

        const addressResult = await query(
          `INSERT INTO customer_addresses 
           (user_id, label, street, number, complement, neighborhood, city, state, zip_code, is_default, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING *`,
          [
            newCustomer.id,
            'Endereço Principal',
            address.street.trim(),
            address.number.trim(),
            address.complement?.trim() || '',
            address.neighborhood.trim(),
            address.city.trim(),
            address.state.trim().toUpperCase(),
            cleanZipCode,
            true // primeiro endereço é sempre padrão
          ]
        )

        primaryAddress = addressResult.rows[0]
      }

      // Commit da transação
      await query('COMMIT')

      console.log("[CUSTOMER_SEARCH] Cliente criado com sucesso:", newCustomer.id)

      return NextResponse.json({
        customer: {
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          primaryAddress: primaryAddress ? {
            id: primaryAddress.id,
            street: primaryAddress.street,
            number: primaryAddress.number,
            complement: primaryAddress.complement,
            neighborhood: primaryAddress.neighborhood,
            city: primaryAddress.city,
            state: primaryAddress.state,
            zip_code: primaryAddress.zip_code,
            label: primaryAddress.label,
            is_default: primaryAddress.is_default
          } : null,
          totalOrders: 0,
          createdAt: newCustomer.created_at
        }
      })

    } catch (innerError: any) {
      await query('ROLLBACK')
      throw innerError
    }

  } catch (error: any) {
    console.error("[CUSTOMER_SEARCH] Erro ao criar cliente:", error)
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor" 
    }, { status: 500 })
  }
} 