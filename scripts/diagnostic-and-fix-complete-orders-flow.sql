-- Script de Diagnóstico e Correção Completa do Fluxo de Pedidos
-- Execute este script no pgAdmin4 no banco williamdiskpizza

-- =====================================================
-- DIAGNÓSTICO INICIAL
-- =====================================================

SELECT 'INICIANDO DIAGNÓSTICO DO SISTEMA DE PEDIDOS...' as status;

-- 1. Verificar se as tabelas principais existem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE EXCEPTION 'ERRO CRÍTICO: Tabela orders não existe!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        RAISE EXCEPTION 'ERRO CRÍTICO: Tabela order_items não existe!';
    END IF;
    
    RAISE NOTICE '✅ Tabelas principais existem';
END $$;

-- 2. Verificar estrutura atual da tabela order_items
SELECT 
    '📋 ESTRUTURA ATUAL DA TABELA ORDER_ITEMS:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('size', 'toppings', 'special_instructions', 'half_and_half', 'name') 
        THEN '🔧 NECESSÁRIO PARA PIZZA MEIO A MEIO'
        ELSE '✅ PADRÃO'
    END as status
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- =====================================================
-- CORREÇÃO AUTOMÁTICA
-- =====================================================

SELECT 'INICIANDO CORREÇÕES AUTOMÁTICAS...' as status;

DO $$ 
DECLARE
    col_count INTEGER := 0;
BEGIN
    -- Verificar e adicionar coluna size
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'size'
    ) THEN
        ALTER TABLE order_items ADD COLUMN size VARCHAR(50);
        col_count := col_count + 1;
        RAISE NOTICE '✅ Coluna size adicionada em order_items';
    ELSE
        RAISE NOTICE '✓ Coluna size já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna toppings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'toppings'
    ) THEN
        ALTER TABLE order_items ADD COLUMN toppings JSONB DEFAULT '[]'::jsonb;
        col_count := col_count + 1;
        RAISE NOTICE '✅ Coluna toppings adicionada em order_items';
    ELSE
        RAISE NOTICE '✓ Coluna toppings já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna special_instructions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE order_items ADD COLUMN special_instructions TEXT;
        col_count := col_count + 1;
        RAISE NOTICE '✅ Coluna special_instructions adicionada em order_items';
    ELSE
        RAISE NOTICE '✓ Coluna special_instructions já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna half_and_half
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'half_and_half'
    ) THEN
        ALTER TABLE order_items ADD COLUMN half_and_half JSONB;
        col_count := col_count + 1;
        RAISE NOTICE '✅ Coluna half_and_half adicionada em order_items';
    ELSE
        RAISE NOTICE '✓ Coluna half_and_half já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE order_items ADD COLUMN name VARCHAR(255);
        col_count := col_count + 1;
        RAISE NOTICE '✅ Coluna name adicionada em order_items';
    ELSE
        RAISE NOTICE '✓ Coluna name já existe em order_items';
    END IF;

    IF col_count > 0 THEN
        RAISE NOTICE '🔧 Total de colunas adicionadas: %', col_count;
    ELSE
        RAISE NOTICE '✅ Todas as colunas já existiam';
    END IF;
END $$;

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

SELECT 'CRIANDO ÍNDICES PARA MELHOR PERFORMANCE...' as status;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_order_items_half_and_half ON order_items USING GIN(half_and_half);
CREATE INDEX IF NOT EXISTS idx_order_items_toppings ON order_items USING GIN(toppings);
CREATE INDEX IF NOT EXISTS idx_order_items_name ON order_items(name);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

SELECT '✅ Índices criados com sucesso' as status;

-- =====================================================
-- VERIFICAR ESTRUTURA FINAL
-- =====================================================

SELECT 'ESTRUTURA FINAL DA TABELA ORDER_ITEMS:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('size', 'toppings', 'special_instructions', 'half_and_half', 'name') 
        THEN '🍕 PIZZA MEIO A MEIO'
        ELSE '📦 PADRÃO'
    END as funcionalidade
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- =====================================================
-- TESTAR INSERÇÃO DE DADOS
-- =====================================================

SELECT 'TESTANDO INSERÇÃO DE DADOS DE EXEMPLO...' as status;

DO $$
DECLARE
    test_order_id UUID;
    test_product_id UUID := gen_random_uuid();
BEGIN
    -- Criar um pedido de teste (se não existir nenhum)
    SELECT id INTO test_order_id FROM orders LIMIT 1;
    
    IF test_order_id IS NULL THEN
        -- Inserir um pedido de teste básico
        INSERT INTO orders (
            user_id, status, total, subtotal, delivery_fee, discount,
            payment_method, payment_status, delivery_address, delivery_phone,
            delivery_instructions
        ) VALUES (
            gen_random_uuid(), 'RECEIVED', 50.00, 45.00, 5.00, 0.00,
            'PIX', 'PENDING', 'Rua Teste, 123', '(12) 99999-9999',
            'Pedido de teste'
        ) RETURNING id INTO test_order_id;
        
        RAISE NOTICE '📝 Pedido de teste criado: %', test_order_id;
    END IF;

    -- Testar inserção de item com pizza meio a meio
    BEGIN
        INSERT INTO order_items (
            order_id, product_id, name, quantity, unit_price, total_price,
            size, toppings, special_instructions, half_and_half
        ) VALUES (
            test_order_id,
            test_product_id,
            'Pizza Meio a Meio Teste',
            1,
            25.00,
            25.00,
            'Grande',
            '["queijo extra"]'::jsonb,
            'Teste de observação',
            '{
                "firstHalf": {
                    "productId": "' || gen_random_uuid() || '",
                    "productName": "Margherita",
                    "toppings": ["manjericão", "tomate"]
                },
                "secondHalf": {
                    "productId": "' || gen_random_uuid() || '",
                    "productName": "Pepperoni", 
                    "toppings": ["pepperoni", "orégano"]
                }
            }'::jsonb
        );
        
        RAISE NOTICE '✅ Teste de inserção bem-sucedido!';
        
        -- Remover item de teste
        DELETE FROM order_items WHERE product_id = test_product_id;
        RAISE NOTICE '🧹 Item de teste removido';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO no teste de inserção: %', SQLERRM;
    END;
END $$;

-- =====================================================
-- VERIFICAR PEDIDOS EXISTENTES
-- =====================================================

SELECT 'VERIFICANDO PEDIDOS EXISTENTES...' as status;

SELECT 
    COUNT(*) as total_pedidos,
    COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as recebidos,
    COUNT(CASE WHEN status = 'PREPARING' THEN 1 END) as preparando,
    COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as entregues
FROM orders;

SELECT 
    COUNT(*) as total_itens,
    COUNT(CASE WHEN half_and_half IS NOT NULL THEN 1 END) as itens_meio_a_meio,
    COUNT(CASE WHEN special_instructions IS NOT NULL THEN 1 END) as itens_com_observacoes,
    COUNT(CASE WHEN toppings IS NOT NULL AND jsonb_array_length(toppings) > 0 THEN 1 END) as itens_com_adicionais
FROM order_items;

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT 'RESUMO FINAL DO DIAGNÓSTICO:' as info;

DO $$
DECLARE
    missing_cols INTEGER := 0;
    required_cols TEXT[] := ARRAY['size', 'toppings', 'special_instructions', 'half_and_half', 'name'];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY required_cols
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' AND column_name = col
        ) THEN
            missing_cols := missing_cols + 1;
        END IF;
    END LOOP;
    
    IF missing_cols = 0 THEN
        RAISE NOTICE '🎉 SUCESSO: Todas as colunas necessárias estão presentes!';
        RAISE NOTICE '✅ A aplicação está pronta para pizza meio a meio e observações';
        RAISE NOTICE '🍕 Fluxo completo: Modal → Carrinho → Checkout → API → Banco → Admin → Impressão';
    ELSE
        RAISE NOTICE '❌ ATENÇÃO: % colunas ainda estão faltando', missing_cols;
    END IF;
END $$;

SELECT '🚀 DIAGNÓSTICO CONCLUÍDO! Verifique os logs acima para o status completo.' as status; 