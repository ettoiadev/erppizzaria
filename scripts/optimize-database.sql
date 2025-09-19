-- Script de Otimização do Banco de Dados PostgreSQL
-- William Disk Pizza - Sistema ERP
-- Data: 2024

-- =====================================================
-- ANÁLISE DE PERFORMANCE E CRIAÇÃO DE ÍNDICES
-- =====================================================

-- 1. ÍNDICES PARA TABELA PRODUCTS
-- Produtos são consultados frequentemente por categoria, status ativo e nome

-- Índice para busca por categoria ativa
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products (category_id, active) 
WHERE active = true;

-- Índice para busca por nome (para autocomplete e pesquisa)
CREATE INDEX IF NOT EXISTS idx_products_name_active 
ON products (name, active) 
WHERE active = true;

-- Índice para busca por preço (para filtros de preço)
CREATE INDEX IF NOT EXISTS idx_products_price_active 
ON products (price, active) 
WHERE active = true;

-- Índice composto para listagem geral de produtos
CREATE INDEX IF NOT EXISTS idx_products_active_category_name 
ON products (active, category_id, name) 
WHERE active = true;

-- =====================================================
-- 2. ÍNDICES PARA TABELA CATEGORIES
-- =====================================================

-- Índice para ordenação por sort_order
CREATE INDEX IF NOT EXISTS idx_categories_sort_order 
ON categories (sort_order, name);

-- Índice para categorias ativas
CREATE INDEX IF NOT EXISTS idx_categories_active 
ON categories (active, sort_order) 
WHERE active = true;

-- =====================================================
-- 3. ÍNDICES PARA TABELA ORDERS
-- =====================================================

-- Índice para busca por status do pedido
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders (status, created_at DESC);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_orders_customer 
ON orders (customer_id, created_at DESC);

-- Índice para busca por data de criação
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders (created_at DESC);

-- Índice composto para dashboard admin
CREATE INDEX IF NOT EXISTS idx_orders_status_date 
ON orders (status, created_at DESC, total_amount);

-- =====================================================
-- 4. ÍNDICES PARA TABELA CUSTOMERS
-- =====================================================

-- Índice para busca por email (login)
CREATE INDEX IF NOT EXISTS idx_customers_email 
ON customers (email) 
WHERE email IS NOT NULL;

-- Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_customers_phone 
ON customers (phone) 
WHERE phone IS NOT NULL;

-- Índice para clientes ativos
CREATE INDEX IF NOT EXISTS idx_customers_active 
ON customers (active, created_at DESC) 
WHERE active = true;

-- =====================================================
-- 5. ÍNDICES PARA TABELA ORDER_ITEMS
-- =====================================================

-- Índice para busca por pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items (order_id);

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items (product_id);

-- =====================================================
-- 6. ÍNDICES PARA TABELA ADMIN_SETTINGS
-- =====================================================

-- Índice para busca por chave de configuração
CREATE INDEX IF NOT EXISTS idx_admin_settings_key 
ON admin_settings (key);

-- Índice para busca por tipo de configuração
CREATE INDEX IF NOT EXISTS idx_admin_settings_type 
ON admin_settings (setting_type) 
WHERE setting_type IS NOT NULL;

-- =====================================================
-- 7. ÍNDICES PARA TABELA ADDRESSES
-- =====================================================

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_addresses_customer 
ON addresses (customer_id, is_default DESC);

-- =====================================================
-- 8. ÍNDICES PARA TABELA FAVORITES
-- =====================================================

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_favorites_user 
ON favorites (user_id, created_at DESC);

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_favorites_product 
ON favorites (product_id);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique 
ON favorites (user_id, product_id);

-- =====================================================
-- 9. OTIMIZAÇÕES DE CONFIGURAÇÃO DO POSTGRESQL
-- =====================================================

-- Configurações recomendadas para performance (executar como superuser)
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;
-- SELECT pg_reload_conf();

-- =====================================================
-- 10. QUERIES DE ANÁLISE DE PERFORMANCE
-- =====================================================

-- Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY tablename, attname;

-- Verificar índices existentes
SELECT 
    t.relname AS table_name,
    i.relname AS index_name,
    a.attname AS column_name,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary
FROM 
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE 
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN ('products', 'categories', 'orders', 'customers', 'order_items', 'admin_settings', 'addresses', 'favorites')
ORDER BY t.relname, i.relname;

-- Verificar queries mais lentas (requer pg_stat_statements)
-- SELECT 
--     query,
--     calls,
--     total_time,
--     mean_time,
--     rows
-- FROM pg_stat_statements 
-- WHERE query LIKE '%products%' OR query LIKE '%orders%'
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- =====================================================
-- 11. VACUUM E ANALYZE PARA OTIMIZAÇÃO
-- =====================================================

-- Atualizar estatísticas das tabelas principais
ANALYZE products;
ANALYZE categories;
ANALYZE orders;
ANALYZE customers;
ANALYZE order_items;
ANALYZE admin_settings;
ANALYZE addresses;
ANALYZE favorites;

-- Vacuum para limpeza (executar em horário de baixo uso)
-- VACUUM ANALYZE products;
-- VACUUM ANALYZE categories;
-- VACUUM ANALYZE orders;
-- VACUUM ANALYZE customers;

-- =====================================================
-- 12. QUERIES OTIMIZADAS PARA CASOS COMUNS
-- =====================================================

-- Query otimizada para listagem de produtos por categoria
-- EXPLAIN ANALYZE
-- SELECT p.id, p.name, p.description, p.price, p.image, c.name as category_name
-- FROM products p
-- INNER JOIN categories c ON p.category_id = c.id
-- WHERE p.active = true AND c.active = true
-- ORDER BY c.sort_order, p.name;

-- Query otimizada para dashboard de pedidos
-- EXPLAIN ANALYZE
-- SELECT 
--     o.id, o.status, o.total_amount, o.created_at,
--     c.name as customer_name, c.phone
-- FROM orders o
-- INNER JOIN customers c ON o.customer_id = c.id
-- WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
-- ORDER BY o.created_at DESC
-- LIMIT 50;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Execute este script em ambiente de desenvolvimento primeiro
-- 2. Monitore o uso de espaço em disco após criar índices
-- 3. Use EXPLAIN ANALYZE para verificar se os índices estão sendo usados
-- 4. Considere remover índices não utilizados após análise
-- 5. Execute VACUUM e ANALYZE regularmente em produção
-- =====================================================

-- Verificar se os índices foram criados com sucesso
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;