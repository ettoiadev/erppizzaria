-- Script para remover entregadores mockados/de teste do banco de dados
-- Execute este script para limpar dados de teste e manter apenas entregadores reais

-- 1. Identificar e remover pedidos associados aos entregadores de teste
DELETE FROM order_items 
WHERE order_id IN (
  SELECT o.id 
  FROM orders o 
  INNER JOIN drivers d ON o.driver_id = d.id 
  WHERE d.name IN ('João Silva', 'Maria Santos', 'Pedro Oliveira')
     OR d.email LIKE '%@delivery.com'
     OR d.email LIKE '%@example.com'
     OR d.id IN (
       '550e8400-e29b-41d4-a716-446655440001',
       '550e8400-e29b-41d4-a716-446655440002', 
       '550e8400-e29b-41d4-a716-446655440003',
       'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
       'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
     )
);

-- 2. Remover pedidos dos entregadores de teste
DELETE FROM orders 
WHERE driver_id IN (
  SELECT d.id 
  FROM drivers d 
  WHERE d.name IN ('João Silva', 'Maria Santos', 'Pedro Oliveira')
     OR d.email LIKE '%@delivery.com'
     OR d.email LIKE '%@example.com'
     OR d.id IN (
       '550e8400-e29b-41d4-a716-446655440001',
       '550e8400-e29b-41d4-a716-446655440002', 
       '550e8400-e29b-41d4-a716-446655440003',
       'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
       'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
     )
);

-- 3. Remover entregadores mockados/de teste
DELETE FROM drivers 
WHERE name IN ('João Silva', 'Maria Santos', 'Pedro Oliveira')
   OR email LIKE '%@delivery.com'
   OR email LIKE '%@example.com'
   OR id IN (
     '550e8400-e29b-41d4-a716-446655440001',
     '550e8400-e29b-41d4-a716-446655440002', 
     '550e8400-e29b-41d4-a716-446655440003',
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
     'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
   );

-- 4. Verificar se restaram apenas entregadores reais
SELECT 
  'Entregadores restantes' as tipo,
  COUNT(*) as quantidade
FROM drivers;

-- 5. Listar entregadores restantes para verificação
SELECT 
  id,
  name,
  email,
  phone,
  vehicle_type,
  status,
  total_deliveries,
  created_at
FROM drivers
ORDER BY created_at DESC;

-- 6. Verificar se há pedidos órfãos (sem driver_id válido)
SELECT 
  'Pedidos com driver_id inválido' as tipo,
  COUNT(*) as quantidade
FROM orders o
LEFT JOIN drivers d ON o.driver_id = d.id
WHERE o.driver_id IS NOT NULL 
  AND d.id IS NULL;