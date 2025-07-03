-- Verificar estrutura da tabela products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Verificar se a coluna sizes existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'sizes'
) AS sizes_exists;

-- Verificar se a coluna toppings existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'toppings'
) AS toppings_exists;

-- Verificar se a coluna showImage existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'show_image'
) AS show_image_exists; 