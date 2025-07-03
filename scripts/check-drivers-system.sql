-- Script para verificar sistema de entregadores
-- William Disk Pizza - Sistema de Entregadores

-- Verificar se tabela drivers existe
SELECT EXISTS (
   SELECT FROM pg_tables
   WHERE  schemaname = 'public'
   AND    tablename  = 'drivers'
) AS drivers_table_exists;

-- Verificar se orders tem campo driver_id
SELECT EXISTS (
   SELECT FROM information_schema.columns
   WHERE table_name = 'orders'
   AND column_name = 'driver_id'
) AS orders_has_driver_id;

-- Verificar estrutura da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Verificar se role DELIVERY existe no enum user_role
SELECT unnest(enum_range(NULL::user_role)) AS role_values;

-- Listar usuários com role DELIVERY se existirem
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles
WHERE role = 'DELIVERY'
LIMIT 10; 