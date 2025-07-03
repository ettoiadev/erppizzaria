-- Adicionar configuração para permitir registro de administradores
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('allowAdminRegistration', 'true', 'boolean', 'Permite o cadastro de novos administradores')
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Verificar se foi inserido
SELECT setting_key, setting_value, description FROM admin_settings WHERE setting_key = 'allowAdminRegistration'; 