-- Script para adicionar campo de arquivamento na tabela orders
-- Execute este script no PostgreSQL para adicionar funcionalidade de arquivamento

-- 1. Adicionar coluna archived_at na tabela orders
DO $$ 
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna archived_at adicionada à tabela orders';
    ELSE
        RAISE NOTICE 'Coluna archived_at já existe na tabela orders';
    END IF;
END $$;

-- 2. Criar índices para melhorar performance das queries de arquivamento
CREATE INDEX IF NOT EXISTS idx_orders_archived_at ON orders(archived_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_archived ON orders(status, archived_at);

-- 3. Verificar estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('archived_at', 'status', 'created_at')
ORDER BY ordinal_position;
