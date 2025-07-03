# FASE 4: MIGRAÇÃO DOS DADOS

## 📊 Importar Dados do Backup

### 4.1 Preparar Dados de Teste (Se não houver dados reais)

**Execute no Supabase Studio - SQL Editor:**

```sql
-- ============================================================
-- DADOS DE TESTE PARA DESENVOLVIMENTO
-- ============================================================

-- 1. Inserir usuário admin
INSERT INTO auth.users (id, email, created_at, updated_at) 
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@williamdiskpizza.com',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, email, full_name, phone, role, password_hash, email_verified, profile_completed, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@williamdiskpizza.com', 
    'Administrador Sistema',
    '(11) 99999-9999',
    'admin',
    '$2b$10$K7L1OZ45QO7L6A.4rBSOKu.g.YfPFRtFnlDGrTq2/9LMZ.OYtDdYy', -- senha: admin123
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Inserir categorias
INSERT INTO categories (id, name, description, active, sort_order, created_at) VALUES 
('c1000000-0000-0000-0000-000000000001', 'Pizzas Tradicionais', 'Nossas pizzas clássicas', true, 1, NOW()),
('c1000000-0000-0000-0000-000000000002', 'Pizzas Especiais', 'Criações exclusivas da casa', true, 2, NOW()),
('c1000000-0000-0000-0000-000000000003', 'Bebidas', 'Refrigerantes e sucos', true, 3, NOW()),
('c1000000-0000-0000-0000-000000000004', 'Sobremesas', 'Doces para finalizar', true, 4, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir produtos
INSERT INTO products (id, name, description, price, category_id, image, active, product_number, show_image, created_at) VALUES 
('p1000000-0000-0000-0000-000000000001', 'Pizza Margherita', 'Molho de tomate, mussarela, manjericão e orégano', 35.90, 'c1000000-0000-0000-0000-000000000001', '/placeholder.jpg', true, 1, true, NOW()),
('p1000000-0000-0000-0000-000000000002', 'Pizza Calabresa', 'Molho de tomate, mussarela, calabresa e cebola', 38.90, 'c1000000-0000-0000-0000-000000000001', '/placeholder.jpg', true, 2, true, NOW()),
('p1000000-0000-0000-0000-000000000003', 'Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos e ervilhas', 42.90, 'c1000000-0000-0000-0000-000000000001', '/placeholder.jpg', true, 3, true, NOW()),
('p1000000-0000-0000-0000-000000000004', 'Pizza William Special', 'Molho especial, queijos nobres, rúcula e tomate seco', 55.90, 'c1000000-0000-0000-0000-000000000002', '/placeholder.jpg', true, 4, true, NOW()),
('p1000000-0000-0000-0000-000000000005', 'Coca-Cola 2L', 'Refrigerante Coca-Cola 2 litros', 8.90, 'c1000000-0000-0000-0000-000000000003', '/placeholder.jpg', true, 5, true, NOW()),
('p1000000-0000-0000-0000-000000000006', 'Pudim de Leite', 'Pudim caseiro tradicional', 12.90, 'c1000000-0000-0000-0000-000000000004', '/placeholder.jpg', true, 6, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Inserir usuário cliente de teste
INSERT INTO auth.users (id, email, created_at, updated_at) 
VALUES (
    'u1000000-0000-0000-0000-000000000001',
    'cliente@teste.com',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, email, full_name, phone, role, password_hash, email_verified, profile_completed, created_at, updated_at)
VALUES (
    'u1000000-0000-0000-0000-000000000001',
    'cliente@teste.com',
    'Cliente Teste',
    '(11) 88888-8888', 
    'customer',
    '$2b$10$K7L1OZ45QO7L6A.4rBSOKu.g.YfPFRtFnlDGrTq2/9LMZ.OYtDdYy', -- senha: admin123
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Inserir endereço do cliente
INSERT INTO customer_addresses (id, user_id, label, street, number, neighborhood, city, state, zip_code, is_default, created_at) 
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'u1000000-0000-0000-0000-000000000001',
    'Casa',
    'Rua das Flores',
    '123',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Inserir entregador de teste
INSERT INTO drivers (id, profile_id, name, email, phone, vehicle_type, vehicle_plate, status, total_deliveries, average_rating, created_at)
VALUES (
    'd1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'João Entregador',
    'joao@williamdiskpizza.com',
    '(11) 77777-7777',
    'motorcycle',
    'ABC-1234',
    'available',
    150,
    4.8,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 7. Inserir pedido de teste
INSERT INTO orders (id, user_id, driver_id, status, total, subtotal, delivery_fee, payment_method, payment_status, delivery_address, delivery_phone, created_at)
VALUES (
    'o1000000-0000-0000-0000-000000000001',
    'u1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'DELIVERED',
    44.80,
    35.90,
    8.90,
    'CREDIT_CARD',
    'PAID',
    'Rua das Flores, 123 - Centro - São Paulo/SP',
    '(11) 88888-8888',
    NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- 8. Inserir itens do pedido
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at)
VALUES (
    'i1000000-0000-0000-0000-000000000001',
    'o1000000-0000-0000-0000-000000000001',
    'p1000000-0000-0000-0000-000000000001',
    1,
    35.90,
    35.90,
    NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- 9. Inserir configurações admin
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description, created_at) VALUES
('store_name', 'William Disk Pizza', 'string', 'Nome da loja'),
('delivery_fee', '8.90', 'decimal', 'Taxa de entrega padrão'),
('min_order_value', '25.00', 'decimal', 'Valor mínimo do pedido'),
('allow_admin_registration', 'true', 'boolean', 'Permitir cadastro de admin'),
('business_hours', '{"monday": {"open": "18:00", "close": "23:00"}}', 'json', 'Horário de funcionamento')
ON CONFLICT (setting_key) DO NOTHING;

-- 10. Inserir conteúdo sobre
INSERT INTO about_content (section, title, content, order_position, active, created_at) VALUES
('hero', 'William Disk Pizza', 'A melhor pizza da cidade desde 1995', 1, true, NOW()),
('story', 'Nossa História', 'Começamos como uma pequena pizzaria familiar...', 2, true, NOW()),
('values', 'Nossos Valores', 'Qualidade, tradição e sabor em cada fatia', 3, true, NOW())
ON CONFLICT (section) DO NOTHING;
```

### 4.2 Importar Dados Reais (Se houver backup)

**Se você tem dados reais do backup da Fase 1:**

```sql
-- IMPORTANTE: Ajustar os INSERTs dos seus dados reais
-- Substitua os UUIDs pelos valores reais do seu backup

-- Exemplo de estrutura para seus dados:
-- INSERT INTO auth.users (id, email, created_at, updated_at) VALUES (...);
-- INSERT INTO profiles (...) VALUES (...);
-- INSERT INTO categories (...) VALUES (...);
-- INSERT INTO products (...) VALUES (...);
-- etc.
```

### 4.3 Verificar Dados Importados

```sql
-- Verificar dados em cada tabela
SELECT 'auth.users' as tabela, count(*) as registros FROM auth.users
UNION ALL
SELECT 'profiles', count(*) FROM profiles  
UNION ALL
SELECT 'categories', count(*) FROM categories
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'drivers', count(*) FROM drivers
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'order_items', count(*) FROM order_items
UNION ALL
SELECT 'customer_addresses', count(*) FROM customer_addresses
UNION ALL
SELECT 'admin_settings', count(*) FROM admin_settings
UNION ALL
SELECT 'about_content', count(*) FROM about_content;

-- Verificar integridade referencial
SELECT 
    'Orders sem usuário: ' || count(*) 
FROM orders o 
LEFT JOIN auth.users u ON o.user_id = u.id 
WHERE u.id IS NULL;

SELECT 
    'Produtos sem categoria: ' || count(*) 
FROM products p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE c.id IS NULL;

-- Testar login admin
SELECT 
    p.email,
    p.full_name,
    p.role,
    'Login OK' as status
FROM profiles p
WHERE p.email = 'admin@williamdiskpizza.com'
AND p.role = 'admin';
```

### 4.4 Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS nas tabelas sensíveis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles  
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own addresses" ON customer_addresses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);
```

### 4.5 Checklist Dados ✅

- [ ] Dados de teste inseridos
- [ ] Dados reais migrados (se aplicável)
- [ ] Contagem de registros OK
- [ ] Integridade referencial OK
- [ ] Login admin funcionando
- [ ] RLS configurado
- [ ] Policies aplicadas

**🎯 Próximo: Ajustar a Aplicação** 