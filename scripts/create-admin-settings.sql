-- Criar tabela de configurações do administrador
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Garante que só existe uma linha
  store_name VARCHAR(255) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_delivery_radius DECIMAL(10,2),
  business_hours JSONB NOT NULL DEFAULT '{
    "sunday": {"open": "18:00", "close": "23:00"},
    "monday": {"open": "18:00", "close": "23:00"},
    "tuesday": {"open": "18:00", "close": "23:00"},
    "wednesday": {"open": "18:00", "close": "23:00"},
    "thursday": {"open": "18:00", "close": "23:00"},
    "friday": {"open": "18:00", "close": "00:00"},
    "saturday": {"open": "18:00", "close": "00:00"}
  }'::jsonb,
  payment_methods JSONB NOT NULL DEFAULT '["credit_card", "debit_card", "cash"]'::jsonb,
  notification_email VARCHAR(255),
  theme JSONB NOT NULL DEFAULT '{
    "primary_color": "#FF0000",
    "secondary_color": "#000000"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o updated_at
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();

-- Inserir configurações padrão se não existirem
INSERT INTO admin_settings (id, store_name)
VALUES (1, 'Pizza Delivery')
ON CONFLICT (id) DO NOTHING; 