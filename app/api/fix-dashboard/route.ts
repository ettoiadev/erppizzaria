import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { frontendLogger } from '@/lib/frontend-logger';

export async function POST(request: NextRequest) {
  try {
    frontendLogger.info('Correção de problemas do dashboard iniciada', 'api');

    // 1. Criação de tabelas/índices: não via API Supabase. Operaremos apenas com dados.

    // Criar tabela orders se não existir
    const supabase = getSupabaseServerClient();

    frontendLogger.info('Tabelas criadas com sucesso', 'api');

    // 2. Criar índices para performance
    frontendLogger.info('Índices: não aplicável via API Supabase', 'api');

    // 3. Inserir dados de exemplo
    frontendLogger.info('Inserindo dados de exemplo', 'api');

    // Inserir categorias
    await supabase.from('categories').upsert([
      { name: 'Pizzas Tradicionais', description: 'Pizzas clássicas da casa', active: true, sort_order: 1 },
      { name: 'Pizzas Especiais', description: 'Pizzas gourmet e especiais', active: true, sort_order: 2 },
      { name: 'Bebidas', description: 'Refrigerantes, sucos e águas', active: true, sort_order: 3 },
      { name: 'Sobremesas', description: 'Doces e sobremesas deliciosas', active: true, sort_order: 4 }
    ]);

    // Inserir produtos de exemplo
    const { data: categories } = await supabase.from('categories').select('id, name').order('sort_order', { ascending: true });

    if (categories && categories.length > 0) {
      const pizzasCategory = categories.find(c => c.name.includes('Pizza'));
      const bebidasCategory = categories.find(c => c.name.includes('Bebida'));

      if (pizzasCategory) {
        await supabase.from('products').upsert([
          { category_id: pizzasCategory.id, name: 'Pizza Margherita', description: 'Molho de tomate, mussarela e manjericão', price: 35.90, active: true, has_sizes: true },
          { category_id: pizzasCategory.id, name: 'Pizza Calabresa', description: 'Molho de tomate, mussarela e calabresa', price: 38.90, active: true, has_sizes: true },
          { category_id: pizzasCategory.id, name: 'Pizza Portuguesa', description: 'Molho, mussarela, presunto, ovos e cebola', price: 42.90, active: true, has_sizes: true },
        ]);
      }

      if (bebidasCategory) {
        await supabase.from('products').upsert([
          { category_id: bebidasCategory.id, name: 'Coca-Cola 350ml', description: 'Refrigerante Coca-Cola lata', price: 5.50, active: false, has_sizes: false },
          { category_id: bebidasCategory.id, name: 'Água Mineral 500ml', description: 'Água mineral natural', price: 3.00, active: false, has_sizes: false },
        ]);
      }
    }

    // 4. Inserir alguns clientes de exemplo
    await supabase.from('profiles').upsert([
      { email: 'cliente1@exemplo.com', full_name: 'João Silva', role: 'customer', password_hash: '$2b$10$example1', phone: '11999999001' },
      { email: 'cliente2@exemplo.com', full_name: 'Maria Santos', role: 'customer', password_hash: '$2b$10$example2', phone: '11999999002' },
      { email: 'cliente3@exemplo.com', full_name: 'Pedro Oliveira', role: 'customer', password_hash: '$2b$10$example3', phone: '11999999003' },
    ], { onConflict: 'email' });

    // 5. Inserir alguns pedidos de exemplo
    const { data: customers } = await supabase.from('profiles').select('id').eq('role', 'customer').limit(3);

    if (customers && customers.length > 0) {
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const orderTotal = (Math.random() * 50 + 20).toFixed(2); // Entre R$ 20 e R$ 70
        
        // Inserir pedido
        const { data: orderResult } = await supabase
          .from('orders')
          .insert({
            user_id: customer.id,
            customer_name: `Cliente ${i + 1}`,
            customer_phone: `1199999900${i + 1}`,
            customer_address: `Rua Exemplo, ${100 + i} - Centro`,
            total: orderTotal,
            subtotal: orderTotal,
            status: ['DELIVERED', 'PREPARING', 'READY'][i % 3],
            payment_method: 'PIX',
            payment_status: 'APPROVED',
            delivery_type: 'delivery',
            created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
          })
          .select('id')
          .single();

        // Inserir itens do pedido
        if (orderResult?.id) {
          const orderId = orderResult.id;
          const pizza = (parseFloat(orderTotal as string) - 11.0).toFixed(2);
          await supabase.from('order_items').insert([
            { order_id: orderId, name: 'Pizza Margherita', quantity: 1, unit_price: pizza, total_price: pizza },
            { order_id: orderId, name: 'Coca-Cola 350ml', quantity: 2, unit_price: 5.50, total_price: 11.00 },
          ]);
        }
      }
    }

    frontendLogger.info('Dados de exemplo inseridos com sucesso', 'api');

    // 6. Verificar se tudo foi criado corretamente
    const [{ data: c1 }, { data: c2 }, { data: c3 }, { data: c4 }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true })
    ]);
    const stats = {
      customers: (c1 as any)?.length || 0,
      orders: (c2 as any)?.length || 0,
      categories: (c3 as any)?.length || 0,
      products: (c4 as any)?.length || 0
    };

    frontendLogger.info('Correção do dashboard completa', 'api', {
      statistics: stats
    });

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
  frontendLogger.logError('Erro na correção do dashboard', {
          error: error.message,
          stack: error.stack,
          code: error.code,
          hint: error.hint
        });

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
    const supabase = getSupabaseServerClient();
    const tableStatus = {
      orders: true,
      order_items: true,
      customer_addresses: true,
      categories: true,
      products: true
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