import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')?.trim() || ''
    const codeSearch = searchParams.get('code')?.trim() || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log(`[CUSTOMER_SEARCH] Termo de busca: "${searchTerm}", Código: "${codeSearch}", Limite: ${limit}`)

    // Se não há termo de busca nem código, retornar vazio
    if (!searchTerm && !codeSearch) {
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

    console.log(`[CUSTOMER_SEARCH] Termo normalizado: "${normalizedSearchTerm}", Telefone: "${phoneOnlyNumbers}", Código: "${codeSearch}"`)

    const supabase = getSupabaseServerClient()
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, customer_code, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
    if (error) throw error
    console.log(`[CUSTOMER_SEARCH] Total de perfis encontrados: ${profiles.length}`)

    // Filtrar e processar clientes no frontend
    const matchingCustomers = []
    
    for (const profile of profiles) {
      try {
        const normalizedName = normalizeString(profile.full_name || '')
        const normalizedEmail = normalizeString(profile.email || '')
        const profilePhoneNumbers = (profile.phone || '').replace(/\D/g, '')

        // Verificar se há match
        let shouldInclude = false

        if (codeSearch) {
          // Busca específica por código
          const codeMatch = profile.customer_code && profile.customer_code.toUpperCase().includes(codeSearch.toUpperCase())
          shouldInclude = codeMatch
        } else {
          // Busca normal por nome, email, telefone ou código
          const nameMatch = normalizedName.includes(normalizedSearchTerm)
          const emailMatch = normalizedEmail.includes(normalizedSearchTerm)
          const phoneMatch = phoneOnlyNumbers && profilePhoneNumbers.includes(phoneOnlyNumbers)
          const codeMatch = profile.customer_code && profile.customer_code.toUpperCase().includes(searchTerm.toUpperCase())
          
          shouldInclude = nameMatch || emailMatch || phoneMatch || codeMatch
        }

        if (shouldInclude) {
          const { data: address } = await supabase
            .from('customer_addresses')
            .select('street, number, neighborhood, city, state, complement, zip_code, is_default, created_at')
            .eq('user_id', profile.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
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

          const { data: orderRows } = await supabase
            .from('orders')
            .select('total')
            .eq('user_id', profile.id)
          const totalOrders = (orderRows || []).length
          const totalSpent = (orderRows || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)

          matchingCustomers.push({
            id: profile.id,
            customer_code: profile.customer_code,
            name: profile.full_name || 'Nome não informado',
            phone: profile.phone || 'Telefone não informado',
            email: profile.email || 'Email não informado',
            address: fullAddress,
            totalOrders,
            totalSpent,
            createdAt: profile.created_at,
            // Destacar o termo encontrado
            matchType: ((): 'name' | 'email' | 'phone' => {
              if (codeSearch) return 'name'
              const nameMatch = normalizedName.includes(normalizedSearchTerm)
              const emailMatch = normalizedEmail.includes(normalizedSearchTerm)
              return nameMatch ? 'name' : emailMatch ? 'email' : 'phone'
            })()
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

    const supabase = getSupabaseServerClient()
    const { data: existingByPhone } = await supabase.from('profiles').select('id').eq('phone', phone).eq('role', 'customer').limit(1)
    if ((existingByPhone || []).length > 0) {
      return NextResponse.json({ 
        error: "Já existe um cliente cadastrado com este telefone" 
      }, { status: 400 })
    }

    // Gerar email se não fornecido
    const customerEmail = email?.trim() || `cliente_${cleanPhone}@temp.williamdiskpizza.com`

    const { data: existingByEmail } = await supabase.from('profiles').select('id').eq('email', customerEmail).limit(1)
    if ((existingByEmail || []).length > 0) {
      return NextResponse.json({ 
        error: "Este e-mail já está cadastrado" 
      }, { status: 400 })
    }

    const { data: newCustomer, error: insertErr } = await supabase
      .from('profiles')
      .insert({ email: customerEmail, full_name: name.trim(), role: 'customer', password_hash: '$2b$10$defaulthashforcustomer', phone })
      .select('id, email, full_name, phone, customer_code, created_at')
      .single()
    if (insertErr) throw insertErr

    console.log("[CUSTOMER_SEARCH] Cliente criado:", newCustomer)

    // Se endereço foi fornecido, criar endereço
    if (address?.street && address?.number) {
      await supabase.from('customer_addresses').insert({
        user_id: newCustomer.id,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood || 'Centro',
        city: address.city || 'Cidade',
        state: address.state || 'SP',
        zip_code: address.zipCode || '00000-000',
        label: 'Principal',
        is_default: true,
      })
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