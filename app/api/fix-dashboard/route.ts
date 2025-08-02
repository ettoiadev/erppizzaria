import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Corrigindo problemas do dashboard automaticamente...');

    // 1. Criar tabelas necessárias que estão faltando
    console.log('📋 Criando tabelas necessárias...');

    // Criar tabela orders se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
        total DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'MERCADO_PAGO')),
        payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
        payment_id VARCHAR(255),
        delivery_type VARCHAR(20) DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup', 'dine_in')),
        notes TEXT,
        estimated_delivery_time TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Criar tabela order_items se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        size VARCHAR(50),
        toppings JSONB,
        special_instructions TEXT,
        half_and_half JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Criar tabela customer_addresses se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS public.customer_addresses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        street VARCHAR(255) NOT NULL,
        number VARCHAR(20) NOT NULL,
        complement VARCHAR(255),
        neighborhood VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        label VARCHAR(50) DEFAULT 'Casa',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Criar tabela categories se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS public.categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT,
        active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Criar tabela products se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS public.products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        active BOOLEAN DEFAULT TRUE,
        has_sizes BOOLEAN DEFAULT FALSE,
        has_toppings BOOLEAN DEFAULT FALSE,
        preparation_time INTEGER DEFAULT 30,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log('✅ Tabelas criadas');

    // 2. Criar índices para performance
    console.log('📈 Criando índices...');
    
    await query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)');
    await query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)');

    console.log('✅ Índices criados');

    // 3. Inserir dados de exemplo
    console.log('📊 Inserindo dados de exemplo...');

    // Inserir categorias
    await query(`
      INSERT INTO categories (name, description, active, sort_order) VALUES
      ('Pizzas Tradicionais', 'Pizzas clássicas da casa', true, 1),
      ('Pizzas Especiais', 'Pizzas gourmet e especiais', true, 2),
      ('Bebidas', 'Refrigerantes, sucos e águas', true, 3),
      ('Sobremesas', 'Doces e sobremesas deliciosas', true, 4)
      ON CONFLICT DO NOTHING
    `);

    // Inserir produtos de exemplo
    const categoriesResult = await query('SELECT id, name FROM categories ORDER BY sort_order');
    const categories = categoriesResult.rows;

    if (categories.length > 0) {
      const pizzasCategory = categories.find(c => c.name.includes('Pizza'));
      const bebidasCategory = categories.find(c => c.name.includes('Bebida'));

      if (pizzasCategory) {
        await query(`
          INSERT INTO products (category_id, name, description, price, active, has_sizes) VALUES
          ($1, 'Pizza Margherita', 'Molho de tomate, mussarela e manjericão', 35.90, true, true),
          ($1, 'Pizza Calabresa', 'Molho de tomate, mussarela e calabresa', 38.90, true, true),
          ($1, 'Pizza Portuguesa', 'Molho, mussarela, presunto, ovos e cebola', 42.90, true, true)
          ON CONFLICT DO NOTHING
        `, [pizzasCategory.id]);
      }

      if (bebidasCategory) {
        await query(`
          INSERT INTO products (category_id, name, description, price, active, has_sizes) VALUES
          ($1, 'Coca-Cola 350ml', 'Refrigerante Coca-Cola lata', 5.50, false, false),
          ($1, 'Água Mineral 500ml', 'Água mineral natural', 3.00, false, false)
          ON CONFLICT DO NOTHING
        `, [bebidasCategory.id]);
      }
    }

    // 4. Inserir alguns clientes de exemplo
    await query(`
      INSERT INTO profiles (email, full_name, role, password_hash, phone) VALUES
      ('cliente1@exemplo.com', 'João Silva', 'customer', '$2b$10$example1', '11999999001'),
      ('cliente2@exemplo.com', 'Maria Santos', 'customer', '$2b$10$example2', '11999999002'),
      ('cliente3@exemplo.com', 'Pedro Oliveira', 'customer', '$2b$10$example3', '11999999003')
      ON CONFLICT (email) DO NOTHING
    `);

    // 5. Inserir alguns pedidos de exemplo
    const customersResult = await query("SELECT id FROM profiles WHERE role = 'customer' LIMIT 3");
    const customers = customersResult.rows;

    if (customers.length > 0) {
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const orderTotal = (Math.random() * 50 + 20).toFixed(2); // Entre R$ 20 e R$ 70
        
        // Inserir pedido
        const orderResult = await query(`
          INSERT INTO orders (
            user_id, customer_name, customer_phone, customer_address,
            total, subtotal, status, payment_method, payment_status,
            delivery_type, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $5, $6, $7, $8, $9, NOW() - INTERVAL '${i} days'
          ) RETURNING id
        `, [
          customer.id,
          `Cliente ${i + 1}`,
          `1199999900${i + 1}`,
          `Rua Exemplo, ${100 + i} - Centro`,
          orderTotal,
          ['DELIVERED', 'PREPARING', 'READY'][i % 3],
          'PIX',
          'APPROVED',
          'delivery'
        ]);

        // Inserir itens do pedido
        if (orderResult.rows.length > 0) {
          const orderId = orderResult.rows[0].id;
          await query(`
            INSERT INTO order_items (order_id, name, quantity, unit_price, total_price) VALUES
            ($1, 'Pizza Margherita', 1, $2, $2),
            ($1, 'Coca-Cola 350ml', 2, 5.50, 11.00)
          `, [orderId, (parseFloat(orderTotal) - 11.00).toFixed(2)]);
        }
      }
    }

    console.log('✅ Dados de exemplo inseridos');

    // 6. Verificar se tudo foi criado corretamente
    const verification = await Promise.all([
      query('SELECT COUNT(*) as count FROM profiles WHERE role = $1', ['customer']),
      query('SELECT COUNT(*) as count FROM orders'),
      query('SELECT COUNT(*) as count FROM categories'),
      query('SELECT COUNT(*) as count FROM products')
    ]);

    const stats = {
      customers: parseInt(verification[0].rows[0].count),
      orders: parseInt(verification[1].rows[0].count),
      categories: parseInt(verification[2].rows[0].count),
      products: parseInt(verification[3].rows[0].count)
    };

    console.log('✅ CORREÇÃO COMPLETA!');

    return NextResponse.json({
      success: true,
      message: 'Dashboard corrigido com sucesso!',
      details: {
        tablesCreated: ['orders', 'order_items', 'customer_addresses', 'categories', 'products'],
        indexesCreated: 7,
        sampleDataInserted: true,
        statistics: stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na correção:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro ao corrigir dashboard',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar status atual das tabelas
    const tablesCheck = await Promise.all([
      query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') as exists"),
      query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') as exists"),
      query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_addresses') as exists"),
      query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') as exists"),
      query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') as exists")
    ]);

    const tableStatus = {
      orders: tablesCheck[0].rows[0].exists,
      order_items: tablesCheck[1].rows[0].exists,
      customer_addresses: tablesCheck[2].rows[0].exists,
      categories: tablesCheck[3].rows[0].exists,
      products: tablesCheck[4].rows[0].exists
    };

    const allTablesExist = Object.values(tableStatus).every(exists => exists);

    return NextResponse.json({
      success: true,
      ready: allTablesExist,
      tableStatus,
      message: allTablesExist 
        ? 'Todas as tabelas existem - Dashboard deve funcionar' 
        : 'Algumas tabelas estão faltando - Execute POST nesta rota para corrigir'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status',
      details: error.message
    }, { status: 500 });
  }
}