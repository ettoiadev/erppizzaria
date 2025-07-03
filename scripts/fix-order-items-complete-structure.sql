-- Script para verificar e corrigir a estrutura completa da tabela order_items
-- Execute este script no pgAdmin4 no banco williamdiskpizza

-- 1. Verificar estrutura atual
SELECT 
    'Estrutura atual da tabela order_items:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 2. Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    -- Verificar e adicionar coluna size
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'size'
    ) THEN
        ALTER TABLE order_items ADD COLUMN size VARCHAR(50);
        RAISE NOTICE 'Coluna size adicionada em order_items';
    ELSE
        RAISE NOTICE 'Coluna size já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna toppings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'toppings'
    ) THEN
        ALTER TABLE order_items ADD COLUMN toppings JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna toppings adicionada em order_items';
    ELSE
        RAISE NOTICE 'Coluna toppings já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna special_instructions (para observações do item)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE order_items ADD COLUMN special_instructions TEXT;
        RAISE NOTICE 'Coluna special_instructions adicionada em order_items';
    ELSE
        RAISE NOTICE 'Coluna special_instructions já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna half_and_half
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'half_and_half'
    ) THEN
        ALTER TABLE order_items ADD COLUMN half_and_half JSONB;
        RAISE NOTICE 'Coluna half_and_half adicionada em order_items';
    ELSE
        RAISE NOTICE 'Coluna half_and_half já existe em order_items';
    END IF;

    -- Verificar e adicionar coluna name (para facilitar consultas)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE order_items ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Coluna name adicionada em order_items';
    ELSE
        RAISE NOTICE 'Coluna name já existe em order_items';
    END IF;
END $$;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_order_items_half_and_half ON order_items USING GIN(half_and_half);
CREATE INDEX IF NOT EXISTS idx_order_items_toppings ON order_items USING GIN(toppings);
CREATE INDEX IF NOT EXISTS idx_order_items_name ON order_items(name);

-- 4. Verificar estrutura final
SELECT 
    'Estrutura final da tabela order_items:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 5. Exemplo de como os dados devem ser inseridos
SELECT 
    'Exemplo de estrutura de dados para pizza meio a meio:' as info;

-- Exemplo de JSONB para half_and_half:
SELECT 
    'half_and_half' as campo,
    '{
        "firstHalf": {
            "productId": "123e4567-e89b-12d3-a456-426614174000",
            "productName": "Pizza Margherita",
            "toppings": ["queijo extra", "orégano"]
        },
        "secondHalf": {
            "productId": "987fcdeb-51a2-43d1-9f4e-123456789abc",
            "productName": "Pizza Pepperoni",
            "toppings": ["calabresa", "azeitona"]
        }
    }'::jsonb as exemplo;

-- Exemplo de JSONB para toppings:
SELECT 
    'toppings' as campo,
    '["queijo extra", "orégano", "azeitona"]'::jsonb as exemplo;

SELECT 'Script executado com sucesso! Verifique a estrutura acima e execute a correção da API.' as status; 