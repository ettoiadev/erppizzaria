-- Script para adicionar numeração sequencial automática aos produtos
-- Este script adiciona a coluna product_number e configura a numeração automática

-- 1. Adicionar coluna product_number se não existir
DO $$ 
BEGIN
    -- Verificar se a coluna product_number existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'product_number'
    ) THEN
        -- Adicionar a coluna product_number
        ALTER TABLE products ADD COLUMN product_number INTEGER;
        RAISE NOTICE 'Coluna product_number adicionada à tabela products';
    ELSE
        RAISE NOTICE 'Coluna product_number já existe na tabela products';
    END IF;
END $$;

-- 2. Criar sequência para numeração automática se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'products_number_seq') THEN
        CREATE SEQUENCE products_number_seq START 1;
        RAISE NOTICE 'Sequência products_number_seq criada';
    ELSE
        RAISE NOTICE 'Sequência products_number_seq já existe';
    END IF;
END $$;

-- 3. Atualizar produtos existentes com numeração baseada na data de criação
UPDATE products 
SET product_number = subquery.row_number
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as row_number
    FROM products 
    WHERE active = true AND product_number IS NULL
) AS subquery
WHERE products.id = subquery.id;

-- 4. Ajustar a sequência para o próximo valor
SELECT setval('products_number_seq', COALESCE((SELECT MAX(product_number) FROM products WHERE active = true), 0) + 1, false);

-- 5. Criar função para atribuir número automaticamente
CREATE OR REPLACE FUNCTION assign_product_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Se product_number não foi fornecido, atribuir o próximo da sequência
    IF NEW.product_number IS NULL THEN
        NEW.product_number := nextval('products_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para executar a função antes de inserir
DROP TRIGGER IF EXISTS trigger_assign_product_number ON products;
CREATE TRIGGER trigger_assign_product_number
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION assign_product_number();

-- 7. Verificar o resultado
SELECT 
    COUNT(*) as total_produtos,
    MIN(product_number) as menor_numero,
    MAX(product_number) as maior_numero
FROM products 
WHERE active = true;

-- 8. Mostrar alguns produtos com numeração
SELECT product_number, name, created_at 
FROM products 
WHERE active = true 
ORDER BY product_number 
LIMIT 10; 