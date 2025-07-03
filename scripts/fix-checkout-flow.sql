-- Script para corrigir problemas no fluxo de checkout
-- Execute este script no banco PostgreSQL williamdiskpizza

-- 1. Adicionar coluna half_and_half se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'half_and_half'
    ) THEN
        ALTER TABLE order_items ADD COLUMN half_and_half JSONB DEFAULT NULL;
        RAISE NOTICE 'Coluna half_and_half adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna half_and_half já existe.';
    END IF;
END $$;

-- 2. Garantir que todas as colunas necessárias existem em order_items
DO $$ 
BEGIN
    -- Verificar e adicionar size
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'size'
    ) THEN
        ALTER TABLE order_items ADD COLUMN size VARCHAR(50);
    END IF;

    -- Verificar e adicionar toppings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'toppings'
    ) THEN
        ALTER TABLE order_items ADD COLUMN toppings JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Verificar e adicionar special_instructions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE order_items ADD COLUMN special_instructions TEXT;
    END IF;
END $$;

-- 3. Verificar e corrigir constraints em payment_method
DO $$ 
BEGIN
    -- Listar valores atuais do enum
    RAISE NOTICE 'Valores atuais de payment_method: %', 
        (SELECT string_agg(enumlabel, ', ') 
         FROM pg_enum 
         WHERE enumtypid = 'payment_method'::regtype);
END $$;

-- 4. Verificar estrutura completa das tabelas
SELECT 
    'orders' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
UNION ALL
SELECT 
    'order_items' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY table_name, column_name;

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_half_and_half ON order_items((half_and_half IS NOT NULL));

-- Confirmar execução
SELECT 'Script de correção do checkout executado com sucesso!' as status; 