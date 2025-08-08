-- Script de diagnóstico para investigar problema de pedidos não aparecendo no Kanban
-- Execute este script no PostgreSQL para verificar o estado atual dos pedidos

-- 1. Verificar estrutura da tabela orders
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 2. Verificar se existem pedidos na tabela
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as received_orders,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'PREPARING' THEN 1 END) as preparing_orders,
    COUNT(CASE WHEN status = 'ON_THE_WAY' THEN 1 END) as on_the_way_orders,
    COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders
FROM orders;

-- 3. Verificar pedidos recentes (últimas 24 horas)
SELECT 
    id,
    status,
    total,
    customer_name,
    delivery_address,
    created_at,
    archived_at
FROM orders 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 4. Verificar se há pedidos com status 'PENDING' (que deveriam aparecer como 'RECEIVED')
SELECT 
    id,
    status,
    total,
    customer_name,
    delivery_address,
    created_at
FROM orders 
WHERE status = 'PENDING'
ORDER BY created_at DESC;

-- 5. Verificar se há pedidos arquivados
SELECT 
    COUNT(*) as archived_orders,
    COUNT(CASE WHEN archived_at IS NOT NULL THEN 1 END) as with_archived_at
FROM orders;

-- 6. Verificar pedidos com status inválidos
SELECT DISTINCT status FROM orders ORDER BY status;

-- 7. Verificar se há pedidos sem user_id (pedidos manuais)
SELECT 
    COUNT(*) as orders_without_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id
FROM orders;

-- 8. Verificar pedidos mais recentes com detalhes completos
SELECT 
    o.id,
    o.status,
    o.total,
    o.customer_name,
    o.delivery_address,
    o.created_at,
    o.archived_at,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= NOW() - INTERVAL '7 days'
GROUP BY o.id, o.status, o.total, o.customer_name, o.delivery_address, o.created_at, o.archived_at
ORDER BY o.created_at DESC
LIMIT 10; 