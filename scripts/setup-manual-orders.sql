-- Script para configurar sistema de pedidos manuais
-- Autor: Sistema William Disk Pizza
-- Data: $(date)
-- Descrição: Cria usuário admin padrão para pedidos manuais e configura sistema

-- Verificar se o usuário admin já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        -- Inserir usuário admin padrão para pedidos manuais
        INSERT INTO profiles (
            id,
            full_name,
            email,
            phone,
            role,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            'Sistema - Pedidos Manuais',
            'admin@williamdiskpizza.com',
            '(00) 00000-0000',
            'admin',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuário admin padrão criado para pedidos manuais';
    ELSE
        RAISE NOTICE 'Usuário admin padrão já existe';
    END IF;
END $$;

-- Verificar estrutura das tabelas necessárias
DO $$
BEGIN
    -- Verificar se a coluna customer_name existe na tabela orders
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);
        RAISE NOTICE 'Coluna customer_name adicionada à tabela orders';
    END IF;
    
    -- Verificar se a coluna delivery_phone existe na tabela orders
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_phone VARCHAR(20);
        RAISE NOTICE 'Coluna delivery_phone adicionada à tabela orders';
    END IF;
    
    -- Verificar estrutura da tabela order_items para suporte a pizzas meio a meio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'half_and_half'
    ) THEN
        ALTER TABLE order_items ADD COLUMN half_and_half JSONB;
        RAISE NOTICE 'Coluna half_and_half adicionada à tabela order_items';
    END IF;
    
    -- Verificar outras colunas necessárias
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'size'
    ) THEN
        ALTER TABLE order_items ADD COLUMN size VARCHAR(50);
        RAISE NOTICE 'Coluna size adicionada à tabela order_items';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'toppings'
    ) THEN
        ALTER TABLE order_items ADD COLUMN toppings JSONB;
        RAISE NOTICE 'Coluna toppings adicionada à tabela order_items';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE order_items ADD COLUMN special_instructions TEXT;
        RAISE NOTICE 'Coluna special_instructions adicionada à tabela order_items';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'name'
    ) THEN
        ALTER TABLE order_items ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Coluna name adicionada à tabela order_items';
    END IF;
END $$;

-- Criar índices para melhor performance em pedidos manuais
CREATE INDEX IF NOT EXISTS idx_orders_manual_type ON orders(delivery_address) 
WHERE delivery_address IN ('Manual (Balcão)', 'Manual (Telefone)');

CREATE INDEX IF NOT EXISTS idx_orders_customer_info ON orders(customer_name, delivery_phone) 
WHERE customer_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_half_and_half ON order_items USING GIN(half_and_half) 
WHERE half_and_half IS NOT NULL;

-- Verificar configurações do sistema
SELECT 
    'Sistema configurado para pedidos manuais' as status,
    'OK' as admin_user_exists,
    COUNT(*) as total_products_available
FROM products 
WHERE available = true;

-- Exibir resumo da configuração
SELECT 
    'Configuração de Pedidos Manuais Concluída' as resultado,
    'Usuário admin padrão: 00000000-0000-0000-0000-000000000001' as admin_user,
    'Tipos de pedido: Manual (Balcão) e Manual (Telefone)' as tipos_pedido,
    'Suporte a pizzas meio a meio: Ativo' as pizza_meio_meio,
    'Sistema pronto para uso' as status;

COMMIT; 