-- ================================================
-- CORREÇÃO: CÓDIGOS SEQUENCIAIS DE CLIENTES
-- Garantir que códigos sejam sempre sequenciais (0001, 0002, 0003...)
-- Mesmo após exclusões, o próximo cliente deve receber o próximo número
-- ================================================

-- 1. Função para gerar código sequencial (sem gaps)
CREATE OR REPLACE FUNCTION generate_sequential_customer_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_number INTEGER;
    formatted_code VARCHAR(10);
BEGIN
    -- Encontrar o próximo número sequencial disponível
    -- Considerar apenas clientes ativos (active = true ou NULL)
    SELECT COALESCE(MAX(CAST(customer_code AS INTEGER)), 0) + 1
    INTO next_number
    FROM profiles 
    WHERE role = 'customer' 
    AND customer_code IS NOT NULL 
    AND customer_code ~ '^[0-9]+$'
    AND (active = true OR active IS NULL);
    
    -- Se não há clientes ativos, começar do 1
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    -- Formatar com zeros à esquerda (4 dígitos)
    formatted_code := LPAD(next_number::TEXT, 4, '0');
    
    RETURN formatted_code;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para reordenar códigos existentes (opcional)
CREATE OR REPLACE FUNCTION reorder_customer_codes()
RETURNS VOID AS $$
DECLARE
    customer_record RECORD;
    new_code VARCHAR(10);
    counter INTEGER := 1;
BEGIN
    -- Reordenar códigos existentes para garantir sequência
    -- Considerar apenas clientes ativos
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

-- 3. Atualizar a função de trigger para usar a nova lógica
CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'customer' AND (NEW.customer_code IS NULL OR NEW.customer_code = '') THEN
        NEW.customer_code := generate_sequential_customer_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Verificar e corrigir códigos existentes (opcional)
-- Descomente as linhas abaixo se quiser reordenar códigos existentes
-- SELECT reorder_customer_codes();

-- 5. Verificar estado atual
SELECT 
    'ESTADO ATUAL DOS CÓDIGOS' as titulo,
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN customer_code IS NOT NULL THEN 1 END) as clientes_com_codigo,
    COUNT(CASE WHEN active = true OR active IS NULL THEN 1 END) as clientes_ativos,
    MIN(CAST(customer_code AS INTEGER)) as menor_codigo,
    MAX(CAST(customer_code AS INTEGER)) as maior_codigo,
    generate_sequential_customer_code() as proximo_codigo
FROM profiles 
WHERE role = 'customer';

-- 6. Mostrar códigos atuais (apenas clientes ativos)
SELECT 
    'CLIENTES ATIVOS COM CÓDIGOS' as titulo,
    customer_code,
    full_name,
    email,
    active,
    created_at
FROM profiles 
WHERE role = 'customer' 
AND customer_code IS NOT NULL
AND (active = true OR active IS NULL)
ORDER BY CAST(customer_code AS INTEGER)
LIMIT 10;

-- 7. Verificar se há gaps na sequência (apenas clientes ativos)
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
    'VERIFICAÇÃO DE GAPS' as titulo,
    COUNT(*) as total_codigos,
    COUNT(CASE WHEN code_num != expected_num THEN 1 END) as gaps_encontrados
FROM numbered_codes; 