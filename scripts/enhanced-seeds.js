/**
 * Seeds de Dados Robustos para Desenvolvimento - FASE 2
 * Cria dados de teste completos para todas as funcionalidades do sistema
 */

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'erp_pizzaria',
  password: process.env.POSTGRES_PASSWORD || '134679',
  port: process.env.POSTGRES_PORT || 5432,
})

// Dados de seed estruturados
const seedData = {
  // Categorias de produtos
  categories: [
    {
      name: 'Pizzas Tradicionais',
      description: 'Nossas deliciosas pizzas com receitas tradicionais',
      sort_order: 1,
      active: true
    },
    {
      name: 'Pizzas Especiais',
      description: 'Pizzas gourmet com ingredientes especiais',
      sort_order: 2,
      active: true
    },
    {
      name: 'Pizzas Doces',
      description: 'Pizzas doces para sobremesa',
      sort_order: 3,
      active: true
    },
    {
      name: 'Bebidas',
      description: 'Refrigerantes, sucos e bebidas geladas',
      sort_order: 4,
      active: true
    },
    {
      name: 'Sobremesas',
      description: 'Doces e sobremesas deliciosas',
      sort_order: 5,
      active: true
    },
    {
      name: 'Acompanhamentos',
      description: 'Porções e acompanhamentos para sua refeição',
      sort_order: 6,
      active: true
    }
  ],

  // Produtos para cada categoria
  products: [
    // Pizzas Tradicionais
    {
      name: 'Pizza Margherita',
      description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
      price: 35.90,
      category: 'Pizzas Tradicionais',
      image: '/images/pizza-margherita.jpg',
      active: true,
      preparation_time: 25
    },
    {
      name: 'Pizza Calabresa',
      description: 'Molho de tomate, mussarela, calabresa e cebola',
      price: 38.90,
      category: 'Pizzas Tradicionais',
      image: '/images/pizza-calabresa.jpg',
      active: true,
      preparation_time: 25
    },
    {
      name: 'Pizza Portuguesa',
      description: 'Molho de tomate, mussarela, presunto, ovos, cebola e azeitona',
      price: 42.90,
      category: 'Pizzas Tradicionais',
      image: '/images/pizza-portuguesa.jpg',
      active: true,
      preparation_time: 30
    },
    {
      name: 'Pizza Quatro Queijos',
      description: 'Molho de tomate, mussarela, gorgonzola, parmesão e provolone',
      price: 45.90,
      category: 'Pizzas Tradicionais',
      image: '/images/pizza-quatro-queijos.jpg',
      active: true,
      preparation_time: 25
    },

    // Pizzas Especiais
    {
      name: 'Pizza Salmão',
      description: 'Molho branco, mussarela, salmão defumado, alcaparras e dill',
      price: 65.90,
      category: 'Pizzas Especiais',
      image: '/images/pizza-salmao.jpg',
      active: true,
      preparation_time: 35
    },
    {
      name: 'Pizza Camarão',
      description: 'Molho de tomate, mussarela, camarão, catupiry e cebolinha',
      price: 58.90,
      category: 'Pizzas Especiais',
      image: '/images/pizza-camarao.jpg',
      active: true,
      preparation_time: 35
    },
    {
      name: 'Pizza Rúcula com Tomate Seco',
      description: 'Molho branco, mussarela, rúcula, tomate seco e parmesão',
      price: 48.90,
      category: 'Pizzas Especiais',
      image: '/images/pizza-rucula.jpg',
      active: true,
      preparation_time: 30
    },

    // Pizzas Doces
    {
      name: 'Pizza Chocolate com Morango',
      description: 'Chocolate ao leite, morangos frescos e açúcar de confeiteiro',
      price: 39.90,
      category: 'Pizzas Doces',
      image: '/images/pizza-chocolate-morango.jpg',
      active: true,
      preparation_time: 20
    },
    {
      name: 'Pizza Banana com Canela',
      description: 'Banana, canela, açúcar cristal e leite condensado',
      price: 32.90,
      category: 'Pizzas Doces',
      image: '/images/pizza-banana.jpg',
      active: true,
      preparation_time: 20
    },

    // Bebidas
    {
      name: 'Coca-Cola 350ml',
      description: 'Refrigerante Coca-Cola gelado',
      price: 5.90,
      category: 'Bebidas',
      image: '/images/coca-cola.jpg',
      active: true,
      preparation_time: 0
    },
    {
      name: 'Suco de Laranja 500ml',
      description: 'Suco natural de laranja',
      price: 8.90,
      category: 'Bebidas',
      image: '/images/suco-laranja.jpg',
      active: true,
      preparation_time: 5
    },
    {
      name: 'Água Mineral 500ml',
      description: 'Água mineral sem gás',
      price: 3.50,
      category: 'Bebidas',
      image: '/images/agua-mineral.jpg',
      active: true,
      preparation_time: 0
    },

    // Sobremesas
    {
      name: 'Pudim de Leite',
      description: 'Pudim caseiro com calda de caramelo',
      price: 12.90,
      category: 'Sobremesas',
      image: '/images/pudim.jpg',
      active: true,
      preparation_time: 5
    },
    {
      name: 'Brigadeiro Gourmet',
      description: 'Brigadeiro artesanal com granulado belga (6 unidades)',
      price: 18.90,
      category: 'Sobremesas',
      image: '/images/brigadeiro.jpg',
      active: true,
      preparation_time: 10
    },

    // Acompanhamentos
    {
      name: 'Batata Frita',
      description: 'Porção de batata frita crocante (400g)',
      price: 15.90,
      category: 'Acompanhamentos',
      image: '/images/batata-frita.jpg',
      active: true,
      preparation_time: 15
    },
    {
      name: 'Pão de Alho',
      description: 'Pão de alho gratinado (8 fatias)',
      price: 12.90,
      category: 'Acompanhamentos',
      image: '/images/pao-alho.jpg',
      active: true,
      preparation_time: 10
    }
  ],

  // Usuários de teste
  users: [
    {
      email: 'admin@erppizzaria.com',
      password: 'admin123',
      full_name: 'Administrador do Sistema',
      role: 'admin',
      phone: '(11) 99999-9999'
    },
    {
      email: 'gerente@erppizzaria.com',
      password: 'gerente123',
      full_name: 'Gerente da Pizzaria',
      role: 'manager',
      phone: '(11) 98888-8888'
    },
    {
      email: 'funcionario@erppizzaria.com',
      password: 'func123',
      full_name: 'Funcionário da Cozinha',
      role: 'employee',
      phone: '(11) 97777-7777'
    },
    {
      email: 'entregador@erppizzaria.com',
      password: 'entrega123',
      full_name: 'Entregador Principal',
      role: 'delivery',
      phone: '(11) 96666-6666'
    },
    {
      email: 'cliente@teste.com',
      password: 'cliente123',
      full_name: 'Cliente de Teste',
      role: 'customer',
      phone: '(11) 95555-5555'
    },
    {
      email: 'maria@teste.com',
      password: 'maria123',
      full_name: 'Maria Silva',
      role: 'customer',
      phone: '(11) 94444-4444'
    },
    {
      email: 'joao@teste.com',
      password: 'joao123',
      full_name: 'João Santos',
      role: 'customer',
      phone: '(11) 93333-3333'
    }
  ],

  // Endereços de teste para clientes
  addresses: [
    {
      customer_email: 'cliente@teste.com',
      street: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      complement: 'Apto 45',
      is_default: true
    },
    {
      customer_email: 'maria@teste.com',
      street: 'Av. Paulista, 1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01310-100',
      complement: 'Conjunto 12',
      is_default: true
    },
    {
      customer_email: 'joao@teste.com',
      street: 'Rua Augusta, 500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01305-000',
      complement: '',
      is_default: true
    }
  ],

  // Cupons de desconto
  coupons: [
    {
      code: 'BEMVINDO10',
      description: 'Desconto de boas-vindas para novos clientes',
      discount_type: 'percentage',
      discount_value: 10.00,
      min_order_value: 30.00,
      max_uses: 100,
      uses_count: 0,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      active: true
    },
    {
      code: 'PIZZA20',
      description: 'R$ 20 de desconto em pedidos acima de R$ 80',
      discount_type: 'fixed',
      discount_value: 20.00,
      min_order_value: 80.00,
      max_uses: 50,
      uses_count: 0,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
      active: true
    },
    {
      code: 'FRETEGRATIS',
      description: 'Frete grátis para pedidos acima de R$ 50',
      discount_type: 'free_delivery',
      discount_value: 0.00,
      min_order_value: 50.00,
      max_uses: 200,
      uses_count: 0,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias
      active: true
    }
  ],

  // Configurações do sistema
  settings: [
    {
      key: 'delivery_fee',
      value: '8.50',
      description: 'Taxa de entrega padrão'
    },
    {
      key: 'min_order_value',
      value: '25.00',
      description: 'Valor mínimo do pedido'
    },
    {
      key: 'max_delivery_distance',
      value: '10',
      description: 'Distância máxima para entrega (km)'
    },
    {
      key: 'estimated_delivery_time',
      value: '45',
      description: 'Tempo estimado de entrega (minutos)'
    },
    {
      key: 'store_phone',
      value: { phone: '(11) 3333-4444', whatsapp: '(11) 99999-0000' },
      description: 'Telefones da loja'
    },
    {
      key: 'store_address',
      value: {
        street: 'Rua das Pizzas, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-567'
      },
      description: 'Endereço da loja'
    },
    {
      key: 'store_hours',
      value: {
        monday: '18:00-23:00',
        tuesday: '18:00-23:00',
        wednesday: '18:00-23:00',
        thursday: '18:00-23:00',
        friday: '18:00-00:00',
        saturday: '18:00-00:00',
        sunday: '18:00-23:00'
      },
      description: 'Horários de funcionamento'
    }
  ]
}

// Funções auxiliares
async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

async function clearExistingData() {
  console.log('🧹 Limpando dados existentes...')
  
  const tables = [
    'order_items',
    'orders',
    'user_coupons',
    'coupons',
    'customer_addresses',
    'favorites',
    'products',
    'categories',
    'refresh_tokens',
    'customers',
    'profiles',
    'admin_settings'
  ]
  
  for (const table of tables) {
    try {
      await pool.query(`DELETE FROM ${table}`)
      console.log(`  ✅ Tabela ${table} limpa`)
    } catch (error) {
      console.log(`  ⚠️  Tabela ${table} não encontrada ou erro: ${error.message}`)
    }
  }
}

async function seedCategories() {
  console.log('📂 Inserindo categorias...')
  
  for (const category of seedData.categories) {
    try {
      const result = await pool.query(
        `INSERT INTO categories (name, description, sort_order, active) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, name`,
        [category.name, category.description, category.sort_order, category.active]
      )
      console.log(`  ✅ Categoria criada: ${result.rows[0].name} (ID: ${result.rows[0].id})`)
    } catch (error) {
      console.error(`  ❌ Erro ao criar categoria ${category.name}:`, error.message)
    }
  }
}

async function seedProducts() {
  console.log('🍕 Inserindo produtos...')
  
  for (const product of seedData.products) {
    try {
      // Buscar ID da categoria
      const categoryResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1',
        [product.category]
      )
      
      if (categoryResult.rows.length === 0) {
        console.error(`  ❌ Categoria não encontrada: ${product.category}`)
        continue
      }
      
      const categoryId = categoryResult.rows[0].id
      
      const result = await pool.query(
        `INSERT INTO products (name, description, price, category_id, image, active, preparation_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, name`,
        [
          product.name,
          product.description,
          product.price,
          categoryId,
          product.image,
          product.active,
          product.preparation_time
        ]
      )
      console.log(`  ✅ Produto criado: ${result.rows[0].name} (ID: ${result.rows[0].id})`)
    } catch (error) {
      console.error(`  ❌ Erro ao criar produto ${product.name}:`, error.message)
    }
  }
}

async function seedUsers() {
  console.log('👥 Inserindo usuários...')
  
  for (const user of seedData.users) {
    try {
      const hashedPassword = await hashPassword(user.password)
      
      // Inserir na tabela profiles
      const profileResult = await pool.query(
        `INSERT INTO profiles (id, email, password_hash, full_name, role, phone, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
         RETURNING id, email, role`,
        [
          uuidv4(),
          user.email,
          hashedPassword,
          user.full_name,
          user.role,
          user.phone
        ]
      )
      
      const profile = profileResult.rows[0]
      
      // Se for cliente, inserir também na tabela customers
        if (user.role === 'customer') {
          // Verificar se cliente já existe
          const existingCustomer = await pool.query(
            'SELECT id FROM customers WHERE email = $1',
            [user.email]
          );
          
          if (existingCustomer.rows.length === 0) {
            const customerResult = await pool.query(
              `INSERT INTO customers (id, name, email, phone, customer_code, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
               RETURNING id`,
              [
                uuidv4(),
                user.full_name,
                user.email,
                user.phone,
                `CUST${Date.now().toString().slice(-6)}`
              ]
            );
            
            console.log(`  ✅ Cliente criado: ${user.email} (${user.role})`);
          } else {
            console.log(`  ✅ Cliente já existe: ${user.email} (${user.role})`);
          }
        } else {
          console.log(`  ✅ Usuário criado: ${user.email} (${user.role})`);
        }
      
      console.log(`  ✅ Usuário criado: ${profile.email} (${profile.role})`)
    } catch (error) {
      console.error(`  ❌ Erro ao criar usuário ${user.email}:`, error.message)
    }
  }
}

async function seedAddresses() {
  console.log('📍 Inserindo endereços...')
  
  for (const address of seedData.addresses) {
    try {
      // Buscar customer_id pelo email
      const customerResult = await pool.query(
        'SELECT id FROM customers WHERE email = $1',
        [address.customer_email]
      )
      
      if (customerResult.rows.length === 0) {
        console.error(`  ❌ Cliente não encontrado: ${address.customer_email}`)
        continue
      }
      
      const customerId = customerResult.rows[0].id
      
      const result = await pool.query(
        `INSERT INTO customer_addresses (id, customer_id, street, neighborhood, city, state, zip_code, complement, is_default, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING id`,
        [
          uuidv4(),
          customerId,
          address.street,
          address.neighborhood,
          address.city,
          address.state,
          address.zip_code,
          address.complement,
          address.is_default
        ]
      )
      
      console.log(`  ✅ Endereço criado para ${address.customer_email}: ${address.street}`)
    } catch (error) {
      console.error(`  ❌ Erro ao criar endereço para ${address.customer_email}:`, error.message)
    }
  }
}

async function seedCoupons() {
  console.log('🎫 Inserindo cupons...')
  
  for (const coupon of seedData.coupons) {
    try {
      const result = await pool.query(
        `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_value, max_uses, uses_count, valid_from, valid_until, active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) 
         RETURNING id, code`,
        [
          uuidv4(),
          coupon.code,
          coupon.description,
          coupon.discount_type,
          coupon.discount_value,
          coupon.min_order_value,
          coupon.max_uses,
          coupon.uses_count,
          coupon.valid_from,
          coupon.valid_until,
          coupon.active
        ]
      )
      
      console.log(`  ✅ Cupom criado: ${result.rows[0].code} (ID: ${result.rows[0].id})`)
    } catch (error) {
      console.error(`  ❌ Erro ao criar cupom ${coupon.code}:`, error.message)
    }
  }
}

async function seedSettings() {
  console.log('⚙️ Inserindo configurações...')
  
  for (const setting of seedData.settings) {
    try {
      const settingValue = typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value;
      
      const result = await pool.query(
        `INSERT INTO admin_settings (key, value, description, updated_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (key) DO UPDATE SET 
         value = EXCLUDED.value, 
         description = EXCLUDED.description, 
         updated_at = NOW() 
         RETURNING key`,
        [setting.key, settingValue, setting.description]
      )
      
      console.log(`  ✅ Configuração criada/atualizada: ${result.rows[0].key}`)
    } catch (error) {
      console.error(`  ❌ Erro ao criar configuração ${setting.key}:`, error.message)
    }
  }
}

// Função principal
async function runSeeds() {
  console.log('🌱 Iniciando processo de seeds...')
  console.log('=' .repeat(50))
  
  try {
    // Testar conexão
    await pool.query('SELECT NOW()')
    console.log('✅ Conexão com banco de dados estabelecida')
    
    // Executar seeds em ordem
    await clearExistingData()
    await seedCategories()
    await seedProducts()
    await seedUsers()
    await seedAddresses()
    await seedCoupons()
    await seedSettings()
    
    console.log('=' .repeat(50))
    console.log('🎉 Seeds executados com sucesso!')
    console.log('')
    console.log('📊 Resumo dos dados criados:')
    console.log(`  • ${seedData.categories.length} categorias`)
    console.log(`  • ${seedData.products.length} produtos`)
    console.log(`  • ${seedData.users.length} usuários`)
    console.log(`  • ${seedData.addresses.length} endereços`)
    console.log(`  • ${seedData.settings.length} configurações`)
    console.log('')
    console.log('🔑 Credenciais de acesso:')
    console.log('  Admin: admin@erppizzaria.com / admin123')
    console.log('  Gerente: gerente@erppizzaria.com / gerente123')
    console.log('  Cliente: cliente@teste.com / cliente123')
    console.log('  Funcionário: funcionario@erppizzaria.com / func123')
    console.log('  Entregador: entregador@erppizzaria.com / entrega123')
    
  } catch (error) {
    console.error('❌ Erro durante execução dos seeds:', error)
  } finally {
    await pool.end()
    console.log('🔌 Conexão com banco de dados encerrada')
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runSeeds()
}

module.exports = { runSeeds, seedData }