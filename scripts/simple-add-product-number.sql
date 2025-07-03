-- Script simplificado para adicionar numeração aos produtos
-- Execute este script manualmente no banco williamdiskpizza

-- 1. Adicionar coluna product_number se não existir
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_number INTEGER;

-- 2. Atualizar produtos existentes com numeração baseada na data de criação
UPDATE products 
SET product_number = subquery.row_number
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as row_number
    FROM products 
    WHERE active = true AND product_number IS NULL
) AS subquery
WHERE products.id = subquery.id;

-- 3. Criar sequência para numeração automática
CREATE SEQUENCE IF NOT EXISTS products_number_seq;

-- 4. Ajustar sequência para o próximo valor
SELECT setval('products_number_seq', COALESCE((SELECT MAX(product_number) FROM products WHERE active = true), 0) + 1, false);

-- 5. Criar função para atribuir número automaticamente
CREATE OR REPLACE FUNCTION assign_product_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_number IS NULL THEN
        NEW.product_number := nextval('products_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para novos produtos
DROP TRIGGER IF EXISTS trigger_assign_product_number ON products;
CREATE TRIGGER trigger_assign_product_number
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION assign_product_number();

-- 7. Verificar resultado
SELECT id, name, product_number, created_at 
FROM products 
WHERE active = true 
ORDER BY product_number; 