import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { verifyAdmin } from '@/lib/auth'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    // Verificar autenticação de admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'Acesso negado - usuário não é admin' },
        { status: 403 }
      )
    }

    console.log('[CREATE_TEST_DATA] Iniciando criação de dados de teste...')

    // Criar entregadores de teste
    await client.query(`
      INSERT INTO drivers (id, name, email, phone, vehicle_type, status) VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'João Silva', 'joao.silva@delivery.com', '(11) 99999-0001', 'motorcycle', 'available'),
        ('550e8400-e29b-41d4-a716-446655440002', 'Maria Santos', 'maria.santos@delivery.com', '(11) 99999-0002', 'bicycle', 'available'),
        ('550e8400-e29b-41d4-a716-446655440003', 'Pedro Oliveira', 'pedro.oliveira@delivery.com', '(11) 99999-0003', 'car', 'busy')
      ON CONFLICT (id) DO NOTHING
    `)

    // Criar usuários fictícios para os pedidos (se não existirem)
    await client.query(`
      INSERT INTO auth.users (id, email) VALUES 
        ('770e8400-e29b-41d4-a716-446655440001', 'cliente1@teste.com'),
        ('770e8400-e29b-41d4-a716-446655440002', 'cliente2@teste.com'),
        ('770e8400-e29b-41d4-a716-446655440003', 'cliente3@teste.com'),
        ('770e8400-e29b-41d4-a716-446655440004', 'cliente4@teste.com'),
        ('770e8400-e29b-41d4-a716-446655440005', 'cliente5@teste.com'),
        ('770e8400-e29b-41d4-a716-446655440006', 'cliente6@teste.com')
      ON CONFLICT (id) DO NOTHING
    `)

    // Criar pedidos de teste entregues hoje
    await client.query(`
      INSERT INTO orders (
        id, 
        user_id, 
        driver_id, 
        status, 
        total, 
        subtotal, 
        delivery_fee, 
        payment_method, 
        payment_status, 
        delivery_address, 
        delivery_phone, 
        delivered_at,
        created_at
      ) VALUES 
        -- Entregas do João Silva
        (
          '660e8400-e29b-41d4-a716-446655440001', 
          '770e8400-e29b-41d4-a716-446655440001', 
          '550e8400-e29b-41d4-a716-446655440001', 
          'DELIVERED', 
          45.90, 
          39.90, 
          6.00, 
          'PIX', 
          'PAID', 
          'Rua das Flores, 123 - Centro', 
          '(11) 98888-1111',
          NOW() - INTERVAL '2 hours',
          NOW() - INTERVAL '3 hours'
        ),
        (
          '660e8400-e29b-41d4-a716-446655440002', 
          '770e8400-e29b-41d4-a716-446655440002', 
          '550e8400-e29b-41d4-a716-446655440001', 
          'DELIVERED', 
          32.50, 
          27.50, 
          5.00, 
          'CREDIT_CARD', 
          'PAID', 
          'Av. Paulista, 456 - Bela Vista', 
          '(11) 98888-2222',
          NOW() - INTERVAL '1 hour',
          NOW() - INTERVAL '2 hours'
        ),
        (
          '660e8400-e29b-41d4-a716-446655440003', 
          '770e8400-e29b-41d4-a716-446655440003', 
          '550e8400-e29b-41d4-a716-446655440001', 
          'DELIVERED', 
          58.90, 
          50.90, 
          8.00, 
          'CASH', 
          'PAID', 
          'Rua Augusta, 789 - Consolação', 
          '(11) 98888-3333',
          NOW() - INTERVAL '30 minutes',
          NOW() - INTERVAL '90 minutes'
        ),
        -- Entregas da Maria Santos
        (
          '660e8400-e29b-41d4-a716-446655440004', 
          '770e8400-e29b-41d4-a716-446655440004', 
          '550e8400-e29b-41d4-a716-446655440002', 
          'DELIVERED', 
          41.80, 
          36.80, 
          5.00, 
          'DEBIT_CARD', 
          'PAID', 
          'Rua da Liberdade, 321 - Liberdade', 
          '(11) 98888-4444',
          NOW() - INTERVAL '3 hours',
          NOW() - INTERVAL '4 hours'
        ),
        (
          '660e8400-e29b-41d4-a716-446655440005', 
          '770e8400-e29b-41d4-a716-446655440005', 
          '550e8400-e29b-41d4-a716-446655440002', 
          'DELIVERED', 
          29.90, 
          24.90, 
          5.00, 
          'PIX', 
          'PAID', 
          'Rua do Brás, 654 - Brás', 
          '(11) 98888-5555',
          NOW() - INTERVAL '45 minutes',
          NOW() - INTERVAL '105 minutes'
        ),
        -- Entrega do Pedro Oliveira
        (
          '660e8400-e29b-41d4-a716-446655440006', 
          '770e8400-e29b-41d4-a716-446655440006', 
          '550e8400-e29b-41d4-a716-446655440003', 
          'DELIVERED', 
          67.50, 
          59.50, 
          8.00, 
          'CREDIT_CARD', 
          'PAID', 
          'Rua dos Três Irmãos, 987 - Vila Madalena', 
          '(11) 98888-6666',
          NOW() - INTERVAL '15 minutes',
          NOW() - INTERVAL '75 minutes'
        )
      ON CONFLICT (id) DO NOTHING
    `)

    // Criar itens dos pedidos
    await client.query(`
      INSERT INTO order_items (id, order_id, product_id, quantity, price, product_name) VALUES 
        -- Itens do pedido 1 (João Silva)
        ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 1, 25.90, 'Pizza Margherita Grande'),
        ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', 1, 14.00, 'Refrigerante 2L'),
        
        -- Itens do pedido 2 (João Silva)
        ('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440003', 1, 27.50, 'Pizza Calabresa Média'),
        
        -- Itens do pedido 3 (João Silva)
        ('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440004', 1, 32.90, 'Pizza Portuguesa Grande'),
        ('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440005', 1, 18.00, 'Batata Frita'),
        
        -- Itens do pedido 4 (Maria Santos)
        ('880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440006', 1, 22.90, 'Pizza Quatro Queijos Média'),
        ('880e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440007', 1, 13.90, 'Suco Natural'),
        
        -- Itens do pedido 5 (Maria Santos)
        ('880e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440008', 1, 24.90, 'Pizza Frango com Catupiry Média'),
        
        -- Itens do pedido 6 (Pedro Oliveira)
        ('880e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440009', 1, 35.90, 'Pizza Especial da Casa Grande'),
        ('880e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440010', 1, 23.60, 'Combo Bebidas')
      ON CONFLICT (id) DO NOTHING
    `)

    // Verificar dados criados
    const driversResult = await client.query(`
      SELECT COUNT(*) as total FROM drivers 
      WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003')
    `)

    const ordersResult = await client.query(`
      SELECT COUNT(*) as total FROM orders 
      WHERE status = 'DELIVERED' 
      AND driver_id IS NOT NULL 
      AND DATE(delivered_at) = CURRENT_DATE
    `)

    const itemsResult = await client.query(`
      SELECT COUNT(*) as total FROM order_items 
      WHERE order_id IN (
        SELECT id FROM orders 
        WHERE status = 'DELIVERED' 
        AND DATE(delivered_at) = CURRENT_DATE
      )
    `)

    console.log('[CREATE_TEST_DATA] Dados de teste criados com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Dados de teste criados com sucesso!',
      data: {
        driversCreated: parseInt(driversResult.rows[0].total),
        ordersCreated: parseInt(ordersResult.rows[0].total),
        itemsCreated: parseInt(itemsResult.rows[0].total)
      }
    })

  } catch (error) {
    console.error('[CREATE_TEST_DATA] Erro ao criar dados de teste:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível criar os dados de teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}