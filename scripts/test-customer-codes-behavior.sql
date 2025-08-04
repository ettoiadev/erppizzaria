-- ================================================
-- TESTE E CORREÇÃO DO COMPORTAMENTO DOS CÓDIGOS
-- Verificar se após deletar todos os clientes, o próximo recebe 0001
-- ================================================

-- 1. Verificar estado atual dos clientes
SELECT 
    'ESTADO ATUAL DOS CLIENTES' as titulo,
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN active = true OR active IS NULL THEN 1 END) as clientes_ativos,
    COUNT(CASE WHEN active = false THEN 1 END) as clientes_inativos,
    COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as clientes_com_codigo
FROM profiles 
WHERE role = 'customer';

-- 2. Mostrar todos os clientes com seus status
SELECT 
    'TODOS OS CLIENTES' as titulo,
    id,
    customer_code,
    full_name,
    email,
    active,
    created_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at;

-- 3. Mostrar apenas clientes ativos
SELECT 
    'CLIENTES ATIVOS' as titulo,
    id,
    customer_code,
    full_name,
    email,
    active,
    created_at
FROM profiles 
WHERE role = 'customer'
AND (active = true OR active IS NULL)
ORDER BY CAST(customer_code AS INTEGER);

-- 4. Testar função de geração de código
SELECT 
    'TESTE DE GERAÇÃO' as titulo,
    generate_customer_code() as proximo_codigo,
    generate_sequential_customer_code() as proximo_codigo_sequencial;

-- 5. Verificar se há clientes inativos interferindo
SELECT 
    'CLIENTES INATIVOS' as titulo,
    id,
    customer_code,
    full_name,
    email,
    active,
    created_at
FROM profiles 
WHERE role = 'customer'
AND active = false
ORDER BY CAST(customer_code AS INTEGER);

-- 6. Função para limpar códigos de clientes inativos (opcional)
CREATE OR REPLACE FUNCTION clear_inactive_customer_codes()
RETURNS VOID AS $$
BEGIN
    -- Limpar códigos de clientes inativos para não interferir na sequência
    UPDATE profiles 
    SET customer_code = NULL
    WHERE role = 'customer' 
    AND active = false 
    AND customer_code IS NOT NULL;
    
    RAISE NOTICE 'Códigos de clientes inativos limpos';
END;
$$ LANGUAGE plpgsql;

-- 7. Executar limpeza (descomente se necessário)
-- SELECT clear_inactive_customer_codes();

-- 8. Verificar estado após limpeza
-- SELECT 
--     'ESTADO APÓS LIMPEZA' as titulo,
--     COUNT(*) as total_clientes,
--     COUNT(CASE WHEN active = true OR active IS NULL THEN 1 END) as clientes_ativos,
--     COUNT(CASE WHEN active = false THEN 1 END) as clientes_inativos,
--     COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as clientes_com_codigo
-- FROM profiles 
-- WHERE role = 'customer';

-- 9. Testar geração de código após limpeza
-- SELECT 
--     'TESTE APÓS LIMPEZA' as titulo,
--     generate_customer_code() as proximo_codigo,
--     generate_sequential_customer_code() as proximo_codigo_sequencial;

-- 10. Função para reordenar códigos de clientes ativos
CREATE OR REPLACE FUNCTION reorder_active_customer_codes()
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
            RAISE NOTICE 'Atualizando cliente ativo %: % -> %', customer_record.full_name, customer_record.customer_code, new_code;
            UPDATE profiles 
            SET customer_code = new_code
            WHERE id = customer_record.id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Reordenação de clientes ativos concluída. % clientes processados.', counter - 1;
END;
$$ LANGUAGE plpgsql;

-- 11. Executar reordenação de clientes ativos (descomente se necessário)
-- SELECT reorder_active_customer_codes();

-- 12. Verificar resultado final
-- SELECT 
--     'RESULTADO FINAL' as titulo,
--     customer_code,
--     full_name,
--     email,
--     active,
--     created_at
-- FROM profiles 
-- WHERE role = 'customer'
-- AND (active = true OR active IS NULL)
-- ORDER BY CAST(customer_code AS INTEGER); 