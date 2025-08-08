-- Script para adicionar numeração sequencial aos pedidos
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Adicionar coluna order_number se não existir
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- 2. Atualizar pedidos existentes com números sequenciais
UPDATE orders 
SET order_number = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number
  FROM orders
) subquery
WHERE orders.id = subquery.id;

-- 3. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'order_number';

-- 4. Mostrar exemplos de pedidos com numeração
SELECT 
    order_number,
    RIGHT(id::text, 8) as old_id,
    customer_name,
    status,
    created_at
FROM orders 
ORDER BY order_number DESC
LIMIT 5; 