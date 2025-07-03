-- Script para verificar o ENUM order_status e estrutura da tabela orders

-- 1. Verificar se o ENUM order_status existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = 'order_status'
        ) THEN '✅ ENUM order_status existe'
        ELSE '❌ ENUM order_status NÃO existe'
    END as status_enum;

-- 2. Mostrar valores válidos do ENUM order_status (se existir)
SELECT 
    'Valores válidos do ENUM order_status:' as info,
    unnest(enum_range(NULL::order_status)) as valores_validos;

-- 3. Verificar tipo da coluna status na tabela orders
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'status';

-- 4. Mostrar alguns status existentes nos pedidos
SELECT DISTINCT 
    status,
    count(*) as quantidade
FROM orders 
GROUP BY status
ORDER BY quantidade DESC;

-- 5. Verificar se há algum status inválido (se o ENUM existir)
-- Esta query só funciona se o ENUM existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        RAISE NOTICE 'Verificando status inválidos na tabela orders...';
        
        -- Esta parte seria executada apenas se o ENUM existir
        PERFORM * FROM orders 
        WHERE status::text NOT IN (
            SELECT unnest(enum_range(NULL::order_status))::text
        );
        
        IF NOT FOUND THEN
            RAISE NOTICE '✅ Todos os status na tabela são válidos';
        ELSE
            RAISE NOTICE '⚠️ Encontrados status inválidos na tabela';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ ENUM order_status não existe - tabela usa VARCHAR';
    END IF;
END $$;

-- 6. Script para criar o ENUM se não existir (COMENTADO - execute manualmente se necessário)
/*
-- Execute apenas se o ENUM não existir:
CREATE TYPE order_status AS ENUM (
    'RECEIVED',
    'PREPARING', 
    'ON_THE_WAY',
    'DELIVERED',
    'CANCELLED'
);

-- E depois altere a coluna para usar o ENUM:
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;
*/

SELECT 'Verificação do ENUM order_status concluída' as resultado; 