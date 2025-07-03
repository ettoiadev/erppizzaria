-- Script simplificado para corrigir estrutura da tabela orders
-- Execute este script no PostgreSQL williamdiskpizza

-- 1. Criar tabela orders se não existir
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'RECEIVED',
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    delivery_address TEXT NOT NULL DEFAULT '',
    delivery_phone VARCHAR(20) NOT NULL DEFAULT '',
    delivery_instructions TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas que podem estar faltando (ignorar erros se já existirem)
DO $$ 
BEGIN
    -- delivery_fee
    BEGIN
        ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- subtotal
    BEGIN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- discount
    BEGIN
        ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- payment_status
    BEGIN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PENDING';
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- delivery_phone
    BEGIN
        ALTER TABLE orders ADD COLUMN delivery_phone VARCHAR(20) NOT NULL DEFAULT '';
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- delivery_address
    BEGIN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT NOT NULL DEFAULT '';
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- delivery_instructions
    BEGIN
        ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- estimated_delivery_time
    BEGIN
        ALTER TABLE orders ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- delivered_at
    BEGIN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- cancelled_at
    BEGIN
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
    
    -- cancellation_reason
    BEGIN
        ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 3. Criar constraints se não existirem
DO $$
BEGIN
    -- Status constraint
    BEGIN
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'));
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;
    
    -- Payment status constraint
    BEGIN
        ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'));
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 4. Criar tabela order_items se não existir
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    size VARCHAR(50),
    toppings TEXT[],
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela order_status_history se não existir
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- 7. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Trigger para updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Função para log de mudança de status
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
        
        -- Atualizar timestamps específicos
        IF NEW.status = 'DELIVERED' THEN
            NEW.delivered_at = NOW();
        ELSIF NEW.status = 'CANCELLED' THEN
            NEW.cancelled_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Trigger para log de status
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;
CREATE TRIGGER log_order_status_change_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
