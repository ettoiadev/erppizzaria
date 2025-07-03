-- Script para corrigir colunas de status na tabela orders
-- e criar tabela order_status_history se necessário

-- 1. Adicionar colunas delivered_at e cancelled_at se não existirem
DO $$
BEGIN
    -- Verificar e adicionar coluna delivered_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;
        RAISE NOTICE 'Coluna delivered_at adicionada à tabela orders';
    ELSE
        RAISE NOTICE 'Coluna delivered_at já existe na tabela orders';
    END IF;
    
    -- Verificar e adicionar coluna cancelled_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP;
        RAISE NOTICE 'Coluna cancelled_at adicionada à tabela orders';
    ELSE
        RAISE NOTICE 'Coluna cancelled_at já existe na tabela orders';
    END IF;
END $$;

-- 2. Criar tabela order_status_history se não existir
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    notes TEXT,
    changed_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 3. Criar índice na tabela order_status_history se não existir
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
ON order_status_history(order_id);

-- 4. Verificar estrutura final
SELECT 'Verificação final das colunas orders:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('status', 'updated_at', 'delivered_at', 'cancelled_at')
ORDER BY column_name;

SELECT 'Verificação da tabela order_status_history:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'order_status_history'
        ) THEN '✅ Tabela order_status_history existe e está pronta'
        ELSE '❌ Problema ao criar tabela order_status_history'
    END as status; 