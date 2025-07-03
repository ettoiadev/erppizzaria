-- Verificar quantos produtos existem e seus status
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN active = true THEN 1 END) as produtos_ativos,
    COUNT(CASE WHEN available = true THEN 1 END) as produtos_disponiveis,
    COUNT(CASE WHEN active = true AND available = true THEN 1 END) as produtos_visiveis
FROM products;

-- Listar todos os produtos com seus status
SELECT 
    id,
    name,
    active,
    available,
    category_id,
    price
FROM products
ORDER BY created_at DESC;

-- Verificar se a coluna available existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name = 'available'; 