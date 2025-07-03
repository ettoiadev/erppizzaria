-- Script para adicionar coluna 'image' à tabela categories
-- Execute este script no pgAdmin4

-- 1. Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'image' 
        AND table_schema = 'public'
    ) THEN
        -- 2. Adicionar a coluna image
        ALTER TABLE categories ADD COLUMN image VARCHAR(255);
        
        -- 3. Comentário explicativo
        COMMENT ON COLUMN categories.image IS 'URL ou caminho da imagem da categoria';
        
        RAISE NOTICE 'Coluna "image" adicionada à tabela categories com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna "image" já existe na tabela categories.';
    END IF;
END
$$;

-- 4. Verificar a estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND table_schema = 'public'
ORDER BY ordinal_position; 