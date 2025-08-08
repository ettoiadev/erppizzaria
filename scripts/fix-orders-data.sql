-- Script para corrigir dados de pedidos
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Verificar e adicionar colunas se necessário
DO $$ 
BEGIN 
    -- Adicionar customer_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);
        RAISE NOTICE 'Coluna customer_name adicionada na tabela orders';
    END IF;
    
    -- Adicionar delivery_phone se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_phone VARCHAR(20);
        RAISE NOTICE 'Coluna delivery_phone adicionada na tabela orders';
    END IF;
    
    -- Adicionar delivery_address se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
        RAISE NOTICE 'Coluna delivery_address adicionada na tabela orders';
    END IF;
END $$;

-- 2. Migrar dados dos perfis para os pedidos
UPDATE orders 
SET customer_name = p.full_name
FROM profiles p 
WHERE orders.user_id = p.id 
AND orders.customer_name IS NULL 
AND p.full_name IS NOT NULL;

UPDATE orders 
SET delivery_phone = p.phone
FROM profiles p 
WHERE orders.user_id = p.id 
AND orders.delivery_phone IS NULL 
AND p.phone IS NOT NULL;

-- 3. Garantir que order_items tenham nomes
UPDATE order_items 
SET name = p.name
FROM products p 
WHERE order_items.product_id = p.id 
AND order_items.name IS NULL 
AND p.name IS NOT NULL;

-- 4. Verificar dados após correção
SELECT 
    'Dados após correção:' as info,
    COUNT(*) as total_pedidos,
    COUNT(customer_name) as pedidos_com_nome,
    COUNT(delivery_phone) as pedidos_com_telefone,
    COUNT(delivery_address) as pedidos_com_endereco
FROM orders;

-- 5. Mostrar exemplo de pedido completo
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    o.customer_name,
    o.delivery_address,
    o.delivery_phone,
    o.status,
    COUNT(oi.id) as total_items,
    o.created_at
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_name IS NOT NULL 
  AND o.delivery_address IS NOT NULL 
  AND o.delivery_address != ''
GROUP BY o.id, o.customer_name, o.delivery_address, o.delivery_phone, o.status, o.created_at
ORDER BY o.created_at DESC 
LIMIT 3;

-- 6. Verificar itens dos pedidos
SELECT 
    RIGHT(o.id::text, 8) as pedido_id,
    oi.name as item_name,
    oi.quantity,
    oi.unit_price,
    p.name as product_name
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.customer_name IS NOT NULL
ORDER BY o.created_at DESC 
LIMIT 5; 