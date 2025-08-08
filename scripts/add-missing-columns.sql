-- Script para adicionar colunas faltantes na tabela orders
-- EXECUTE NO PGADMIN4: williamdiskpizza database

-- 1. Adicionar delivery_address se não existir
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 2. Adicionar customer_name se não existir
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- 3. Adicionar delivery_phone se não existir
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(20);

-- 4. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('delivery_address', 'customer_name', 'delivery_phone')
ORDER BY column_name;

-- 5. Migrar dados dos perfis para os pedidos
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

-- 6. Verificar dados após migração
SELECT 
    'Dados após migração:' as info,
    COUNT(*) as total_pedidos,
    COUNT(customer_name) as pedidos_com_nome,
    COUNT(delivery_phone) as pedidos_com_telefone,
    COUNT(delivery_address) as pedidos_com_endereco
FROM orders; 