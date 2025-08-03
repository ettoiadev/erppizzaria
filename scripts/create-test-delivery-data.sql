-- Script para criar dados de teste para o relatório de entregadores
-- Execute este script no pgAdmin para testar o sistema de relatórios

-- 1. Inserir entregadores de teste (se não existirem)
INSERT INTO drivers (id, name, email, phone, vehicle_type, status) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'João Silva', 'joao.silva@delivery.com', '(11) 99999-0001', 'motorcycle', 'available'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Maria Santos', 'maria.santos@delivery.com', '(11) 99999-0002', 'bicycle', 'available'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Pedro Oliveira', 'pedro.oliveira@delivery.com', '(11) 99999-0003', 'car', 'busy')
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir pedidos de teste entregues hoje
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
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir itens dos pedidos para cálculo correto do valor dos produtos
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
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar os dados inseridos
SELECT 
  'Entregadores criados' as tipo,
  COUNT(*) as quantidade
FROM drivers
WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003')

UNION ALL

SELECT 
  'Pedidos entregues hoje' as tipo,
  COUNT(*) as quantidade
FROM orders 
WHERE status = 'DELIVERED' 
AND driver_id IS NOT NULL 
AND DATE(delivered_at) = CURRENT_DATE

UNION ALL

SELECT 
  'Total de entregas por entregador' as tipo,
  COUNT(*) as quantidade
FROM orders o
INNER JOIN drivers d ON o.driver_id = d.id
WHERE o.status = 'DELIVERED' 
AND DATE(o.delivered_at) = CURRENT_DATE;

-- 5. Mostrar resumo das entregas por entregador
SELECT 
  d.name as entregador,
  COUNT(o.id) as total_entregas,
  SUM(o.total) as valor_total_pedidos,
  SUM(o.delivery_fee) as total_taxas_entrega,
  MIN(o.delivered_at) as primeira_entrega,
  MAX(o.delivered_at) as ultima_entrega
FROM drivers d
INNER JOIN orders o ON d.id = o.driver_id
WHERE o.status = 'DELIVERED' 
AND DATE(o.delivered_at) = CURRENT_DATE
GROUP BY d.id, d.name
ORDER BY total_entregas DESC;