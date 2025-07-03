-- Adicionar coluna show_image na tabela products se ela não existir
DO $$ 
BEGIN
    -- Verificar se a coluna show_image existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'show_image'
    ) THEN
        -- Adicionar a coluna show_image com valor padrão true
        ALTER TABLE products ADD COLUMN show_image BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna show_image adicionada à tabela products';
    ELSE
        RAISE NOTICE 'Coluna show_image já existe na tabela products';
    END IF;
END $$;

-- Atualizar produtos existentes que tenham show_image como NULL para true
UPDATE products SET show_image = true WHERE show_image IS NULL;

-- Verificar o resultado
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN show_image = true THEN 1 END) as com_imagem_habilitada,
    COUNT(CASE WHEN show_image = false THEN 1 END) as com_imagem_desabilitada
FROM products 
WHERE active = true; 