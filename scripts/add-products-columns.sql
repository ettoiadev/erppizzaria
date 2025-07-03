-- Script para adicionar colunas faltantes na tabela products

-- Adicionar coluna available
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;

-- Adicionar coluna sizes (JSONB para armazenar array de tamanhos)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna toppings (JSONB para armazenar array de adicionais)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS toppings JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna show_image
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_image BOOLEAN DEFAULT true;

-- Atualizar produtos existentes para estarem disponíveis
UPDATE products SET available = true WHERE available IS NULL;

-- Confirmar alterações
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position; 