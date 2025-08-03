import { query, withTransaction } from './postgres'

// Interface para tipagem de usuário
export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'admin' | 'kitchen' | 'delivery'
  password_hash?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

// Interface para produtos
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  category_id?: number
  image?: string
  available: boolean
  show_image: boolean
  sizes?: any
  toppings?: any
  active: boolean
  product_number?: number
  category_name?: string
}

// Interface para pedidos
export interface Order {
  id: number
  user_id?: string
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED'
  payment_method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX'
  delivery_type: 'delivery' | 'pickup'
  driver_id?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

// =============================================
// FUNÇÕES DE AUTENTICAÇÃO E USUÁRIOS
// =============================================

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    if (!email?.trim()) {
      console.log('getUserByEmail: Email vazio fornecido')
      return null
    }

    console.log('🔍 Buscando usuário:', email)
    
    const result = await query(
      'SELECT id, email, full_name, role, password_hash, phone, created_at, updated_at FROM public.profiles WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (result.rows.length === 0) {
      console.log('👤 Usuário não encontrado:', email)
      return null
    }

    const user = result.rows[0]
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password_hash
    })

    return user
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuário:', error.message)
    return null
  }
}

export async function createUserProfile(userData: {
  email: string
  full_name: string
  role?: string
  password_hash: string
  phone?: string
}): Promise<UserProfile | null> {
  try {
    console.log('👤 Criando usuário:', userData.email)
    
    const result = await query(
      `INSERT INTO public.profiles (email, full_name, role, password_hash, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, full_name, role, password_hash, phone, created_at, updated_at`,
      [
        userData.email.toLowerCase(),
        userData.full_name,
        userData.role || 'customer',
        userData.password_hash,
        userData.phone
      ]
    )

    if (result.rows.length === 0) {
      throw new Error('Falha ao criar usuário')
    }

    const user = result.rows[0]
    console.log('✅ Usuário criado:', user.email)
    return user
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error.message)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const fields = []
    const values = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (fields.length === 0) {
      return true
    }

    values.push(userId)
    const updateQuery = `UPDATE public.profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`
    
    await query(updateQuery, values)
    
    console.log('✅ Perfil atualizado:', userId)
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar perfil:', error.message)
    return false
  }
}

// =============================================
// FUNÇÕES DE PRODUTOS
// =============================================

export async function getProducts(includeInactive = false): Promise<Product[]> {
  try {
    let queryText = `
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id, p.image, 
        p.available, p.show_image, p.sizes, p.toppings, p.active, p.product_number,
        c.name as category_name
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
    `
    
    const params = []
    if (!includeInactive) {
      queryText += ' WHERE p.active = true'
    }

    queryText += ' ORDER BY p.product_number ASC NULLS LAST, p.created_at ASC'

    const result = await query(queryText, params)
    
    console.log(`📦 ${result.rows.length} produtos carregados`)
    return result.rows
  } catch (error: any) {
    console.error('❌ Erro ao carregar produtos:', error.message)
    return []
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const result = await query(
      `SELECT 
        p.*, 
        c.name as category_name
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE p.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error: any) {
    console.error('❌ Erro ao carregar produto:', error.message)
    return null
  }
}

export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  try {
    const result = await query(
      `INSERT INTO public.products (
        name, description, price, category_id, image, available, 
        show_image, sizes, toppings, active, product_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        productData.name,
        productData.description,
        productData.price,
        productData.category_id,
        productData.image,
        productData.available,
        productData.show_image,
        productData.sizes,
        productData.toppings,
        productData.active,
        productData.product_number
      ]
    )

    if (result.rows.length === 0) {
      throw new Error('Falha ao criar produto')
    }

    const product = result.rows[0]
    console.log('✅ Produto criado:', product.name)
    return product
  } catch (error: any) {
    console.error('❌ Erro ao criar produto:', error.message)
    return null
  }
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<boolean> {
  try {
    const fields = []
    const values = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (fields.length === 0) {
      return true
    }

    values.push(id)
    const updateQuery = `UPDATE public.products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`
    
    await query(updateQuery, values)
    
    console.log('✅ Produto atualizado:', id)
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar produto:', error.message)
    return false
  }
}

// =============================================
// FUNÇÕES DE CATEGORIAS
// =============================================

export async function getCategories(includeInactive = false) {
  try {
    let queryText = 'SELECT * FROM public.categories'
    
    if (!includeInactive) {
      queryText += ' WHERE active = true'
    }

    queryText += ' ORDER BY sort_order ASC'

    const result = await query(queryText)

    console.log(`📂 ${result.rows.length} categorias carregadas`)
    return result.rows
  } catch (error: any) {
    console.error('❌ Erro ao carregar categorias:', error.message)
    return []
  }
}

// =============================================
// FUNÇÕES DE PEDIDOS
// =============================================

export async function getOrders(filters: {
  status?: string
  userId?: string
  limit?: number
  offset?: number
} = {}): Promise<{ orders: any[], total: number }> {
  try {
    let queryText = `
      SELECT 
        o.*,
        p.full_name, p.email, p.phone,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'name', oi.name,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'quantity', oi.quantity,
              'size', oi.size,
              'toppings', oi.toppings,
              'special_instructions', oi.special_instructions,
              'product_name', prod.name,
              'product_image', prod.image
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as order_items
      FROM public.orders o
      LEFT JOIN public.profiles p ON o.user_id = p.id
      LEFT JOIN public.order_items oi ON o.id = oi.order_id
      LEFT JOIN public.products prod ON oi.product_id = prod.id
    `

    const conditions = []
    const params = []
    let paramIndex = 1

    if (filters.status) {
      conditions.push(`o.status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }

    if (filters.userId) {
      conditions.push(`o.user_id = $${paramIndex}`)
      params.push(filters.userId)
      paramIndex++
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ')
    }

    queryText += ' GROUP BY o.id, p.full_name, p.email, p.phone ORDER BY o.created_at DESC'

    if (filters.limit) {
      queryText += ` LIMIT $${paramIndex}`
      params.push(filters.limit)
      paramIndex++
    }

    if (filters.offset) {
      queryText += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
    }

    const result = await query(queryText, params)

    // Query para contar total
    let countQuery = 'SELECT COUNT(*) as total FROM public.orders o'
    const countConditions = []
    const countParams = []
    let countParamIndex = 1

    if (filters.status) {
      countConditions.push(`o.status = $${countParamIndex}`)
      countParams.push(filters.status)
      countParamIndex++
    }

    if (filters.userId) {
      countConditions.push(`o.user_id = $${countParamIndex}`)
      countParams.push(filters.userId)
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ')
    }

    const countResult = await query(countQuery, countParams)

    console.log(`📋 ${result.rows.length} pedidos carregados`)
    return {
      orders: result.rows,
      total: parseInt(countResult.rows[0].total)
    }
  } catch (error: any) {
    console.error('❌ Erro ao carregar pedidos:', error.message)
    return { orders: [], total: 0 }
  }
}

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: any[]): Promise<Order | null> {
  try {
    console.log('📋 Criando pedido...')
    
    return await withTransaction(async (client) => {
      // Criar o pedido
      const orderResult = await client.query(
        `INSERT INTO public.orders (
          user_id, customer_name, customer_phone, customer_address, 
          total, status, payment_method, delivery_type, driver_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          orderData.user_id,
          orderData.customer_name,
          orderData.customer_phone,
          orderData.customer_address,
          orderData.total,
          orderData.status,
          orderData.payment_method,
          orderData.delivery_type,
          orderData.driver_id,
          orderData.notes
        ]
      )

      const order = orderResult.rows[0]

      // Criar os itens do pedido
      for (const item of items) {
        await client.query(
          `INSERT INTO public.order_items (
            order_id, product_id, name, unit_price, total_price, 
            quantity, size, toppings, special_instructions, half_and_half
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            order.id,
            item.product_id,
            item.name,
            item.price,
            item.price * item.quantity,
            item.quantity,
            item.size,
            item.toppings,
            item.special_instructions,
            item.half_and_half
          ]
        )
      }

      console.log('✅ Pedido criado:', order.id)
      return order
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar pedido:', error.message)
    return null
  }
}

export async function updateOrderStatus(orderId: number, status: Order['status']): Promise<boolean> {
  try {
    await query(
      'UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, orderId]
    )
    
    console.log('✅ Status do pedido atualizado:', { orderId, status })
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar status:', error.message)
    return false
  }
}

// =============================================
// FUNÇÕES DE CONFIGURAÇÕES
// =============================================

export async function getAdminSettings(): Promise<Record<string, string>> {
  try {
    const result = await query('SELECT setting_key as key, setting_value as value FROM public.admin_settings')

    const settings: Record<string, string> = {}
    result.rows.forEach((setting: any) => {
      settings[setting.key] = setting.value
    })

    return settings
  } catch (error: any) {
    console.error('❌ Erro ao carregar configurações:', error.message)
    return {}
  }
}

export async function updateAdminSetting(key: string, value: string): Promise<boolean> {
  try {
    console.log(`🔄 Tentando atualizar configuração: ${key} = ${value}`)
    
    const result = await query(
      `INSERT INTO public.admin_settings (setting_key, setting_value) 
       VALUES ($1, $2) 
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = NOW()`,
      [key, value]
    )
    
    console.log('✅ Configuração atualizada com sucesso:', { key, value })
    return true
  } catch (error: any) {
    console.error('❌ Erro ao atualizar configuração:', {
      key,
      value,
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

// =============================================
// FUNÇÕES DE TESTE E UTILITÁRIOS
// =============================================

export async function testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const result = await query('SELECT COUNT(*) as count FROM public.profiles LIMIT 1')

    return {
      success: true,
      message: 'Conexão com PostgreSQL funcionando perfeitamente'
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro na conexão com PostgreSQL',
      error: error.message
    }
  }
}

export async function saveCustomerAddress(userId: string, addressData: any): Promise<boolean> {
  try {
    console.log('📍 Salvando endereço para usuário:', userId);
    
    const result = await query(
      `INSERT INTO customer_addresses (
        user_id, 
        label, 
        zip_code, 
        street, 
        neighborhood, 
        city, 
        state, 
        number, 
        complement,
        is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        'Endereço Principal',
        addressData.zipCode,
        addressData.street,
        addressData.neighborhood,
        addressData.city,
        addressData.state,
        addressData.number,
        addressData.complement || '',
        true // Primeiro endereço como padrão
      ]
    );

    console.log('✅ Endereço salvo com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao salvar endereço:', error.message);
    return false;
  }
}