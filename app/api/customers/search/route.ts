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

    // Buscar clientes usando Supabase
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("[CUSTOMER_SEARCH] Erro ao buscar perfis:", error)
      throw error
    }

    console.log(`[CUSTOMER_SEARCH] Total de perfis encontrados: ${profiles?.length || 0}`)

    // Filtrar e processar clientes no frontend
    const matchingCustomers = []
    
    for (const profile of profiles || []) {
      const customerNameNormalized = normalizeString(profile.full_name || '')
      const customerPhoneClean = (profile.phone || '').replace(/\D/g, '')
      
      // Verificar correspondências
      const nameMatches = normalizedSearchTerm.length > 0 && customerNameNormalized.includes(normalizedSearchTerm)
      const phoneMatches = phoneOnlyNumbers.length > 0 && customerPhoneClean.includes(phoneOnlyNumbers)
      
      if (nameMatches || phoneMatches) {
        // Buscar endereço principal do cliente
        const { data: addresses } = await supabase
          .from('customer_addresses')
          .select('street, number, neighborhood, city, state, complement')
          .eq('user_id', profile.id)
          .eq('is_default', true)
          .limit(1)

        // Buscar estatísticas de pedidos
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)

        // Construir endereço principal
        let primaryAddress = 'Endereço não cadastrado'
        if (addresses && addresses.length > 0) {
          const addr = addresses[0]
          const parts = [
            `${addr.street}, ${addr.number}`,
            addr.complement ? `(${addr.complement})` : '',
            addr.neighborhood,
            `${addr.city}/${addr.state}`
          ].filter(Boolean)
          primaryAddress = parts.join(' - ')
        }

        // Calcular prioridade para ordenação (aplicar lógica CASE WHEN no frontend)
        let priority = 3 // padrão
        if (customerNameNormalized === normalizedSearchTerm || customerPhoneClean === phoneOnlyNumbers) {
          priority = 1 // correspondência exata
        } else if (customerNameNormalized.startsWith(normalizedSearchTerm) || customerPhoneClean.startsWith(phoneOnlyNumbers)) {
          priority = 2 // começa com
        }

        matchingCustomers.push({
          id: profile.id,
          name: profile.full_name || 'Nome não informado',
          phone: profile.phone || '',
          email: profile.email || '',
          primaryAddress,
          totalOrders: totalOrders || 0,
          createdAt: profile.created_at,
          priority // para ordenação
        })
      }
    }

    // Ordenar por prioridade e depois por data de criação
    matchingCustomers.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Aplicar limite e remover campo priority
    const finalCustomers = matchingCustomers
      .slice(0, limit)
      .map(({ priority, ...customer }) => customer)

    console.log(`[CUSTOMER_SEARCH] Clientes encontrados: ${finalCustomers.length}`)

    return NextResponse.json({ customers: finalCustomers })

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

    // Verificar se já existe cliente com este telefone usando Supabase
    const { data: existingByPhone } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .eq('role', 'customer')
      .limit(1)

    if (existingByPhone && existingByPhone.length > 0) {
      return NextResponse.json({ 
        error: "Já existe um cliente cadastrado com este telefone" 
      }, { status: 400 })
    }

    // Gerar email se não fornecido
    const customerEmail = email?.trim() || `cliente_${cleanPhone}@temp.williamdiskpizza.com`

    // Verificar se email já existe usando Supabase
    const { data: existingByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .limit(1)

    if (existingByEmail && existingByEmail.length > 0) {
      return NextResponse.json({ 
        error: "Este e-mail já está cadastrado" 
      }, { status: 400 })
    }

    // Criar perfil do cliente usando Supabase
    const { data: newCustomer, error: profileError } = await supabase
      .from('profiles')
      .insert({
        full_name: name.trim(),
        phone: phone,
        email: customerEmail,
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, full_name, phone, email, created_at')
      .single()

    if (profileError) {
      console.error("[CUSTOMER_SEARCH] Erro ao criar perfil:", profileError)
      throw profileError
    }

    // Criar endereço se fornecido
    let primaryAddress = null
    if (address && address.street?.trim()) {
      // Validar campos obrigatórios do endereço
      const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zip_code']
      for (const field of requiredFields) {
        if (!address[field]?.trim()) {
          return NextResponse.json({
            error: `Campo ${field} do endereço é obrigatório`
          }, { status: 400 })
        }
      }

      // Validar CEP
      const cleanZipCode = address.zip_code.replace(/\D/g, '')
      if (cleanZipCode.length !== 8) {
        return NextResponse.json({
          error: "CEP deve ter 8 dígitos"
        }, { status: 400 })
      }

      // Validar estado
      if (address.state.length !== 2) {
        return NextResponse.json({
          error: "Estado deve ter 2 caracteres (UF)"
        }, { status: 400 })
      }

      // Inserir endereço usando Supabase
      const { data: addressData, error: addressError } = await supabase
        .from('customer_addresses')
        .insert({
          user_id: newCustomer.id,
          label: 'Endereço Principal',
          street: address.street.trim(),
          number: address.number.trim(),
          complement: address.complement?.trim() || '',
          neighborhood: address.neighborhood.trim(),
          city: address.city.trim(),
          state: address.state.trim().toUpperCase(),
          zip_code: cleanZipCode,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (addressError) {
        console.error("[CUSTOMER_SEARCH] Erro ao criar endereço:", addressError)
        // Não falhar se o endereço não for criado, apenas logar o erro
      } else {
        primaryAddress = addressData
      }
    }

    console.log("[CUSTOMER_SEARCH] Cliente criado com sucesso:", newCustomer.id)

    return NextResponse.json({
      customer: {
        id: newCustomer.id,
        name: newCustomer.full_name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        primaryAddress: primaryAddress ? 
          `${primaryAddress.street}, ${primaryAddress.number} - ${primaryAddress.neighborhood} - ${primaryAddress.city}/${primaryAddress.state}` :
          'Endereço não cadastrado',
        totalOrders: 0,
        createdAt: newCustomer.created_at
      }
    })

  } catch (error: any) {
    console.error("[CUSTOMER_SEARCH] Erro ao criar cliente:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: error.message
    }, { status: 500 })
  }
} 