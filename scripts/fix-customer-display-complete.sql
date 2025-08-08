-- Script completo para corrigir exibição de dados do cliente nos pedidos
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Adicionar coluna customer_name na tabela orders se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);
        RAISE NOTICE 'Coluna customer_name adicionada na tabela orders';
    ELSE
        RAISE NOTICE 'Coluna customer_name já existe na tabela orders';
    END IF;
END $$;

-- 2. Adicionar coluna delivery_phone na tabela orders se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_phone VARCHAR(20);
        RAISE NOTICE 'Coluna delivery_phone adicionada na tabela orders';
    ELSE
        RAISE NOTICE 'Coluna delivery_phone já existe na tabela orders';
    END IF;
END $$;

-- 3. Migrar nomes existentes dos perfis para os pedidos que não têm customer_name
UPDATE orders 
SET customer_name = p.full_name
FROM profiles p 
WHERE orders.user_id = p.id 
AND orders.customer_name IS NULL 
AND p.full_name IS NOT NULL;

-- 4. Migrar telefones existentes dos perfis para os pedidos que não têm delivery_phone
UPDATE orders 
SET delivery_phone = p.phone
FROM profiles p 
WHERE orders.user_id = p.id 
AND orders.delivery_phone IS NULL 
AND p.phone IS NOT NULL;

-- 5. Verificar dados atuais
SELECT 
    'Análise de dados do cliente nos pedidos:' as info,
    COUNT(*) as total_pedidos,
    COUNT(customer_name) as pedidos_com_nome,
    COUNT(delivery_phone) as pedidos_com_telefone
FROM orders;

-- 6. Mostrar últimos 3 pedidos com dados do cliente
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    COALESCE(o.customer_name, p.full_name, 'SEM NOME') as nome_cliente,
    COALESCE(o.delivery_phone, p.phone, 'SEM TELEFONE') as telefone_cliente,
    o.created_at
FROM orders o 
LEFT JOIN profiles p ON o.user_id = p.id 
ORDER BY o.created_at DESC 
LIMIT 3;

-- 7. Verificar estrutura final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('customer_name', 'delivery_phone', 'delivery_address')
ORDER BY column_name;

-- Sucesso!
SELECT '✅ Script executado com sucesso! Dados do cliente agora serão exibidos corretamente nos pedidos.' as status; 