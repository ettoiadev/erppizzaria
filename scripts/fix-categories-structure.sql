-- Script para corrigir a estrutura da tabela categories
-- Baseado no Plano de Correção - Fase 1.2
-- Problema identificado: coluna 'image' não existe

-- Adicionar coluna image se não existir
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Verificar a estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Testar a query da API após a correção
SELECT 
    id, 
    name, 
    description, 
    image, 
    sort_order, 
    active 
FROM categories 
ORDER BY sort_order ASC, name ASC;

-- Verificar dados das categorias
SELECT 
    id,
    name,
    description,
    image,
    sort_order,
    active,
    created_at
FROM categories
WHERE active = true
ORDER BY sort_order ASC NULLS LAST, name ASC;