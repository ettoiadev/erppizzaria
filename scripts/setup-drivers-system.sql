-- Script completo para configurar sistema de entregadores
-- William Disk Pizza - Sistema de Entregadores

-- 1. Criar tabela drivers se não existir
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car')),
    vehicle_plate VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'offline')),
    current_location TEXT,
    total_deliveries INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 0.0,
    average_delivery_time INTEGER DEFAULT 0, -- em minutos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Adicionar campo driver_id na tabela orders se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'driver_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);
    END IF;
END $$;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON drivers(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);

-- 4. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_drivers_updated_at();

-- 5. Inserir dados de exemplo de entregadores
INSERT INTO drivers (name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time)
VALUES 
    ('Carlos Silva', 'carlos.silva@williamdiskpizza.com', '(11) 99999-1111', 'motorcycle', 'ABC-1234', 'available', 'Centro - São Paulo/SP', 245, 4.8, 25),
    ('João Santos', 'joao.santos@williamdiskpizza.com', '(11) 99999-2222', 'motorcycle', 'DEF-5678', 'available', 'Jardins - São Paulo/SP', 189, 4.6, 28),
    ('Maria Oliveira', 'maria.oliveira@williamdiskpizza.com', '(11) 99999-3333', 'bicycle', 'BIC-001', 'available', 'Vila Madalena - São Paulo/SP', 156, 4.9, 22),
    ('Pedro Costa', 'pedro.costa@williamdiskpizza.com', '(11) 99999-4444', 'motorcycle', 'GHI-9012', 'offline', 'Pinheiros - São Paulo/SP', 98, 4.5, 30)
ON CONFLICT (email) DO NOTHING;

-- 6. Verificar dados inseridos
SELECT 
    id,
    name,
    email,
    phone,
    vehicle_type,
    vehicle_plate,
    status,
    current_location,
    total_deliveries,
    average_rating,
    average_delivery_time,
    created_at
FROM drivers
ORDER BY created_at DESC; 