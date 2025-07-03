-- Adicionar campo de ordenação nas categorias
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Atualizar categorias existentes com ordem sequencial
UPDATE categories 
SET sort_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_number
  FROM categories
) AS subquery
WHERE categories.id = subquery.id;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Verificar resultado
SELECT id, name, sort_order FROM categories ORDER BY sort_order; 