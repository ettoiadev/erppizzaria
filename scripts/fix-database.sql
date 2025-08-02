-- Script de Correção Automática do Banco williamdiskpizza
-- Execute APENAS os comandos necessários baseados na verificação anterior

\echo '🔧 INICIANDO CORREÇÕES DO BANCO williamdiskpizza'
\echo '================================================'

-- 1. INSTALAR EXTENSÕES NECESSÁRIAS (se não existirem)
\echo '\n🔧 1. INSTALANDO EXTENSÕES NECESSÁRIAS'

DO $$
BEGIN
    -- UUID Extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        RAISE NOTICE '✅ Extensão uuid-ossp instalada';
    ELSE
        RAISE NOTICE '✅ Extensão uuid-ossp já existe';
    END IF;
    
    -- PGCrypto Extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        RAISE NOTICE '✅ Extensão pgcrypto instalada';
    ELSE
        RAISE NOTICE '✅ Extensão pgcrypto já existe';
    END IF;
END$$;

-- 2. CRIAR TIPOS ENUM SE NÃO EXISTIREM
\echo '\n🏷️ 2. VERIFICANDO/CRIANDO TIPOS ENUM'

-- Order Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'PENDING',
            'RECEIVED', 
            'PREPARING',
            'READY',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'CANCELLED'
        );
        RAISE NOTICE '✅ Tipo order_status criado';
    ELSE
        RAISE NOTICE '✅ Tipo order_status já existe';
        
        -- Adicionar valores que podem estar faltando
        BEGIN
            ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'PENDING';
            ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'READY';
            ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE '⚠️ Alguns valores de order_status podem já existir';
        END;
    END IF;
END$$;

-- Payment Method
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM (
            'PIX',
            'CREDIT_CARD',
            'DEBIT_CARD', 
            'CASH',
            'MERCADO_PAGO'
        );
        RAISE NOTICE '✅ Tipo payment_method criado';
    ELSE
        RAISE NOTICE '✅ Tipo payment_method já existe';
        
        -- Adicionar MERCADO_PAGO se não existir
        BEGIN
            ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'MERCADO_PAGO';
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE '⚠️ MERCADO_PAGO pode já existir';
        END;
    END IF;
END$$;

-- Payment Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'PENDING',
            'APPROVED',
            'REJECTED',
            'CANCELLED'
        );
        RAISE NOTICE '✅ Tipo payment_status criado';
    ELSE
        RAISE NOTICE '✅ Tipo payment_status já existe';
    END IF;
END$$;

-- 3. ADICIONAR COLUNAS QUE PODEM ESTAR FALTANDO
\echo '\n📊 3. VERIFICANDO/ADICIONANDO COLUNAS NECESSÁRIAS'

-- Tabela Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

-- Verificar se as colunas foram adicionadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
        RAISE NOTICE '✅ Coluna customer_name existe em orders';
    ELSE
        RAISE NOTICE '❌ Coluna customer_name não foi adicionada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
        RAISE NOTICE '✅ Coluna customer_phone existe em orders';
    ELSE
        RAISE NOTICE '❌ Coluna customer_phone não foi adicionada';
    END IF;
END$$;

-- 4. CRIAR TABELAS QUE PODEM ESTAR FALTANDO
\echo '\n📋 4. CRIANDO TABELAS NECESSÁRIAS (SE NÃO EXISTIREM)'

-- Tabela admin_settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela customer_addresses (se não existir)
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(255),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INSERIR CONFIGURAÇÕES ADMINISTRATIVAS PADRÃO
\echo '\n⚙️ 5. INSERINDO CONFIGURAÇÕES ADMINISTRATIVAS'

INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('allowAdminRegistration', 'enabled', 'Permitir registro de administradores'),
('deliveryFee', '5.00', 'Taxa de entrega padrão'),
('minimumOrderValue', '20.00', 'Valor mínimo do pedido'),
('maxDeliveryDistance', '10', 'Distância máxima de entrega em km'),
('estimatedDeliveryTime', '45', 'Tempo estimado de entrega em minutos'),
('storeOpen', 'true', 'Loja aberta para pedidos'),
('storeOpenTime', '18:00', 'Horário de abertura'),
('storeCloseTime', '23:30', 'Horário de fechamento')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. INSERIR CATEGORIAS PADRÃO SE NÃO EXISTIREM
\echo '\n🍕 6. INSERINDO CATEGORIAS PADRÃO'

INSERT INTO categories (name, description, active, sort_order) VALUES
('Pizzas Tradicionais', 'Pizzas clássicas da casa', true, 1),
('Pizzas Especiais', 'Pizzas gourmet e especiais', true, 2),
('Bebidas', 'Refrigerantes, sucos e águas', true, 3),
('Sobremesas', 'Doces e sobremesas deliciosas', true, 4),
('Aperitivos', 'Entradas e petiscos', true, 5)
ON CONFLICT DO NOTHING;

-- 7. CRIAR USUÁRIO ADMIN SE NÃO EXISTIR
\echo '\n👨‍💼 7. CRIANDO USUÁRIO ADMINISTRADOR'

DO $$
DECLARE
    admin_exists BOOLEAN;
    user_uuid UUID;
BEGIN
    -- Verificar se já existe admin
    SELECT EXISTS(SELECT 1 FROM profiles WHERE role = 'admin') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Verificar se existe schema auth
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
            -- Inserir em auth.users primeiro (se existe)
            INSERT INTO auth.users (id, email) 
            VALUES (uuid_generate_v4(), 'admin@pizzaria.com') 
            RETURNING id INTO user_uuid;
            
            -- Inserir em profiles
            INSERT INTO profiles (id, email, full_name, role, password_hash) VALUES
            (user_uuid, 'admin@pizzaria.com', 'Administrador', 'admin', 
             '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu');
        ELSE
            -- Apenas inserir em profiles (sem auth schema)
            INSERT INTO profiles (email, full_name, role, password_hash) VALUES
            ('admin@pizzaria.com', 'Administrador', 'admin', 
             '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu');
        END IF;
        
        RAISE NOTICE '✅ Usuário admin criado: admin@pizzaria.com / senha: admin123';
    ELSE
        RAISE NOTICE '✅ Usuário admin já existe';
    END IF;
END$$;

-- 8. CRIAR ÍNDICES IMPORTANTES SE NÃO EXISTIREM
\echo '\n📈 8. CRIANDO ÍNDICES PARA PERFORMANCE'

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- 9. CRIAR TRIGGERS PARA UPDATED_AT
\echo '\n⚡ 9. CRIANDO TRIGGERS PARA UPDATED_AT'

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tabelas que têm updated_at
DO $$
BEGIN
    -- Orders
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
        CREATE TRIGGER update_orders_updated_at 
            BEFORE UPDATE ON orders 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger created for orders.updated_at';
    END IF;
    
    -- Profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger created for profiles.updated_at';
    END IF;
    
    -- Categories
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
        CREATE TRIGGER update_categories_updated_at 
            BEFORE UPDATE ON categories 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger created for categories.updated_at';
    END IF;
    
    -- Products
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_products_updated_at ON products;
        CREATE TRIGGER update_products_updated_at 
            BEFORE UPDATE ON products 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger created for products.updated_at';
    END IF;
END$$;

-- 10. INSERIR PRODUTOS DE EXEMPLO SE CATEGORIAS EXISTIREM MAS PRODUTOS NÃO
\echo '\n🍕 10. INSERINDO PRODUTOS DE EXEMPLO'

DO $$
DECLARE
    cat_pizzas_id UUID;
    cat_bebidas_id UUID;
    products_count INTEGER;
BEGIN
    -- Contar produtos existentes
    SELECT COUNT(*) INTO products_count FROM products;
    
    IF products_count = 0 THEN
        -- Buscar IDs das categorias
        SELECT id INTO cat_pizzas_id FROM categories WHERE name ILIKE '%pizza%' LIMIT 1;
        SELECT id INTO cat_bebidas_id FROM categories WHERE name ILIKE '%bebida%' LIMIT 1;
        
        -- Inserir produtos se categorias existirem
        IF cat_pizzas_id IS NOT NULL THEN
            INSERT INTO products (category_id, name, description, price, active, has_sizes) VALUES
            (cat_pizzas_id, 'Pizza Margherita', 'Molho de tomate, mussarela e manjericão', 35.90, true, true),
            (cat_pizzas_id, 'Pizza Calabresa', 'Molho de tomate, mussarela e calabresa', 38.90, true, true),
            (cat_pizzas_id, 'Pizza Portuguesa', 'Molho, mussarela, presunto, ovos e cebola', 42.90, true, true);
            
            RAISE NOTICE '✅ Produtos de pizza inseridos';
        END IF;
        
        IF cat_bebidas_id IS NOT NULL THEN
            INSERT INTO products (category_id, name, description, price, active, has_sizes) VALUES
            (cat_bebidas_id, 'Coca-Cola 350ml', 'Refrigerante Coca-Cola lata', 5.50, false, false),
            (cat_bebidas_id, 'Água Mineral 500ml', 'Água mineral natural', 3.00, false, false);
            
            RAISE NOTICE '✅ Produtos de bebida inseridos';
        END IF;
    ELSE
        RAISE NOTICE '✅ Produtos já existem (% produtos)', products_count;
    END IF;
END$$;

-- 11. VERIFICAÇÃO FINAL
\echo '\n✅ 11. VERIFICAÇÃO FINAL DAS CORREÇÕES'

SELECT 
    'Extensões' as item,
    CASE WHEN (
        SELECT COUNT(*) FROM pg_extension 
        WHERE extname IN ('uuid-ossp', 'pgcrypto')
    ) >= 2 THEN '✅ OK' ELSE '❌ Problema' END as status
UNION ALL
SELECT 
    'Tipos ENUM',
    CASE WHEN (
        SELECT COUNT(*) FROM pg_type 
        WHERE typname IN ('order_status', 'payment_method', 'payment_status')
    ) = 3 THEN '✅ OK' ELSE '❌ Problema' END
UNION ALL
SELECT 
    'Tabelas Principais',
    CASE WHEN (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'orders', 'order_items', 'categories', 'products')
    ) = 5 THEN '✅ OK' ELSE '❌ Problema' END
UNION ALL
SELECT 
    'Usuário Admin',
    CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE role = 'admin') 
    THEN '✅ OK' ELSE '❌ Problema' END
UNION ALL
SELECT 
    'Configurações',
    CASE WHEN EXISTS(SELECT 1 FROM admin_settings) 
    THEN '✅ OK' ELSE '❌ Problema' END
UNION ALL
SELECT 
    'Categorias',
    CASE WHEN EXISTS(SELECT 1 FROM categories) 
    THEN '✅ OK' ELSE '❌ Problema' END;

\echo '\n🎉 CORREÇÕES FINALIZADAS!'
\echo '========================='
\echo 'Execute o script de verificação novamente para confirmar que tudo está OK.'