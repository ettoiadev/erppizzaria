-- Script completo para configurar o banco de dados PostgreSQL williamdiskpizza
-- Execute este script no pgAdmin no banco williamdiskpizza

-- 1. Criar schema auth se não existir
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Criar tabela auth.users
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar enum para roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'customer',
        'admin',
        'kitchen',
        'delivery'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Criar tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'customer',
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela products
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    image TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar enums para sistema de pedidos
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'RECEIVED',
        'PREPARING',
        'ON_THE_WAY',
        'DELIVERED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'CASH',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'PIX'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. Criar tabela orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    status order_status DEFAULT 'RECEIVED',
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'PENDING',
    delivery_address TEXT NOT NULL,
    delivery_phone VARCHAR(20) NOT NULL,
    delivery_instructions TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Criar tabela order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    size VARCHAR(50),
    toppings JSONB DEFAULT '[]'::jsonb,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Criar tabela order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 11. Criar tabela customer_addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(100),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Criar tabela contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Criar tabela about_content
CREATE TABLE IF NOT EXISTS about_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    image_url TEXT,
    order_position INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Criar tabela admin_settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);

-- 16. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 17. Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 18. Inserir dados iniciais

-- Categorias
INSERT INTO categories (name, description) VALUES
('Pizzas Tradicionais', 'Pizzas com sabores clássicos e tradicionais'),
('Pizzas Especiais', 'Pizzas com ingredientes especiais e únicos'),
('Bebidas', 'Refrigerantes, sucos e outras bebidas'),
('Sobremesas', 'Doces e sobremesas deliciosas')
ON CONFLICT DO NOTHING;

-- Produtos de exemplo
INSERT INTO products (name, description, price, category_id) VALUES
('Pizza Margherita', 'Molho de tomate, mussarela e manjericão fresco', 32.90, (SELECT id FROM categories WHERE name = 'Pizzas Tradicionais' LIMIT 1)),
('Pizza Pepperoni', 'Molho de tomate, mussarela e pepperoni', 35.90, (SELECT id FROM categories WHERE name = 'Pizzas Tradicionais' LIMIT 1)),
('Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola e azeitonas', 38.90, (SELECT id FROM categories WHERE name = 'Pizzas Tradicionais' LIMIT 1)),
('Pizza Quatro Queijos', 'Molho de tomate, mussarela, parmesão, gorgonzola e provolone', 42.90, (SELECT id FROM categories WHERE name = 'Pizzas Especiais' LIMIT 1)),
('Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', 5.00, (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1)),
('Guaraná Antarctica 350ml', 'Refrigerante Guaraná Antarctica lata 350ml', 5.00, (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Criar usuário admin padrão (senha: admin123)
INSERT INTO auth.users (id, email) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@williamdiskpizza.com')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, email, full_name, role, password_hash) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@williamdiskpizza.com', 'Administrador', 'admin', '$2b$10$rQ7qP8K6wZ.wJBMfNxF7.OQAYQTnLbRvV8pxe2KRHLJy9tT0GQJYm')
ON CONFLICT DO NOTHING;

-- Configurações iniciais do admin
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('restaurant_name', 'William Disk Pizza', 'string', 'Nome do restaurante'),
('delivery_fee', '5.00', 'decimal', 'Taxa de entrega padrão'),
('min_order_value', '20.00', 'decimal', 'Valor mínimo do pedido'),
('delivery_time', '45', 'integer', 'Tempo de entrega em minutos'),
('restaurant_phone', '(11) 99999-9999', 'string', 'Telefone do restaurante'),
('restaurant_address', 'Rua das Pizzas, 123 - Centro', 'string', 'Endereço do restaurante')
ON CONFLICT DO NOTHING;

-- Conteúdo sobre a empresa
INSERT INTO about_content (section, title, content, order_position) VALUES
('hero', 'Bem-vindos à William Disk Pizza', 'A melhor pizza da cidade, feita com ingredientes frescos e muito amor!', 1),
('story', 'Nossa História', 'Fundada em 2020, a William Disk Pizza nasceu do sonho de oferecer pizzas autênticas e saborosas para toda a família.', 2),
('mission', 'Nossa Missão', 'Proporcionar momentos únicos através de pizzas artesanais feitas com ingredientes selecionados e o melhor atendimento.', 3)
ON CONFLICT DO NOTHING;

-- Mensagem de confirmação
SELECT 'Banco de dados PostgreSQL williamdiskpizza configurado com sucesso!' as status; 