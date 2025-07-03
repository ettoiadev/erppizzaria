-- Script para debugar erro 500 na criação de pedidos
-- Execute no pgAdmin4 no banco williamdiskpizza

-- 1. Verificar se as tabelas existem
SELECT 
    'Tabela orders existe?' as verificacao,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') as resultado
UNION ALL
SELECT 
    'Tabela order_items existe?' as verificacao,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') as resultado
UNION ALL
SELECT 
    'Tabela products existe?' as verificacao,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') as resultado;

-- 2. Verificar estrutura da tabela orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 3. Verificar valores do enum payment_method
SELECT unnest(enum_range(NULL::payment_method)) as valores_payment_method;

-- 4. Verificar se há produtos cadastrados
SELECT COUNT(*) as total_produtos FROM products;
SELECT id, name, price, active FROM products LIMIT 5;

-- 5. Verificar se o usuário existe
SELECT id, email, full_name, role 
FROM profiles 
WHERE id = '8e66e83e-a62b-47f9-98fb-8e84707fb916';

-- 6. Teste manual de inserção de pedido
DO $$
DECLARE
    v_user_id UUID := '8e66e83e-a62b-47f9-98fb-8e84707fb916';
    v_order_id UUID;
    v_product_id UUID;
BEGIN
    -- Buscar um produto válido
    SELECT id INTO v_product_id FROM products WHERE active = true LIMIT 1;
    
    IF v_product_id IS NULL THEN
        RAISE NOTICE 'ERRO: Nenhum produto ativo encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testando com produto ID: %', v_product_id;
    
    -- Tentar criar pedido
    BEGIN
        INSERT INTO orders (
            user_id, 
            status, 
            total, 
            subtotal, 
            delivery_fee, 
            discount,
            payment_method, 
            payment_status, 
            delivery_address, 
            delivery_phone,
            delivery_instructions, 
            estimated_delivery_time
        ) VALUES (
            v_user_id,
            'RECEIVED',
            67.00,
            67.00,
            0,
            0,
            'PIX',
            'PENDING',
            'Rua Teste, 123',
            '(11) 99999-9999',
            'Teste de pedido',
            NOW() + INTERVAL '45 minutes'
        ) RETURNING id INTO v_order_id;
        
        RAISE NOTICE 'Pedido criado com sucesso! ID: %', v_order_id;
        
        -- Tentar criar item do pedido
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_order_id,
            v_product_id,
            1,
            67.00,
            67.00
        );
        
        RAISE NOTICE 'Item do pedido criado com sucesso!';
        
        -- Fazer rollback para não deixar dados de teste
        ROLLBACK;
        RAISE NOTICE 'Rollback executado - dados de teste removidos';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERRO ao criar pedido: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    END;
END $$;

-- 7. Verificar constraints e foreign keys
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('orders', 'order_items')
ORDER BY tc.table_name, tc.constraint_type; 