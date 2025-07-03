-- Script para corrigir o campo show_image na tabela products
-- Este script pode ser executado manualmente se necessário

-- 1. Adicionar coluna show_image se não existir
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_image BOOLEAN DEFAULT true;

-- 2. Atualizar produtos existentes que tenham show_image como NULL
UPDATE products SET show_image = true WHERE show_image IS NULL;

-- 3. Verificar a estrutura da tabela products
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 4. Verificar alguns produtos para confirmar o campo
SELECT id, name, show_image, available 
FROM products 
WHERE active = true 
LIMIT 5; 