-- Script para verificar a estrutura da tabela profiles
-- Execute este script no PostgreSQL para diagnosticar problemas

-- 1. Verificar se a tabela profiles existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- 2. Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'kitchen' THEN 1 END) as kitchen,
    COUNT(CASE WHEN role = 'delivery' THEN 1 END) as delivery
FROM profiles;

-- 4. Verificar se há clientes específicos
SELECT 
    id,
    email,
    full_name,
    role,
    active,
    created_at
FROM profiles 
WHERE role = 'customer'
LIMIT 10;

-- 5. Verificar se há problemas com foreign keys
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'profiles';

-- 6. Verificar se há índices na tabela
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles';

-- 7. Verificar se há constraints na tabela
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass; 