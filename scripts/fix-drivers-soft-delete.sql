-- =====================================================
-- SCRIPT PARA MELHORAR SISTEMA DE EXCLUSÃO DE ENTREGADORES
-- Execute no pgAdmin4 - Database: williamdiskpizza
-- =====================================================

-- 1. Verificar estrutura atual da tabela drivers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna 'active' para soft-delete se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'active' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE drivers ADD COLUMN active BOOLEAN DEFAULT true;
        COMMENT ON COLUMN drivers.active IS 'Indica se o entregador está ativo (false = soft delete)';
        RAISE NOTICE 'Coluna "active" adicionada à tabela drivers com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna "active" já existe na tabela drivers.';
    END IF;
END
$$;

-- 3. Adicionar coluna 'deleted_at' como alternativa se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'deleted_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE drivers ADD COLUMN deleted_at TIMESTAMP NULL;
        COMMENT ON COLUMN drivers.deleted_at IS 'Data/hora da exclusão lógica (soft delete)';
        RAISE NOTICE 'Coluna "deleted_at" adicionada à tabela drivers com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna "deleted_at" já existe na tabela drivers.';
    END IF;
END
$$;

-- 4. Verificar se existe coluna driver_id na tabela orders
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'driver_id' 
            AND table_schema = 'public'
        ) THEN 'SIM - Coluna driver_id existe na tabela orders'
        ELSE 'NÃO - Coluna driver_id não existe na tabela orders'
    END as status_driver_id;

-- 5. Verificar estrutura final da tabela drivers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Definir todos os entregadores existentes como ativos (se a coluna foi criada)
UPDATE drivers 
SET active = true 
WHERE active IS NULL;

-- Script executado com sucesso! Sistema de exclusão de entregadores melhorado. 