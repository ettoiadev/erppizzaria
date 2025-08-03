-- Script para limpeza completa do banco de dados
-- Remove dados mockados e duplicados, mantendo apenas dados reais

-- 1. Remover order_items órfãos (sem pedidos válidos)
DELETE FROM order_items 
WHERE order_id NOT IN (SELECT id FROM orders);

-- 2. Remover pedidos de entregadores mockados/inexistentes
DELETE FROM order_items 
WHERE order_id IN (
  SELECT o.id 
  FROM orders o 
  LEFT JOIN drivers d ON o.driver_id = d.id 
  WHERE o.driver_id IS NOT NULL AND d.id IS NULL
);

DELETE FROM orders 
WHERE driver_id IS NOT NULL 
  AND driver_id NOT IN (SELECT id FROM drivers);

-- 3. Remover entregadores com emails suspeitos de serem mockados
DELETE FROM order_items 
WHERE order_id IN (
  SELECT o.id 
  FROM orders o 
  INNER JOIN drivers d ON o.driver_id = d.id 
  WHERE d.email LIKE '%@delivery.com'
     OR d.email LIKE '%@example.com'
     OR d.email LIKE '%@test.com'
     OR d.name IN ('João Silva', 'Maria Santos', 'Pedro Oliveira')
);

DELETE FROM orders 
WHERE driver_id IN (
  SELECT d.id 
  FROM drivers d 
  WHERE d.email LIKE '%@delivery.com'
     OR d.email LIKE '%@example.com'
     OR d.email LIKE '%@test.com'
     OR d.name IN ('João Silva', 'Maria Santos', 'Pedro Oliveira')
);

DELETE FROM drivers 
WHERE email LIKE '%@delivery.com'
   OR email LIKE '%@example.com'
   OR email LIKE '%@test.com'
   OR name IN ('João Silva', 'Maria Santos', 'Pedro Oliveira');

-- 4. Remover categorias duplicadas (manter apenas uma versão ativa de cada)
-- Primeiro, identificar duplicatas por nome
WITH categoria_duplicadas AS (
  SELECT name, MIN(id) as keep_id
  FROM categories 
  WHERE active = true
  GROUP BY name
  HAVING COUNT(*) > 1
),
categorias_para_remover AS (
  SELECT c.id
  FROM categories c
  INNER JOIN categoria_duplicadas cd ON c.name = cd.name
  WHERE c.active = true AND c.id != cd.keep_id
)
UPDATE products 
SET category_id = (
  SELECT cd.keep_id 
  FROM categoria_duplicadas cd 
  INNER JOIN categories c ON products.category_id = c.id 
  WHERE c.name = cd.name
)
WHERE category_id IN (SELECT id FROM categorias_para_remover);

-- Remover categorias duplicadas
WITH categoria_duplicadas AS (
  SELECT name, MIN(id) as keep_id
  FROM categories 
  WHERE active = true
  GROUP BY name
  HAVING COUNT(*) > 1
)
DELETE FROM categories 
WHERE id IN (
  SELECT c.id
  FROM categories c
  INNER JOIN categoria_duplicadas cd ON c.name = cd.name
  WHERE c.active = true AND c.id != cd.keep_id
);

-- 5. Remover categorias inativas que não têm produtos associados
DELETE FROM categories 
WHERE active = false 
  AND id NOT IN (SELECT DISTINCT category_id FROM products WHERE category_id IS NOT NULL);

-- 6. Remover produtos órfãos (sem categoria válida)
DELETE FROM order_items 
WHERE product_id IN (
  SELECT p.id FROM products p 
  LEFT JOIN categories c ON p.category_id = c.id 
  WHERE c.id IS NULL OR c.active = false
);

DELETE FROM products 
WHERE category_id NOT IN (SELECT id FROM categories WHERE active = true);

-- 7. Limpar endereços de clientes órfãos
DELETE FROM customer_addresses 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- 8. Verificar integridade final
SELECT 
  'Produtos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN active = true THEN 1 END) as ativos
FROM products

UNION ALL

SELECT 
  'Categorias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN active = true THEN 1 END) as ativos
FROM categories

UNION ALL

SELECT 
  'Entregadores' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as disponiveis
FROM drivers

UNION ALL

SELECT 
  'Pedidos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as entregues
FROM orders

UNION ALL

SELECT 
  'Clientes' as tabela,
  COUNT(*) as total,
  COUNT(*) as ativos
FROM profiles
WHERE role = 'customer';

-- 9. Mostrar resumo de dados limpos
SELECT 'Limpeza concluída' as status, NOW() as timestamp;