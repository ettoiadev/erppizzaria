-- Script para testar atribuição de entregadores
-- Execute este script no pgAdmin para criar dados de teste

-- 1. Verificar se há entregadores disponíveis
SELECT id, name, status FROM drivers WHERE status = 'available';

-- 2. Criar pedidos de teste se não existirem
INSERT INTO orders (
    id, user_id, customer_name, customer_phone, customer_address,
    status, total, subtotal, delivery_fee, discount,
    payment_method, payment_status, delivery_type,
    created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
    'João Silva',
    '(11) 99999-9999',
    'Rua das Flores, 123 - Centro, São Paulo - SP',
    'PREPARING',
    35.90,
    30.90,
    5.00,
    0.00,
    'PIX',
    'PENDING',
    'delivery',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
    'Maria Santos',
    '(11) 88888-8888',
    'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    'RECEIVED',
    42.50,
    37.50,
    5.00,
    0.00,
    'CASH',
    'PENDING',
    'delivery',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 3. Verificar pedidos criados
SELECT 
    id, 
    customer_name, 
    status, 
    total,
    created_at
FROM orders 
WHERE status IN ('RECEIVED', 'PREPARING')
ORDER BY created_at DESC;

-- 4. Verificar entregadores disponíveis
SELECT 
    id, 
    name, 
    status, 
    vehicle_type
FROM drivers 
WHERE status = 'available'
ORDER BY name; 