-- Script para testar dados dos pedidos
-- Execute no pgAdmin4

-- 1. Verificar se há pedidos criados
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as recebidos,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as ultima_hora
FROM orders;

-- 2. Mostrar últimos 5 pedidos com dados básicos
SELECT 
    id,
    user_id,
    status,
    total,
    payment_method,
    delivery_address,
    delivery_phone,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Testar query que a API usa (simular um pedido)
SELECT o.*, 
       p.full_name, p.phone,
       COALESCE(
         json_agg(
           json_build_object(
             'id', oi.id,
             'product_id', oi.product_id,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price,
             'price', oi.unit_price,
             'size', oi.size,
             'toppings', oi.toppings,
             'special_instructions', oi.special_instructions,
             'name', COALESCE(pr.name, 'Produto')
           ) ORDER BY oi.created_at
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'::json
       ) as order_items
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products pr ON oi.product_id = pr.id
WHERE o.created_at > NOW() - INTERVAL '1 hour'
GROUP BY o.id, p.full_name, p.phone
ORDER BY o.created_at DESC
LIMIT 1;

-- 4. Verificar se há itens órfãos (sem pedido)
SELECT COUNT(*) as itens_orfaos
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- 5. Verificar se há produtos referenciados que não existem
SELECT COUNT(*) as produtos_inexistentes
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE p.id IS NULL;

-- 6. Mostrar estrutura de um pedido completo (se existir)
SELECT 
    'Estrutura de pedido completo:' as info;
    
WITH latest_order AS (
    SELECT id FROM orders ORDER BY created_at DESC LIMIT 1
)
SELECT 
    o.id as pedido_id,
    o.status,
    o.total,
    o.payment_method,
    o.delivery_address,
    p.full_name as cliente_nome,
    json_agg(
        json_build_object(
            'item_id', oi.id,
            'produto_nome', pr.name,
            'quantidade', oi.quantity,
            'preco_unitario', oi.unit_price
        )
    ) as itens
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products pr ON oi.product_id = pr.id
WHERE o.id = (SELECT id FROM latest_order)
GROUP BY o.id, o.status, o.total, o.payment_method, o.delivery_address, p.full_name; 