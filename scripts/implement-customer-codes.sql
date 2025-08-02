-- ================================================
-- IMPLEMENTAÇÃO CÓDIGOS SEQUENCIAIS DE CLIENTES
-- William Disk Pizza - Sistema ERP
-- ================================================

-- 1. Adicionar coluna customer_code na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_code VARCHAR(10) UNIQUE;

-- 2. Criar sequência para códigos
CREATE SEQUENCE IF NOT EXISTS customer_code_seq 
START WITH 1 
INCREMENT BY 1 
MINVALUE 1 
MAXVALUE 9999 
CACHE 1;

-- 3. Função para gerar código formatado
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_val INTEGER;
    formatted_code VARCHAR(10);
BEGIN
    SELECT nextval('customer_code_seq') INTO next_val;
    formatted_code := LPAD(next_val::TEXT, 4, '0');
    
    -- Verificar se o código já existe
    WHILE EXISTS (SELECT 1 FROM profiles WHERE customer_code = formatted_code) LOOP
        SELECT nextval('customer_code_seq') INTO next_val;
        formatted_code := LPAD(next_val::TEXT, 4, '0');
    END LOOP;
    
    RETURN formatted_code;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'customer' AND (NEW.customer_code IS NULL OR NEW.customer_code = '') THEN
        NEW.customer_code := generate_customer_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_customer_code ON profiles;
CREATE TRIGGER trigger_set_customer_code
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_code();

-- 5. Migrar clientes existentes
UPDATE profiles 
SET customer_code = generate_customer_code()
WHERE role = 'customer' 
AND (customer_code IS NULL OR customer_code = '');

-- 6. Adicionar customer_code na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_code VARCHAR(10);

-- 7. Sincronizar códigos nos pedidos existentes
UPDATE orders 
SET customer_code = p.customer_code
FROM profiles p
WHERE orders.user_id = p.id 
AND p.role = 'customer'
AND p.customer_code IS NOT NULL
AND (orders.customer_code IS NULL OR orders.customer_code = '');

-- 8. Trigger para sincronização automática em pedidos
CREATE OR REPLACE FUNCTION set_customer_code_in_order()
RETURNS TRIGGER AS $$
DECLARE
    client_code VARCHAR(10);
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        SELECT customer_code INTO client_code
        FROM profiles 
        WHERE id = NEW.user_id 
        AND role = 'customer';
        
        IF client_code IS NOT NULL THEN
            NEW.customer_code := client_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_customer_code_in_order ON orders;
CREATE TRIGGER trigger_set_customer_code_in_order
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_code_in_order();

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_customer_code ON profiles(customer_code);
CREATE INDEX IF NOT EXISTS idx_profiles_customer_role_code ON profiles(role, customer_code) 
WHERE role = 'customer';
CREATE INDEX IF NOT EXISTS idx_orders_customer_code ON orders(customer_code);

-- 10. Relatório final
SELECT 
  'RELATÓRIO DE IMPLEMENTAÇÃO' as titulo,
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer') as total_clientes,
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer' AND customer_code IS NOT NULL) as clientes_com_codigo,
  (SELECT COUNT(*) FROM orders) as total_pedidos,
  (SELECT COUNT(*) FROM orders WHERE customer_code IS NOT NULL) as pedidos_com_codigo,
  (SELECT LPAD((currval('customer_code_seq') + 1)::TEXT, 4, '0')) as proximo_codigo;

-- Mostrar alguns exemplos
SELECT 
  'EXEMPLOS DE CLIENTES COM CÓDIGOS' as titulo,
  customer_code,
  full_name,
  email,
  created_at
FROM profiles 
WHERE role = 'customer' 
AND customer_code IS NOT NULL
ORDER BY customer_code
LIMIT 10;
