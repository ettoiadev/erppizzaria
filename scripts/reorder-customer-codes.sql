-- ================================================
-- REORDENAÇÃO DE CÓDIGOS DE CLIENTES
-- Garantir sequência perfeita: 0001, 0002, 0003...
-- ================================================

-- 1. Função para reordenar códigos existentes
CREATE OR REPLACE FUNCTION reorder_customer_codes()
RETURNS VOID AS $$
DECLARE
    customer_record RECORD;
    new_code VARCHAR(10);
    counter INTEGER := 1;
BEGIN
    -- Reordenar códigos existentes para garantir sequência
    FOR customer_record IN 
        SELECT id, customer_code, full_name
        FROM profiles 
        WHERE role = 'customer' 
        AND customer_code IS NOT NULL
        ORDER BY CAST(customer_code AS INTEGER)
    LOOP
        new_code := LPAD(counter::TEXT, 4, '0');
        
        -- Atualizar código se diferente
        IF customer_record.customer_code != new_code THEN
            RAISE NOTICE 'Atualizando cliente %: % -> %', customer_record.full_name, customer_record.customer_code, new_code;
            UPDATE profiles 
            SET customer_code = new_code
            WHERE id = customer_record.id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Reordenação concluída. % clientes processados.', counter - 1;
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar estado atual antes da reordenação
SELECT 
    'ESTADO ANTES DA REORDENAÇÃO' as titulo,
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as clientes_com_codigo,
    MIN(CAST(customer_code AS INTEGER)) as menor_codigo,
    MAX(CAST(customer_code AS INTEGER)) as maior_codigo
FROM profiles 
WHERE role = 'customer';

-- 3. Mostrar códigos atuais
SELECT 
    'CÓDIGOS ATUAIS' as titulo,
    customer_code,
    full_name,
    email
FROM profiles 
WHERE role = 'customer' 
AND customer_code IS NOT NULL
ORDER BY CAST(customer_code AS INTEGER);

-- 4. Verificar gaps na sequência
WITH numbered_codes AS (
    SELECT 
        CAST(customer_code AS INTEGER) as code_num,
        ROW_NUMBER() OVER (ORDER BY CAST(customer_code AS INTEGER)) as expected_num,
        full_name
    FROM profiles 
    WHERE role = 'customer' 
    AND customer_code IS NOT NULL 
    AND customer_code ~ '^[0-9]+$'
)
SELECT 
    'GAPS ENCONTRADOS' as titulo,
    code_num,
    expected_num,
    full_name,
    CASE WHEN code_num != expected_num THEN 'GAP' ELSE 'OK' END as status
FROM numbered_codes
WHERE code_num != expected_num
ORDER BY code_num;

-- 5. Executar reordenação (descomente para executar)
-- SELECT reorder_customer_codes();

-- 6. Verificar estado após reordenação (execute após a reordenação)
-- SELECT 
--     'ESTADO APÓS REORDENAÇÃO' as titulo,
--     COUNT(*) as total_clientes,
--     COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as clientes_com_codigo,
--     MIN(CAST(customer_code AS INTEGER)) as menor_codigo,
--     MAX(CAST(customer_code AS INTEGER)) as maior_codigo
-- FROM profiles 
-- WHERE role = 'customer';

-- 7. Mostrar códigos após reordenação (execute após a reordenação)
-- SELECT 
--     'CÓDIGOS APÓS REORDENAÇÃO' as titulo,
--     customer_code,
--     full_name,
--     email
-- FROM profiles 
-- WHERE role = 'customer' 
-- AND customer_code IS NOT NULL
-- ORDER BY CAST(customer_code AS INTEGER);

-- 8. Verificar se não há mais gaps (execute após a reordenação)
-- WITH numbered_codes AS (
--     SELECT 
--         CAST(customer_code AS INTEGER) as code_num,
--         ROW_NUMBER() OVER (ORDER BY CAST(customer_code AS INTEGER)) as expected_num
--     FROM profiles 
--     WHERE role = 'customer' 
--     AND customer_code IS NOT NULL 
--     AND customer_code ~ '^[0-9]+$'
-- )
-- SELECT 
--     'VERIFICAÇÃO FINAL' as titulo,
--     COUNT(*) as total_codigos,
--     COUNT(CASE WHEN code_num != expected_num THEN 1 END) as gaps_encontrados,
--     CASE WHEN COUNT(CASE WHEN code_num != expected_num THEN 1 END) = 0 
--          THEN 'SEQUÊNCIA PERFEITA' 
--          ELSE 'AINDA HÁ GAPS' 
--     END as status
-- FROM numbered_codes; 