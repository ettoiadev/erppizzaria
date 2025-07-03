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

-- Adicionar coluna para informações de pizza meio a meio na tabela order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS half_and_half JSONB DEFAULT NULL;

-- Atualizar produtos existentes para estarem disponíveis
UPDATE products SET available = true WHERE available IS NULL;

-- Verificar se as colunas foram criadas
DO $$
BEGIN
    -- Verificar sizes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sizes') THEN
        RAISE NOTICE 'Coluna sizes NÃO foi criada!';
    ELSE
        RAISE NOTICE 'Coluna sizes criada com sucesso!';
    END IF;
    
    -- Verificar toppings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'toppings') THEN
        RAISE NOTICE 'Coluna toppings NÃO foi criada!';
    ELSE
        RAISE NOTICE 'Coluna toppings criada com sucesso!';
    END IF;
END $$;

-- Confirmar alterações
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position; 