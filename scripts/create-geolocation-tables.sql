-- Script para criar tabelas de geolocalização e entrega
-- Execute este script no PostgreSQL para criar a estrutura necessária

-- 1. Tabela de Zonas de Entrega
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    min_distance_km DECIMAL(5,2) NOT NULL DEFAULT 0,
    max_distance_km DECIMAL(5,2) NOT NULL,
    delivery_fee DECIMAL(8,2) NOT NULL,
    estimated_time_minutes INTEGER NOT NULL DEFAULT 45,
    active BOOLEAN DEFAULT true,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_distance_order CHECK (max_distance_km > min_distance_km),
    CONSTRAINT chk_positive_fee CHECK (delivery_fee >= 0),
    CONSTRAINT chk_positive_time CHECK (estimated_time_minutes > 0)
);

-- 2. Tabela de Cache de Geocodificação
CREATE TABLE IF NOT EXISTS geocoded_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_text TEXT NOT NULL,
    formatted_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Brasil',
    distance_km DECIMAL(5,2),
    delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    is_deliverable BOOLEAN DEFAULT true,
    geocoding_service VARCHAR(50) DEFAULT 'google',
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address_text)
);

-- 3. Adicionar configurações de geolocalização na tabela admin_settings existente
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('pizzaria_latitude', '-23.5505', 'geolocation', 'Latitude da pizzaria'),
('pizzaria_longitude', '-46.6333', 'geolocation', 'Longitude da pizzaria'),
('pizzaria_address', 'Rua das Pizzas, 123 - Centro, São Paulo - SP', 'geolocation', 'Endereço completo da pizzaria'),
('max_delivery_radius_km', '15', 'geolocation', 'Raio máximo de entrega em km'),
('google_maps_api_key', '', 'geolocation', 'Chave da API do Google Maps'),
('enable_geolocation_delivery', 'true', 'geolocation', 'Habilitar cálculo por geolocalização'),
('fallback_delivery_fee', '8.00', 'geolocation', 'Taxa padrão quando não conseguir calcular'),
('geocoding_cache_hours', '168', 'geolocation', 'Horas para manter cache (168 = 1 semana)')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_delivery_zones_distance ON delivery_zones(min_distance_km, max_distance_km);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(active);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_created ON delivery_zones(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_text ON geocoded_addresses(address_text);
CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_coords ON geocoded_addresses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_distance ON geocoded_addresses(distance_km);
CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_zone ON geocoded_addresses(delivery_zone_id);
CREATE INDEX IF NOT EXISTS idx_geocoded_addresses_verified ON geocoded_addresses(last_verified DESC);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_delivery_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para delivery_zones
DROP TRIGGER IF EXISTS trigger_update_delivery_zones_updated_at ON delivery_zones;
CREATE TRIGGER trigger_update_delivery_zones_updated_at
    BEFORE UPDATE ON delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_zones_updated_at();

-- 7. Inserir dados iniciais das zonas de entrega
INSERT INTO delivery_zones (name, min_distance_km, max_distance_km, delivery_fee, estimated_time_minutes, color_hex, description) VALUES
('Centro - Entrega Grátis', 0, 3, 0.00, 25, '#10B981', 'Região central com entrega gratuita'),
('Zona Próxima', 3.01, 7, 5.00, 35, '#3B82F6', 'Bairros próximos ao centro'),
('Zona Intermediária', 7.01, 12, 8.00, 45, '#F59E0B', 'Bairros intermediários'),
('Zona Distante', 12.01, 15, 12.00, 60, '#EF4444', 'Limite da área de entrega')
ON CONFLICT DO NOTHING;

-- 8. Verificar se as tabelas foram criadas corretamente
DO $$
DECLARE
    zones_count INTEGER;
    settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO zones_count FROM delivery_zones;
    SELECT COUNT(*) INTO settings_count FROM admin_settings WHERE setting_type = 'geolocation';
    
    RAISE NOTICE 'Zonas de entrega criadas: %', zones_count;
    RAISE NOTICE 'Configurações de geolocalização: %', settings_count;
    
    IF zones_count = 0 THEN
        RAISE WARNING 'Nenhuma zona de entrega foi criada!';
    END IF;
    
    IF settings_count = 0 THEN
        RAISE WARNING 'Nenhuma configuração de geolocalização foi criada!';
    END IF;
END $$;

-- 9. Comentários para documentação
COMMENT ON TABLE delivery_zones IS 'Zonas de entrega com taxas baseadas na distância';
COMMENT ON TABLE geocoded_addresses IS 'Cache de endereços geocodificados para otimização';
COMMENT ON COLUMN delivery_zones.min_distance_km IS 'Distância mínima da zona em km';
COMMENT ON COLUMN delivery_zones.max_distance_km IS 'Distância máxima da zona em km';
COMMENT ON COLUMN delivery_zones.delivery_fee IS 'Taxa de entrega para esta zona';
COMMENT ON COLUMN delivery_zones.color_hex IS 'Cor para exibição no mapa (formato hex)';
COMMENT ON COLUMN geocoded_addresses.confidence_score IS 'Confiança da geocodificação (0-1)';
COMMENT ON COLUMN geocoded_addresses.last_verified IS 'Última vez que o endereço foi verificado';

RAISE NOTICE 'Script de geolocalização executado com sucesso!';