-- Script para corrigir formatação de telefones no banco de dados
-- Execute no SQL Editor: williamdiskpizza database

-- 1. Verificar telefones com formatação atual
SELECT 
    'Telefones antes da limpeza:' as info,
    id,
    full_name,
    phone,
    LENGTH(phone) as tamanho_atual,
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g') as telefone_limpo
FROM profiles 
WHERE phone IS NOT NULL 
AND phone != ''
ORDER BY created_at DESC
LIMIT 10;

-- 2. Atualizar telefones removendo formatação (manter apenas números)
UPDATE profiles 
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '', 'g'),
    updated_at = NOW()
WHERE phone IS NOT NULL 
AND phone != ''
AND phone ~ '[^0-9]'; -- Apenas telefones que contêm caracteres não numéricos

-- 3. Verificar resultado após limpeza
SELECT 
    'Telefones após limpeza:' as info,
    COUNT(*) as total_telefones,
    COUNT(CASE WHEN LENGTH(phone) = 10 THEN 1 END) as telefones_10_digitos,
    COUNT(CASE WHEN LENGTH(phone) = 11 THEN 1 END) as telefones_11_digitos,
    COUNT(CASE WHEN LENGTH(phone) NOT IN (10, 11) AND phone != '' THEN 1 END) as telefones_invalidos
FROM profiles 
WHERE phone IS NOT NULL;

-- 4. Mostrar alguns exemplos de telefones corrigidos
SELECT 
    'Exemplos de telefones corrigidos:' as info,
    id,
    full_name,
    phone,
    LENGTH(phone) as tamanho,
    CASE 
        WHEN LENGTH(phone) = 11 THEN 
            '(' || SUBSTRING(phone, 1, 2) || ') ' || SUBSTRING(phone, 3, 5) || '-' || SUBSTRING(phone, 8, 4)
        WHEN LENGTH(phone) = 10 THEN 
            '(' || SUBSTRING(phone, 1, 2) || ') ' || SUBSTRING(phone, 3, 4) || '-' || SUBSTRING(phone, 7, 4)
        ELSE phone
    END as telefone_formatado
FROM profiles 
WHERE phone IS NOT NULL 
AND phone != ''
AND LENGTH(phone) IN (10, 11)
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar se há telefones inválidos que precisam de atenção
SELECT 
    'Telefones que precisam de revisão manual:' as info,
    id,
    full_name,
    phone,
    LENGTH(phone) as tamanho
FROM profiles 
WHERE phone IS NOT NULL 
AND phone != ''
AND LENGTH(phone) NOT IN (10, 11);

-- Sucesso!
SELECT '✅ Script executado com sucesso! Telefones agora estão salvos apenas com números no banco.' as status; 