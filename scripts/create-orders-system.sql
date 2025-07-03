-- Criar enum para status do pedido
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

-- Criar enum para status do pagamento
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

-- Criar enum para método de pagamento
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

-- Criar tabela de pedidos
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

-- Criar tabela de itens do pedido
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

-- Criar tabela de histórico de status dos pedidos
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- Criar função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o timestamp
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
        
        -- Atualizar timestamps específicos baseados no status
        IF NEW.status = 'DELIVERED' THEN
            NEW.delivered_at = NOW();
        ELSIF NEW.status = 'CANCELLED' THEN
            NEW.cancelled_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_order_status_change_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- Inserir alguns dados de exemplo para teste
INSERT INTO orders (id, user_id, status, total, subtotal, delivery_fee, payment_method, delivery_address, delivery_phone, estimated_delivery_time) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM auth.users LIMIT 1), 'RECEIVED', 45.90, 42.90, 3.00, 'PIX', 'Rua das Flores, 123 - Centro, São Paulo - SP', '(11) 99999-9999', NOW() + INTERVAL '45 minutes'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM auth.users LIMIT 1), 'PREPARING', 67.80, 62.80, 5.00, 'CARTAO', 'Av. Paulista, 456 - Bela Vista, São Paulo - SP', '(11) 88888-8888', NOW() + INTERVAL '30 minutes'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM auth.users LIMIT 1), 'ON_THE_WAY', 89.50, 84.50, 5.00, 'DINHEIRO', 'Rua Augusta, 789 - Consolação, São Paulo - SP', '(11) 77777-7777', NOW() + INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- Inserir itens de exemplo
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, size) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM products WHERE name LIKE '%Pizza%' LIMIT 1), 1, 32.90, 32.90, 'Média'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM products WHERE name LIKE '%Refrigerante%' LIMIT 1), 2, 5.00, 10.00, '350ml'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM products WHERE name LIKE '%Pizza%' LIMIT 1), 2, 28.90, 57.80, 'Pequena'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM products WHERE name LIKE '%Refrigerante%' LIMIT 1), 1, 5.00, 5.00, '350ml'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM products WHERE name LIKE '%Pizza%' LIMIT 1), 1, 45.90, 45.90, 'Grande'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM products WHERE name LIKE '%Pizza%' LIMIT 1), 1, 38.60, 38.60, 'Média')
ON CONFLICT DO NOTHING;
