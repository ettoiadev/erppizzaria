-- Script para testar estrutura de dados do cliente
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Verificar estrutura da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('customer_name', 'delivery_phone', 'delivery_address', 'user_id')
ORDER BY column_name;

-- 2. Verificar se existem dados de cliente nos pedidos
SELECT 
    'Análise de dados do cliente nos pedidos:' as info,
    COUNT(*) as total_pedidos,
    COUNT(customer_name) as pedidos_com_nome,
    COUNT(delivery_phone) as pedidos_com_telefone,
    COUNT(user_id) as pedidos_com_user_id
FROM orders;

-- 3. Mostrar últimos 5 pedidos com dados do cliente
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    COALESCE(o.customer_name, p.full_name, 'SEM NOME') as nome_cliente,
    COALESCE(o.delivery_phone, p.phone, 'SEM TELEFONE') as telefone_cliente,
    o.status,
    o.created_at
FROM orders o 
LEFT JOIN profiles p ON o.user_id = p.id 
ORDER BY o.created_at DESC 
LIMIT 5;

-- 4. Verificar se a coluna delivery_phone existe
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_phone'
    ) THEN
        RAISE NOTICE '✅ Coluna delivery_phone existe na tabela orders';
    ELSE
        RAISE NOTICE '❌ Coluna delivery_phone NÃO existe na tabela orders';
    END IF;
END $$;

-- 5. Verificar se a coluna customer_name existe
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_name'
    ) THEN
        RAISE NOTICE '✅ Coluna customer_name existe na tabela orders';
    ELSE
        RAISE NOTICE '❌ Coluna customer_name NÃO existe na tabela orders';
    END IF;
END $$; 