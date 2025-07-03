-- =====================================================
-- SCRIPT PARA CORRIGIR CATEGORIAS - ADICIONAR COLUNA IMAGE
-- Execute no pgAdmin4 - Database: williamdiskpizza
-- =====================================================

-- 1. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna 'image' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'image' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE categories ADD COLUMN image VARCHAR(255);
        COMMENT ON COLUMN categories.image IS 'URL ou caminho da imagem da categoria';
        RAISE NOTICE 'Coluna "image" adicionada à tabela categories com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna "image" já existe na tabela categories.';
    END IF;
END
$$;

-- 3. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Testar uma atualização
UPDATE categories 
SET image = '/placeholder.svg' 
WHERE image IS NULL 
AND id = (SELECT id FROM categories LIMIT 1);

-- 5. Verificar dados finais
SELECT id, name, description, image, active FROM categories LIMIT 5; 