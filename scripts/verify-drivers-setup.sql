-- Script de verificação do sistema de entregadores
-- William Disk Pizza - Verificação pós-setup

-- 1. Verificar se tabela drivers foi criada
SELECT 
    'Tabela drivers existe: ' || CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'drivers') 
        THEN 'SIM ✅' 
        ELSE 'NÃO ❌' 
    END as status_tabela_drivers;

-- 2. Verificar se campo driver_id foi adicionado à tabela orders
SELECT 
    'Campo driver_id na tabela orders: ' || CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'driver_id'
        ) 
        THEN 'SIM ✅' 
        ELSE 'NÃO ❌' 
    END as status_campo_driver_id;

-- 3. Contar entregadores inseridos
SELECT 
    'Entregadores cadastrados: ' || COUNT(*) || ' entregadores ✅' as status_entregadores
FROM drivers;

-- 4. Verificar índices criados
SELECT 
    'Índices criados: ' || COUNT(*) || ' índices ✅' as status_indices
FROM pg_indexes 
WHERE indexname IN ('idx_drivers_status', 'idx_drivers_profile_id', 'idx_orders_driver_id');

-- 5. Verificar trigger criado
SELECT 
    'Trigger de atualização: ' || CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_update_drivers_updated_at'
        ) 
        THEN 'SIM ✅' 
        ELSE 'NÃO ❌' 
    END as status_trigger;

-- 6. Listar entregadores cadastrados
SELECT 
    '=== ENTREGADORES CADASTRADOS ===' as separador;

SELECT 
    name as "Nome",
    vehicle_type as "Veículo", 
    vehicle_plate as "Placa",
    status as "Status",
    current_location as "Localização",
    total_deliveries as "Entregas",
    average_rating as "Avaliação"
FROM drivers
ORDER BY name;

-- 7. Verificar estrutura da tabela orders
SELECT 
    '=== ESTRUTURA TABELA ORDERS (campos relacionados) ===' as separador;

SELECT 
    column_name as "Campo",
    data_type as "Tipo",
    is_nullable as "Permite NULL"
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name IN ('id', 'status', 'driver_id')
ORDER BY ordinal_position; 