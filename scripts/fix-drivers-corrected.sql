-- SCRIPT CORRIGIDO PARA MELHORAR SISTEMA DE EXCLUSÃO DE ENTREGADORES
-- Execute no pgAdmin4 - Database: williamdiskpizza

-- 1. Verificar estrutura da tabela drivers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna 'active' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'active' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE drivers ADD COLUMN active BOOLEAN DEFAULT true;
        COMMENT ON COLUMN drivers.active IS 'Indica se o entregador está ativo';
        RAISE NOTICE 'Coluna active adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna active já existe.';
    END IF;
END
$$;

-- 3. Adicionar coluna 'deleted_at' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'deleted_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE drivers ADD COLUMN deleted_at TIMESTAMP NULL;
        COMMENT ON COLUMN drivers.deleted_at IS 'Data da exclusão lógica';
        RAISE NOTICE 'Coluna deleted_at adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna deleted_at já existe.';
    END IF;
END
$$;

-- 4. Verificar coluna driver_id na tabela orders
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'driver_id' 
        ) THEN 'SIM - driver_id existe em orders'
        ELSE 'NÃO - driver_id não existe em orders'
    END as status_driver_id;

-- 5. Definir entregadores como ativos
DO $$
BEGIN
    UPDATE drivers SET active = true WHERE active IS NULL;
    RAISE NOTICE 'Entregadores definidos como ativos!';
END
$$;

-- 6. Verificar resultado final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
ORDER BY ordinal_position; 