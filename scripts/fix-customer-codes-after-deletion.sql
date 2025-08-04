-- ================================================
-- CORREÇÃO AUTOMÁTICA DOS CÓDIGOS APÓS EXCLUSÕES
-- Garantir que após deletar todos os clientes, o próximo receba 0001
-- ================================================

-- 1. Limpar códigos de clientes inativos
UPDATE profiles 
SET customer_code = NULL
WHERE role = 'customer' 
AND active = false 
AND customer_code IS NOT NULL;

-- 2. Reordenar códigos de clientes ativos
CREATE OR REPLACE FUNCTION fix_customer_codes_sequence()
RETURNS VOID AS $$
DECLARE
    customer_record RECORD;
    new_code VARCHAR(10);
    counter INTEGER := 1;
BEGIN
    -- Reordenar apenas clientes ativos
    FOR customer_record IN 
        SELECT id, customer_code, full_name
        FROM profiles 
        WHERE role = 'customer' 
        AND customer_code IS NOT NULL
        AND (active = true OR active IS NULL)
        ORDER BY CAST(customer_code AS INTEGER)
    LOOP
        new_code := LPAD(counter::TEXT, 4, '0');
        
        -- Atualizar código se diferente
        IF customer_record.customer_code != new_code THEN
            RAISE NOTICE 'Corrigindo cliente %: % -> %', customer_record.full_name, customer_record.customer_code, new_code;
            UPDATE profiles 
            SET customer_code = new_code
            WHERE id = customer_record.id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Sequência de códigos corrigida. % clientes processados.', counter - 1;
END;
$$ LANGUAGE plpgsql;

-- 3. Executar correção
SELECT fix_customer_codes_sequence();

-- 4. Verificar resultado
SELECT 
    'RESULTADO DA CORREÇÃO' as titulo,
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN active = true OR active IS NULL THEN 1 END) as clientes_ativos,
    COUNT(CASE WHEN active = false THEN 1 END) as clientes_inativos,
    COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as clientes_com_codigo
FROM profiles 
WHERE role = 'customer';

-- 5. Mostrar clientes ativos com códigos corrigidos
SELECT 
    'CLIENTES ATIVOS COM CÓDIGOS CORRIGIDOS' as titulo,
    customer_code,
    full_name,
    email,
    active,
    created_at
FROM profiles 
WHERE role = 'customer'
AND (active = true OR active IS NULL)
AND customer_code IS NOT NULL
ORDER BY CAST(customer_code AS INTEGER);

-- 6. Testar geração do próximo código
SELECT 
    'TESTE DE PRÓXIMO CÓDIGO' as titulo,
    generate_customer_code() as proximo_codigo,
    generate_sequential_customer_code() as proximo_codigo_sequencial;

-- 7. Verificar se não há gaps
WITH numbered_codes AS (
    SELECT 
        CAST(customer_code AS INTEGER) as code_num,
        ROW_NUMBER() OVER (ORDER BY CAST(customer_code AS INTEGER)) as expected_num
    FROM profiles 
    WHERE role = 'customer' 
    AND customer_code IS NOT NULL 
    AND customer_code ~ '^[0-9]+$'
    AND (active = true OR active IS NULL)
)
SELECT 
    'VERIFICAÇÃO FINAL' as titulo,
    COUNT(*) as total_codigos,
    COUNT(CASE WHEN code_num != expected_num THEN 1 END) as gaps_encontrados,
    CASE WHEN COUNT(CASE WHEN code_num != expected_num THEN 1 END) = 0 
         THEN 'SEQUÊNCIA PERFEITA' 
         ELSE 'AINDA HÁ GAPS' 
    END as status
FROM numbered_codes; 