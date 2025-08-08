-- Script para debugar dados dos pedidos
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Verificar estrutura da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY column_name;

-- 2. Verificar dados dos últimos 5 pedidos
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    o.status,
    o.customer_name,
    o.delivery_address,
    o.delivery_phone,
    p.full_name as profile_name,
    p.phone as profile_phone,
    COUNT(oi.id) as total_items,
    o.created_at
FROM orders o 
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.status, o.customer_name, o.delivery_address, o.delivery_phone, p.full_name, p.phone, o.created_at
ORDER BY o.created_at DESC 
LIMIT 5;

-- 3. Verificar itens dos pedidos
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    oi.name as item_name,
    oi.quantity,
    oi.unit_price,
    oi.size,
    oi.toppings,
    p.name as product_name
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
ORDER BY o.created_at DESC 
LIMIT 10;

-- 4. Verificar se há pedidos sem endereço
SELECT 
    COUNT(*) as pedidos_sem_endereco,
    COUNT(CASE WHEN delivery_address IS NULL OR delivery_address = '' THEN 1 END) as sem_delivery_address,
    COUNT(CASE WHEN customer_name IS NULL OR customer_name = '' THEN 1 END) as sem_customer_name
FROM orders;

-- 5. Verificar pedidos com dados completos
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    o.customer_name,
    o.delivery_address,
    o.delivery_phone,
    p.full_name,
    p.phone,
    COUNT(oi.id) as items_count
FROM orders o 
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_name IS NOT NULL 
  AND o.delivery_address IS NOT NULL 
  AND o.delivery_address != ''
GROUP BY o.id, o.customer_name, o.delivery_address, o.delivery_phone, p.full_name, p.phone
ORDER BY o.created_at DESC 
LIMIT 3; 