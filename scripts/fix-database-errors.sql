-- Script para corrigir erros do banco de dados - William Disk Pizza
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
    column_default
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
    column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

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

SELECT '🚀 DIAGNÓSTICO CONCLUÍDO! Execute este script e reinicie o servidor Next.js' as status; 