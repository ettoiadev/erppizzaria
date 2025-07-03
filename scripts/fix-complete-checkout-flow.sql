-- Script completo para diagnosticar e corrigir o fluxo de checkout
-- Execute este script no banco PostgreSQL williamdiskpizza

-- 1. Verificar estrutura da tabela orders
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO ESTRUTURA DA TABELA ORDERS ===';
    
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE NOTICE 'ERRO: Tabela orders não existe!';
    ELSE
        RAISE NOTICE 'OK: Tabela orders existe';
    END IF;
END $$;

-- 2. Verificar e corrigir colunas da tabela orders
DO $$
BEGIN
    -- Adicionar colunas faltantes se necessário
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);
        RAISE NOTICE 'Coluna subtotal adicionada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_fee') THEN
        ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Coluna delivery_fee adicionada';
    END IF;
END $$;

-- 3. Verificar e corrigir enum payment_method
DO $$
BEGIN
    -- Verificar se o enum existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX');
        RAISE NOTICE 'Enum payment_method criado';
    END IF;
END $$;

-- 4. Verificar estrutura da tabela order_items
DO $$
BEGIN
    -- Adicionar colunas faltantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'size') THEN
        ALTER TABLE order_items ADD COLUMN size VARCHAR(50);
        RAISE NOTICE 'Coluna size adicionada em order_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'toppings') THEN
        ALTER TABLE order_items ADD COLUMN toppings JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna toppings adicionada em order_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'special_instructions') THEN
        ALTER TABLE order_items ADD COLUMN special_instructions TEXT;
        RAISE NOTICE 'Coluna special_instructions adicionada em order_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'half_and_half') THEN
        ALTER TABLE order_items ADD COLUMN half_and_half JSONB;
        RAISE NOTICE 'Coluna half_and_half adicionada em order_items';
    END IF;
END $$;

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 6. Verificar estrutura completa
SELECT 
    'ESTRUTURA DA TABELA ORDERS:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

SELECT 
    'ESTRUTURA DA TABELA ORDER_ITEMS:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 7. Verificar valores do enum payment_method
SELECT 
    'VALORES DO ENUM PAYMENT_METHOD:' as info;
    
SELECT unnest(enum_range(NULL::payment_method)) as payment_methods;

-- 8. Verificar se há pedidos recentes
SELECT 
    'ÚLTIMOS 5 PEDIDOS:' as info;
    
SELECT 
    id,
    user_id,
    status,
    total,
    payment_method,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 9. Teste de inserção
DO $$
DECLARE
    test_user_id UUID;
    test_order_id UUID;
BEGIN
    -- Buscar um usuário de teste
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Tentar inserir um pedido de teste
        BEGIN
            INSERT INTO orders (
                user_id, status, total, subtotal, delivery_fee,
                payment_method, payment_status, delivery_address, 
                delivery_phone, delivery_instructions
            ) VALUES (
                test_user_id, 'RECEIVED', 100.00, 95.00, 5.00,
                'PIX', 'PENDING', 'Endereço de Teste, 123',
                '(11) 99999-9999', 'Teste de inserção'
            ) RETURNING id INTO test_order_id;
            
            RAISE NOTICE 'TESTE OK: Pedido de teste criado com ID: %', test_order_id;
            
            -- Limpar pedido de teste
            DELETE FROM orders WHERE id = test_order_id;
            RAISE NOTICE 'Pedido de teste removido';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERRO NO TESTE: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- Resultado final
SELECT 'Script de diagnóstico e correção executado!' as status; 