-- Script para testar a API de pedidos do usuário
-- Simula o comportamento da API /api/orders?userId=XXX

-- 1. Mostrar todos os usuários que fizeram pedidos
SELECT DISTINCT 
    o.user_id,
    p.full_name,
    p.email,
    count(o.id) as total_pedidos
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
GROUP BY o.user_id, p.full_name, p.email
ORDER BY total_pedidos DESC;

-- 2. Testar query para um usuário específico (substitua o UUID pelo ID real)
-- Exemplo com o primeiro usuário encontrado
WITH first_user AS (
    SELECT DISTINCT user_id 
    FROM orders 
    LIMIT 1
)
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
CROSS JOIN first_user fu
WHERE o.user_id = fu.user_id
GROUP BY o.id, p.full_name, p.phone
ORDER BY o.created_at DESC
LIMIT 5;

-- 3. Verificar se há pedidos sem itens (possível problema)
SELECT 
    o.id as order_id,
    o.status,
    o.total,
    o.created_at,
    count(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.status, o.total, o.created_at
HAVING count(oi.id) = 0
ORDER BY o.created_at DESC;

-- 4. Verificar estrutura de dados para compatibilidade frontend
SELECT 
    'Estrutura de um pedido típico' as info,
    o.id,
    o.status,
    o.total,
    o.created_at,
    o.delivery_address,
    p.full_name as customer_name
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
ORDER BY o.created_at DESC
LIMIT 1; 