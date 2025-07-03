-- Script para verificar se as tabelas e colunas necessárias existem
-- para o endpoint de cancelamento de pedidos

-- 1. Verificar se a tabela order_status_history existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'order_status_history'
        ) THEN '✅ Tabela order_status_history existe'
        ELSE '❌ Tabela order_status_history NÃO existe'
    END as status_tabela;

-- 2. Verificar estrutura da tabela orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('delivered_at', 'cancelled_at', 'status', 'updated_at')
ORDER BY column_name;

-- 3. Verificar valores válidos para o campo status
SELECT DISTINCT status, count(*) as total
FROM orders 
GROUP BY status
ORDER BY total DESC;

-- 4. Se a tabela order_status_history existir, mostrar sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_status_history'
ORDER BY ordinal_position;

-- 5. Testar se conseguimos fazer uma query simples na tabela orders
SELECT 'Teste de conexão com tabela orders' as teste, count(*) as total_pedidos
FROM orders; 