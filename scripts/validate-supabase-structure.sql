-- Validação e criação da estrutura completa do banco Supabase
-- Para aplicação William Disk Pizza ERP

-- ================================================
-- 1. CRIAÇÃO DA TABELA PROFILES (USUÁRIOS)
-- ================================================

-- Verificar se a tabela profiles existe, se não criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'kitchen', 'delivery')),
            password_hash TEXT NOT NULL,
            phone VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices para performance
        CREATE INDEX idx_profiles_email ON profiles(email);
        CREATE INDEX idx_profiles_role ON profiles(role);
        
        RAISE NOTICE 'Tabela profiles criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela profiles já existe';
    END IF;
END
$$;

-- ================================================
-- 2. CRIAÇÃO DA TABELA CATEGORIES
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            image VARCHAR(500),
            active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_categories_active ON categories(active);
        CREATE INDEX idx_categories_sort_order ON categories(sort_order);
        
        RAISE NOTICE 'Tabela categories criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela categories já existe';
    END IF;
END
$$;

-- ================================================
-- 3. CRIAÇÃO DA TABELA PRODUCTS
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            category_id INTEGER REFERENCES categories(id),
            image VARCHAR(500),
            available BOOLEAN DEFAULT true,
            show_image BOOLEAN DEFAULT false,
            sizes JSONB,
            toppings JSONB,
            active BOOLEAN DEFAULT true,
            product_number INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_products_category ON products(category_id);
        CREATE INDEX idx_products_active ON products(active);
        CREATE INDEX idx_products_available ON products(available);
        CREATE INDEX idx_products_number ON products(product_number);
        
        RAISE NOTICE 'Tabela products criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela products já existe';
    END IF;
END
$$;

-- ================================================
-- 4. CRIAÇÃO DA TABELA ORDERS
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        -- Criar enum para status dos pedidos
        CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
        
        CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES profiles(id),
            customer_name VARCHAR(255),
            customer_phone VARCHAR(20),
            customer_address TEXT,
            total DECIMAL(10,2) NOT NULL,
            status order_status DEFAULT 'PENDING',
            payment_method VARCHAR(50) CHECK (payment_method IN ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX')),
            delivery_type VARCHAR(20) DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
            driver_id INTEGER,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_orders_user_id ON orders(user_id);
        CREATE INDEX idx_orders_status ON orders(status);
        CREATE INDEX idx_orders_created_at ON orders(created_at);
        CREATE INDEX idx_orders_driver_id ON orders(driver_id);
        
        RAISE NOTICE 'Tabela orders criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela orders já existe';
    END IF;
END
$$;

-- ================================================
-- 5. CRIAÇÃO DA TABELA ORDER_ITEMS
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        CREATE TABLE order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            size VARCHAR(50),
            toppings JSONB,
            special_instructions TEXT,
            half_and_half JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX idx_order_items_product_id ON order_items(product_id);
        
        RAISE NOTICE 'Tabela order_items criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela order_items já existe';
    END IF;
END
$$;

-- ================================================
-- 6. CRIAÇÃO DA TABELA DRIVERS
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
        CREATE TABLE drivers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            vehicle_type VARCHAR(50),
            vehicle_plate VARCHAR(20),
            status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_drivers_status ON drivers(status);
        CREATE INDEX idx_drivers_active ON drivers(active);
        
        RAISE NOTICE 'Tabela drivers criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela drivers já existe';
    END IF;
END
$$;

-- ================================================
-- 7. CRIAÇÃO DA TABELA CUSTOMER_ADDRESSES
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_addresses') THEN
        CREATE TABLE customer_addresses (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            street VARCHAR(255) NOT NULL,
            number VARCHAR(20) NOT NULL,
            complement VARCHAR(255),
            neighborhood VARCHAR(100) NOT NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(2) NOT NULL,
            zip_code VARCHAR(10) NOT NULL,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_customer_addresses_user_id ON customer_addresses(user_id);
        CREATE INDEX idx_customer_addresses_default ON customer_addresses(is_default);
        
        RAISE NOTICE 'Tabela customer_addresses criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela customer_addresses já existe';
    END IF;
END
$$;

-- ================================================
-- 8. CRIAÇÃO DA TABELA ADMIN_SETTINGS
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_settings') THEN
        CREATE TABLE admin_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_admin_settings_key ON admin_settings(key);
        
        RAISE NOTICE 'Tabela admin_settings criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela admin_settings já existe';
    END IF;
END
$$;

-- ================================================
-- 9. CRIAÇÃO DA TABELA ABOUT_CONTENT
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'about_content') THEN
        CREATE TABLE about_content (
            id SERIAL PRIMARY KEY,
            section VARCHAR(100) NOT NULL,
            title VARCHAR(255),
            content TEXT,
            image VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_about_content_section ON about_content(section);
        
        RAISE NOTICE 'Tabela about_content criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela about_content já existe';
    END IF;
END
$$;

-- ================================================
-- 10. CRIAÇÃO DA TABELA CONTACT_MESSAGES
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_messages') THEN
        CREATE TABLE contact_messages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_contact_messages_status ON contact_messages(status);
        CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);
        
        RAISE NOTICE 'Tabela contact_messages criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela contact_messages já existe';
    END IF;
END
$$;

-- ================================================
-- 11. INSERÇÃO DE DADOS INICIAIS
-- ================================================

-- Inserir usuário admin padrão
INSERT INTO profiles (email, full_name, role, password_hash)
VALUES ('admin@williamdiskpizza.com', 'Administrador', 'admin', '$2b$10$8rGiWN4vWZVsKzJx8QXnEOGYJ6vQoHvFxRKFk7NxK2dQJzYzGHJ2K')
ON CONFLICT (email) DO NOTHING;

-- Inserir categorias padrão
INSERT INTO categories (name, description, sort_order) VALUES
('Pizzas Tradicionais', 'Pizzas clássicas e tradicionais', 1),
('Pizzas Especiais', 'Pizzas especiais da casa', 2),
('Pizzas Doces', 'Pizzas doces e sobremesas', 3),
('Bebidas', 'Refrigerantes, sucos e bebidas', 4),
('Acompanhamentos', 'Porções e acompanhamentos', 5)
ON CONFLICT DO NOTHING;

-- Inserir produtos de exemplo
INSERT INTO products (name, description, price, category_id, available, product_number) VALUES
('Pizza Margherita', 'Molho, mozzarella, tomate e manjericão', 25.90, 1, true, 1),
('Pizza Calabresa', 'Molho, mozzarella, calabresa e cebola', 28.90, 1, true, 2),
('Pizza Portuguesa', 'Molho, mozzarella, presunto, ovo, cebola e azeitona', 32.90, 1, true, 3),
('Pizza Frango Catupiry', 'Molho, mozzarella, frango desfiado e catupiry', 35.90, 2, true, 4),
('Pizza Chocolate', 'Chocolate ao leite e granulado', 22.90, 3, true, 5),
('Coca-Cola 2L', 'Refrigerante Coca-Cola 2 litros', 8.90, 4, true, 6),
('Batata Frita', 'Porção de batata frita crocante', 15.90, 5, true, 7),
('Guaraná Antarctica 2L', 'Refrigerante Guaraná Antarctica 2 litros', 7.90, 4, true, 8)
ON CONFLICT DO NOTHING;

-- Inserir configurações do sistema
INSERT INTO admin_settings (key, value, description) VALUES
('storeOpen', 'true', 'Loja aberta para pedidos'),
('deliveryFee', '5.00', 'Taxa de entrega padrão'),
('minimumOrder', '20.00', 'Valor mínimo do pedido'),
('estimatedDeliveryTime', '45', 'Tempo estimado de entrega em minutos'),
('acceptOrders', 'true', 'Aceitar novos pedidos'),
('storeName', 'William Disk Pizza', 'Nome da loja'),
('adminRegistration', 'enabled', 'Permitir cadastro de administradores')
ON CONFLICT (key) DO NOTHING;

-- Inserir conteúdo da página sobre
INSERT INTO about_content (section, title, content) VALUES
('hero', 'Sobre a William Disk Pizza', 'A melhor pizzaria da cidade com mais de 10 anos de tradição'),
('story', 'Nossa História', 'Fundada em 2014, a William Disk Pizza nasceu do sonho de oferecer pizzas de qualidade com ingredientes frescos e selecionados.'),
('mission', 'Nossa Missão', 'Proporcionar momentos especiais através de pizzas deliciosas, atendimento excepcional e entrega rápida.'),
('values', 'Nossos Valores', 'Qualidade, tradição, inovação e compromisso com a satisfação do cliente.')
ON CONFLICT DO NOTHING;

-- ================================================
-- 12. CONFIGURAÇÃO RLS (ROW LEVEL SECURITY)
-- ================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id::text::uuid);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id::text::uuid);

-- Políticas para orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para order_items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Políticas para customer_addresses
CREATE POLICY "Users can manage own addresses" ON customer_addresses FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- 13. FUNÇÕES E TRIGGERS
-- ================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger de updated_at em todas as tabelas relevantes
DO $$
DECLARE
    table_name text;
    tables_with_updated_at text[] := ARRAY['profiles', 'categories', 'products', 'orders', 'drivers', 'customer_addresses', 'admin_settings', 'about_content'];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        -- Verificar se o trigger já existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'update_' || table_name || '_updated_at'
        ) THEN
            EXECUTE format('CREATE TRIGGER update_%I_updated_at
                           BEFORE UPDATE ON %I
                           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', 
                           table_name, table_name);
            RAISE NOTICE 'Trigger update_%_updated_at criado', table_name;
        ELSE
            RAISE NOTICE 'Trigger update_%_updated_at já existe', table_name;
        END IF;
    END LOOP;
END
$$;

-- ================================================
-- 14. VERIFICAÇÃO FINAL
-- ================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    expected_tables text[] := ARRAY['profiles', 'categories', 'products', 'orders', 'order_items', 'drivers', 'customer_addresses', 'admin_settings', 'about_content', 'contact_messages'];
    table_name text;
    table_count integer;
BEGIN
    SELECT count(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = ANY(expected_tables);
    
    RAISE NOTICE 'Total de tabelas principais criadas: % de %', table_count, array_length(expected_tables, 1);
    
    -- Verificar cada tabela individualmente
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            RAISE NOTICE '✓ Tabela % existe', table_name;
        ELSE
            RAISE NOTICE '✗ Tabela % NÃO existe', table_name;
        END IF;
    END LOOP;
END
$$;

-- Verificar se o usuário admin foi criado
DO $$
DECLARE
    admin_count integer;
BEGIN
    SELECT count(*) INTO admin_count FROM profiles WHERE email = 'admin@williamdiskpizza.com';
    IF admin_count > 0 THEN
        RAISE NOTICE '✓ Usuário admin existe';
    ELSE
        RAISE NOTICE '✗ Usuário admin NÃO existe';
    END IF;
END
$$;

RAISE NOTICE '================================================';
RAISE NOTICE 'ESTRUTURA DO SUPABASE VALIDADA E CONFIGURADA!';
RAISE NOTICE '================================================'; 