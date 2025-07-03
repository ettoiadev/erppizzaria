-- Script simplificado para diagnosticar problemas no painel administrativo
-- Foca nos problemas essenciais sem regex complexo

-- 1. Verificar quantos registros há em cada tabela
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

-- 2. Verificar se há order_items sem produtos correspondentes (PROBLEMA PRINCIPAL)
SELECT 
    'Order Items sem Produtos' as diagnostico,
    count(*) as total_problemas
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE p.id IS NULL;

-- 3. Mostrar exemplos de order_items problemáticos
SELECT 
    oi.id as order_item_id,
    oi.product_id,
    oi.order_id,
    oi.quantity,
    CASE 
        WHEN p.id IS NULL THEN '❌ PRODUTO NÃO ENCONTRADO'
        ELSE '✅ ' || p.name
    END as status_produto
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
ORDER BY (p.id IS NULL) DESC, oi.created_at DESC
LIMIT 10;

-- 4. Testar a query da API - versão resumida
SELECT 
    o.id as order_id,
    o.status,
    o.created_at,
    count(oi.id) as total_items,
    count(pr.id) as items_com_produto,
    count(oi.id) - count(pr.id) as items_sem_produto
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products pr ON oi.product_id = pr.id
GROUP BY o.id, o.status, o.created_at
HAVING count(oi.id) - count(pr.id) > 0  -- Apenas pedidos com problemas
ORDER BY o.created_at DESC
LIMIT 5;

-- 5. Mostrar alguns produtos disponíveis
SELECT 
    'Produtos Disponíveis' as info,
    count(*) as total
FROM products 
WHERE available = true;

-- 6. Verificar se há produtos duplicados ou com problemas
SELECT 
    id,
    name,
    available,
    created_at
FROM products 
WHERE available = true
ORDER BY created_at DESC
LIMIT 5; 