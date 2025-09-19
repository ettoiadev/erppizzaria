-- ============================================================================
-- SEEDS DE DESENVOLVIMENTO - ERP PIZZARIA
-- ============================================================================
-- Este arquivo contém dados de exemplo para desenvolvimento e testes
-- Execução: node scripts/run-seeds.js
-- ============================================================================

-- Limpar dados existentes (opcional - descomente se necessário)
-- TRUNCATE TABLE order_items, orders, products, categories, customer_addresses, customers, profiles CASCADE;

-- ============================================================================
-- CATEGORIAS
-- ============================================================================

-- Inserir categorias básicas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pizzas Tradicionais') THEN
        INSERT INTO categories (name, description, active, sort_order, created_at, updated_at) VALUES
        ('Pizzas Tradicionais', 'Pizzas clássicas com ingredientes tradicionais', true, 1, NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pizzas Especiais') THEN
        INSERT INTO categories (name, description, active, sort_order, created_at, updated_at) VALUES
        ('Pizzas Especiais', 'Pizzas gourmet com ingredientes especiais', true, 2, NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bebidas') THEN
        INSERT INTO categories (name, description, active, sort_order, created_at, updated_at) VALUES
        ('Bebidas', 'Refrigerantes, sucos e águas', true, 3, NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sobremesas') THEN
        INSERT INTO categories (name, description, active, sort_order, created_at, updated_at) VALUES
        ('Sobremesas', 'Doces e sobremesas variadas', true, 4, NOW(), NOW());
    END IF;
END $$;

-- ============================================================================
-- PRODUTOS
-- ============================================================================

-- Inserir produtos básicos
DO $$
DECLARE
    cat_tradicional_id UUID;
    cat_especial_id UUID;
    cat_bebidas_id UUID;
    cat_sobremesas_id UUID;
BEGIN
    -- Obter IDs das categorias
    SELECT id INTO cat_tradicional_id FROM categories WHERE name = 'Pizzas Tradicionais';
    SELECT id INTO cat_especial_id FROM categories WHERE name = 'Pizzas Especiais';
    SELECT id INTO cat_bebidas_id FROM categories WHERE name = 'Bebidas';
    SELECT id INTO cat_sobremesas_id FROM categories WHERE name = 'Sobremesas';
    
    -- Pizza Margherita
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pizza Margherita') THEN
        INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at)
        VALUES ('Pizza Margherita', 'Pizza clássica com molho de tomate, mussarela e manjericão', 35.90,
                cat_tradicional_id, true, true, true, 20, 1, NOW(), NOW());
    END IF;
    
    -- Pizza Calabresa
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pizza Calabresa') THEN
        INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at)
        VALUES ('Pizza Calabresa', 'Pizza com calabresa, cebola e azeitonas', 38.90,
                cat_tradicional_id, true, true, true, 22, 2, NOW(), NOW());
    END IF;
    
    -- Pizza Quatro Queijos
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pizza Quatro Queijos') THEN
        INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at)
        VALUES ('Pizza Quatro Queijos', 'Pizza com mussarela, gorgonzola, parmesão e provolone', 42.90,
                cat_especial_id, true, true, false, 25, 3, NOW(), NOW());
    END IF;
    
    -- Coca-Cola
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Coca-Cola 350ml') THEN
        INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at)
        VALUES ('Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', 5.50,
                cat_bebidas_id, true, false, false, 2, 4, NOW(), NOW());
    END IF;
    
    -- Pudim
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pudim de Leite') THEN
        INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, created_at, updated_at)
        VALUES ('Pudim de Leite', 'Pudim caseiro de leite condensado', 12.90,
                cat_sobremesas_id, true, false, false, 5, 5, NOW(), NOW());
    END IF;
END $$;

-- ============================================================================
-- USUÁRIOS DE TESTE
-- ============================================================================

-- Inserir perfis de teste
DO $$
BEGIN
    -- Admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@pizzaria.com') THEN
        INSERT INTO profiles (email, full_name, password_hash, role, phone, created_at, updated_at)
        VALUES ('admin@pizzaria.com', 'Administrador Sistema', '$2b$10$example.hash.for.password123', 'admin', '(11) 99999-9999', NOW(), NOW());
    END IF;
    
    -- Usuário de teste
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'teste@pizzaria.com') THEN
        INSERT INTO profiles (email, full_name, password_hash, role, phone, created_at, updated_at)
        VALUES ('teste@pizzaria.com', 'Usuário Teste', '$2b$10$example.hash.for.password123', 'customer', '(11) 88888-8888', NOW(), NOW());
    END IF;
END $$;

-- ============================================================================
-- CONFIGURAÇÕES DO SISTEMA
-- ============================================================================

-- Inserir configurações básicas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'delivery_fee') THEN
        INSERT INTO admin_settings (key, value, description, created_at, updated_at)
        VALUES ('delivery_fee', '"8.50"'::jsonb, 'Taxa de entrega padrão', NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'min_order_value') THEN
        INSERT INTO admin_settings (key, value, description, created_at, updated_at)
        VALUES ('min_order_value', '"25.00"'::jsonb, 'Valor mínimo do pedido', NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'store_open') THEN
        INSERT INTO admin_settings (key, value, description, created_at, updated_at)
        VALUES ('store_open', 'true'::jsonb, 'Loja aberta para pedidos', NOW(), NOW());
    END IF;
END $$;

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

-- Verificar dados inseridos
SELECT 'Categorias inseridas:' as info, COUNT(*) as total FROM categories;
SELECT 'Produtos inseridos:' as info, COUNT(*) as total FROM products;
SELECT 'Usuários inseridos:' as info, COUNT(*) as total FROM profiles;
SELECT 'Configurações inseridas:' as info, COUNT(*) as total FROM admin_settings;

-- Sucesso
SELECT '✅ Seeds de desenvolvimento executados com sucesso!' as resultado;