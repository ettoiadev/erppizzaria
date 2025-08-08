-- Script para testar estrutura da tabela orders
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Verificar estrutura atual da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY column_name;

-- 2. Verificar se as colunas necessárias existem
DO $$ 
BEGIN 
    -- Verificar customer_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_name'
    ) THEN
        RAISE NOTICE '✅ Coluna customer_name existe na tabela orders';
    ELSE
        RAISE NOTICE '❌ Coluna customer_name NÃO existe na tabela orders';
    END IF;
    
    -- Verificar delivery_phone
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_phone'
    ) THEN
        RAISE NOTICE '✅ Coluna delivery_phone existe na tabela orders';
    ELSE
        RAISE NOTICE '❌ Coluna delivery_phone NÃO existe na tabela orders';
    END IF;
    
    -- Verificar delivery_address
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_address'
    ) THEN
        RAISE NOTICE '✅ Coluna delivery_address existe na tabela orders';
    ELSE
        RAISE NOTICE '❌ Coluna delivery_address NÃO existe na tabela orders';
    END IF;
END $$;

-- 3. Verificar dados dos últimos 3 pedidos
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    o.status,
    o.customer_name,
    o.delivery_phone,
    p.full_name as profile_name,
    p.phone as profile_phone,
    o.created_at
FROM orders o 
LEFT JOIN profiles p ON o.user_id = p.id
ORDER BY o.created_at DESC 
LIMIT 3; 