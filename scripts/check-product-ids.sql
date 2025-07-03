-- Script para verificar IDs problemáticos dos produtos
-- Execute no pgAdmin4

-- 1. Verificar todos os produtos ativos
SELECT 
    id,
    name,
    LENGTH(id::text) as id_length,
    CASE 
        WHEN id::text LIKE '%--' THEN 'TEM --' 
        ELSE 'OK' 
    END as id_status
FROM products 
WHERE active = true
ORDER BY name;

-- 2. Verificar se há IDs com caracteres estranhos
SELECT 
    id,
    name,
    id::text as id_string
FROM products 
WHERE active = true 
AND (
    id::text LIKE '%--' OR
    id::text LIKE '%--%' OR
    LENGTH(id::text) > 36
)
ORDER BY name;

-- 3. Verificar estrutura da tabela products
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'id';

-- 4. Mostrar alguns produtos para verificar
SELECT id, name, active, available
FROM products
WHERE active = true
LIMIT 10; 