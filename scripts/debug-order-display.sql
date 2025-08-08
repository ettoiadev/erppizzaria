-- Script para debugar exibição dos dados dos pedidos
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Verificar estrutura da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('delivery_address', 'customer_address', 'customer_name', 'delivery_phone')
ORDER BY column_name;

-- 2. Verificar dados dos últimos 3 pedidos com todas as informações
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    o.status,
    o.customer_name,
    o.customer_address,
    o.delivery_address,
    o.delivery_phone,
    p.full_name as profile_name,
    p.phone as profile_phone,
    COUNT(oi.id) as total_items,
    o.created_at
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.status, o.customer_name, o.customer_address, o.delivery_address, o.delivery_phone, p.full_name, p.phone, o.created_at
ORDER BY o.created_at DESC
LIMIT 3;

-- 3. Verificar itens dos pedidos
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    oi.name as item_name,
    oi.quantity,
    oi.unit_price,
    oi.special_instructions,
    p.name as product_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.customer_name IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- 4. Verificar se há pedidos sem endereço
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(CASE WHEN delivery_address IS NOT NULL AND delivery_address != '' THEN 1 END) as com_delivery_address,
    COUNT(CASE WHEN customer_address IS NOT NULL AND customer_address != '' THEN 1 END) as com_customer_address,
    COUNT(CASE WHEN customer_name IS NOT NULL AND customer_name != '' THEN 1 END) as com_customer_name
FROM orders;

-- 5. Mostrar exemplo de pedido completo
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    o.customer_name,
    COALESCE(o.delivery_address, o.customer_address) as endereco_final,
    o.delivery_phone,
    o.status,
    COUNT(oi.id) as total_items,
    o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_name IS NOT NULL
GROUP BY o.id, o.customer_name, o.delivery_address, o.customer_address, o.delivery_phone, o.status, o.created_at
ORDER BY o.created_at DESC
LIMIT 3; 