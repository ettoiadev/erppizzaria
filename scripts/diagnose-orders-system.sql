-- Script de diagnóstico completo do sistema de pedidos
-- Execute no PostgreSQL williamdiskpizza

-- 1. Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'order_status_history', 'products', 'profiles')
ORDER BY tablename;

-- 2. Verificar estrutura da tabela orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela orders
SELECT COUNT(*) as total_orders FROM orders;

-- 4. Verificar estrutura da tabela order_items
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 5. Verificar se há produtos cadastrados
SELECT COUNT(*) as total_products FROM products;

-- 6. Verificar se há usuários na tabela profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- 7. Verificar constraints da tabela orders
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass;

-- 8. Verificar índices da tabela orders
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'orders';

-- 9. Verificar se há triggers na tabela orders
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders';

-- 10. Testar inserção básica (comentado para não executar automaticamente)
/*
INSERT INTO orders (
    user_id, 
    status, 
    total, 
    payment_method, 
    delivery_address, 
    delivery_phone
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'RECEIVED',
    50.00,
    'PIX',
    'Teste de endereço',
    '11999999999'
);
*/
