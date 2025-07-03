-- Script para testar a correção do ENUM order_status no endpoint de cancelamento

-- 1. Verificar estrutura da coluna status (mesma query que o endpoint usa)
SELECT 
    'Estrutura detectada pelo endpoint:' as info,
    column_name, 
    data_type, 
    udt_name,
    CASE 
        WHEN udt_name = 'order_status' OR data_type = 'USER-DEFINED' 
        THEN 'Usará CAST($1 AS order_status)'
        ELSE 'Usará $1::VARCHAR'
    END as cast_method
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('status', 'delivered_at', 'cancelled_at')
ORDER BY column_name;

-- 2. Testar se o ENUM order_status existe e mostrar valores
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status')
        THEN 'ENUM order_status existe ✅'
        ELSE 'ENUM order_status NÃO existe ❌'
    END as enum_status;

-- 3. Mostrar valores do ENUM (se existir)
-- Esta query falhará graciosamente se o ENUM não existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        RAISE NOTICE 'Valores válidos do ENUM: %', 
            array_to_string(enum_range(NULL::order_status), ', ');
    ELSE
        RAISE NOTICE 'ENUM order_status não existe - usando VARCHAR';
    END IF;
END $$;

-- 4. Verificar pedidos disponíveis para teste
SELECT 
    'Pedidos disponíveis para teste de cancelamento:' as info,
    id,
    status,
    total,
    created_at
FROM orders 
WHERE status IN ('RECEIVED', 'PREPARING', 'ON_THE_WAY')
ORDER BY created_at DESC
LIMIT 3;

-- 5. Simular a query UPDATE que será executada (SEM EXECUTAR)
-- Mostra como a query seria construída
SELECT 
    'Exemplo de query que seria executada pelo endpoint:' as exemplo,
    'UPDATE orders SET status = CAST(''CANCELLED'' AS order_status), updated_at = NOW() WHERE id = ''uuid-aqui'' RETURNING *' as query_exemplo
WHERE EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status')

UNION ALL

SELECT 
    'Exemplo de query que seria executada pelo endpoint:' as exemplo,
    'UPDATE orders SET status = ''CANCELLED''::VARCHAR, updated_at = NOW() WHERE id = ''uuid-aqui'' RETURNING *' as query_exemplo
WHERE NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status');

-- 6. Verificar se a tabela order_status_history está pronta
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_status_history')
        THEN 'Tabela order_status_history existe ✅'
        ELSE 'Tabela order_status_history NÃO existe ⚠️'
    END as history_table_status;

SELECT 'Verificação da correção do ENUM concluída!' as resultado; 