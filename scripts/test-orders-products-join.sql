-- Script para testar e debugar o JOIN entre orders, order_items e products
-- Verifica se há produtos ausentes ou problemas na relação

-- 1. Verificar estrutura das tabelas envolvidas
SELECT 
    'orders' as tabela,
    count(*) as total_registros
FROM orders
UNION ALL
SELECT 
    'order_items' as tabela,
    count(*) as total_registros  
FROM order_items
UNION ALL
SELECT 
    'products' as tabela,
    count(*) as total_registros
FROM products;

-- 2. Verificar se há order_items sem produtos correspondentes
SELECT 
    oi.id as order_item_id,
    oi.product_id,
    oi.order_id,
    CASE 
        WHEN p.id IS NULL THEN 'PRODUTO NÃO ENCONTRADO'
        ELSE p.name
    END as produto_status
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
ORDER BY (p.id IS NULL) DESC, oi.created_at DESC
LIMIT 10;

-- 3. Testar a mesma query que está na API
SELECT o.*, 
       p.full_name, p.phone,
       json_agg(
         json_build_object(
           'id', oi.id,
           'product_id', oi.product_id,
           'quantity', oi.quantity,
           'unit_price', oi.unit_price,
           'total_price', oi.total_price,
           'size', oi.size,
           'toppings', oi.toppings,
           'special_instructions', oi.special_instructions,
           'products', json_build_object(
             'name', pr.name,
             'description', pr.description,
             'image', pr.image
           )
         )
       ) as order_items
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products pr ON oi.product_id = pr.id
GROUP BY o.id, p.full_name, p.phone
ORDER BY o.created_at DESC
LIMIT 5;

-- 4. Verificar se há UUIDs inválidos em product_id
SELECT 
    id,
    product_id,
    CASE 
        WHEN product_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'UUID_VALIDO'
        ELSE 'UUID_INVALIDO'
    END as uuid_status
FROM order_items
WHERE product_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
OR product_id IS NULL;

-- 5. Mostrar alguns produtos válidos para referência
SELECT 
    id,
    name,
    description,
    available
FROM products 
WHERE available = true
LIMIT 5; 