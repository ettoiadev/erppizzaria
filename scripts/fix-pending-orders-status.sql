-- Script para corrigir pedidos com status PENDING para RECEIVED
-- Execute este script no PostgreSQL para atualizar pedidos existentes

-- 1. Verificar quantos pedidos têm status PENDING
SELECT 
    COUNT(*) as pending_orders,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as status_pending,
    COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as status_received
FROM orders;

-- 2. Atualizar pedidos com status PENDING para RECEIVED
UPDATE orders 
SET status = 'RECEIVED', updated_at = NOW()
WHERE status = 'PENDING';

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as received_orders,
    COUNT(CASE WHEN status = 'PREPARING' THEN 1 END) as preparing_orders,
    COUNT(CASE WHEN status = 'ON_THE_WAY' THEN 1 END) as on_the_way_orders,
    COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders
FROM orders;

-- 4. Verificar pedidos recentes para confirmar
SELECT 
    id,
    status,
    total,
    customer_name,
    delivery_address,
    created_at
FROM orders 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC; 