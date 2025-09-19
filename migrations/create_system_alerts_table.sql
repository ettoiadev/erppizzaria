-- Criação da tabela de alertas do sistema
-- Fase 3 - Sistema de Alertas Automáticos
-- Tabela de alertas do sistema para PostgreSQL local

-- Criar tabela de alertas do sistema
CREATE TABLE IF NOT EXISTS system_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('database', 'performance', 'security', 'business', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_system_alerts_alert_id ON system_alerts(alert_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_category ON system_alerts(category);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_timestamp ON system_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_category_type ON system_alerts(category, type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved_timestamp ON system_alerts(resolved, timestamp DESC);

-- Criar índice composto para consultas de dashboard
CREATE INDEX IF NOT EXISTS idx_system_alerts_dashboard 
ON system_alerts(resolved, type, timestamp DESC);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_system_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_alerts_updated_at
    BEFORE UPDATE ON system_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_system_alerts_updated_at();

-- Criar tabela de configurações de alertas
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('database', 'performance', 'security', 'business', 'system')),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    condition_config JSONB NOT NULL,
    cooldown_minutes INTEGER DEFAULT 15,
    enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para tabela de regras
CREATE INDEX IF NOT EXISTS idx_alert_rules_rule_id ON alert_rules(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_category ON alert_rules(category);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_category_enabled ON alert_rules(category, enabled);

-- Criar trigger para atualizar updated_at na tabela de regras
CREATE TRIGGER trigger_update_alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_system_alerts_updated_at();

-- Criar tabela de canais de notificação
CREATE TABLE IF NOT EXISTS alert_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'webhook', 'database', 'console')),
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para tabela de canais
CREATE INDEX IF NOT EXISTS idx_alert_channels_channel_id ON alert_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_alert_channels_type ON alert_channels(type);
CREATE INDEX IF NOT EXISTS idx_alert_channels_enabled ON alert_channels(enabled);

-- Criar trigger para atualizar updated_at na tabela de canais
CREATE TRIGGER trigger_update_alert_channels_updated_at
    BEFORE UPDATE ON alert_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_system_alerts_updated_at();

-- Criar tabela de histórico de notificações
CREATE TABLE IF NOT EXISTS alert_notifications (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES system_alerts(alert_id) ON DELETE CASCADE
);

-- Criar índices para tabela de notificações
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_channel_id ON alert_notifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_sent_at ON alert_notifications(sent_at DESC);

-- Inserir regras padrão de alertas
INSERT INTO alert_rules (rule_id, name, category, severity, condition_config, cooldown_minutes, description) VALUES
('db-connection-failed', 'Falha de Conexão com Database', 'database', 'critical', 
 '{"metric": "dbConnectionFailed", "operator": "equals", "value": true}', 5,
 'Conexão com o banco de dados falhou'),

('db-slow-queries', 'Queries Lentas no Database', 'database', 'warning',
 '{"metric": "avgQueryTime", "operator": "greater_than", "value": 1000}', 15,
 'Queries estão demorando mais que o esperado'),

('high-memory-usage', 'Alto Uso de Memória', 'performance', 'warning',
 '{"metric": "memoryUsage", "operator": "greater_than", "value": 85}', 10,
 'Uso de memória está acima de 85%'),

('high-cpu-usage', 'Alto Uso de CPU', 'performance', 'critical',
 '{"metric": "cpuUsage", "operator": "greater_than", "value": 90}', 5,
 'Uso de CPU está acima de 90%'),

('multiple-failed-logins', 'Múltiplas Tentativas de Login Falharam', 'security', 'warning',
 '{"metric": "failedLogins", "operator": "greater_than", "value": 10}', 30,
 'Detectadas múltiplas tentativas de login falharam'),

('low-stock-alert', 'Estoque Baixo', 'business', 'warning',
 '{"metric": "lowStockItems", "operator": "greater_than", "value": 0}', 60,
 'Produtos com estoque baixo detectados'),

('disk-space-low', 'Espaço em Disco Baixo', 'system', 'critical',
 '{"metric": "diskUsage", "operator": "greater_than", "value": 90}', 60,
 'Espaço em disco está baixo')

ON CONFLICT (rule_id) DO NOTHING;

-- Inserir canais padrão de notificação
INSERT INTO alert_channels (channel_id, name, type, config) VALUES
('console', 'Console Log', 'console', '{"level": "info"}'),
('database', 'Database Storage', 'database', '{"table": "system_alerts"}'),
('webhook-slack', 'Slack Webhook', 'webhook', '{"url": "", "method": "POST", "headers": {"Content-Type": "application/json"}}'),
('email-admin', 'Email Admin', 'email', '{"to": "admin@erppizzaria.com", "from": "system@erppizzaria.com"}')

ON CONFLICT (channel_id) DO NOTHING;

-- Criar view para dashboard de alertas
CREATE OR REPLACE VIEW alert_dashboard AS
SELECT 
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN resolved = false THEN 1 END) as active_alerts,
    COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_alerts,
    COUNT(CASE WHEN type = 'critical' AND resolved = false THEN 1 END) as critical_active,
    COUNT(CASE WHEN type = 'warning' AND resolved = false THEN 1 END) as warning_active,
    COUNT(CASE WHEN type = 'info' AND resolved = false THEN 1 END) as info_active,
    COUNT(CASE WHEN category = 'database' AND resolved = false THEN 1 END) as database_active,
    COUNT(CASE WHEN category = 'performance' AND resolved = false THEN 1 END) as performance_active,
    COUNT(CASE WHEN category = 'security' AND resolved = false THEN 1 END) as security_active,
    COUNT(CASE WHEN category = 'business' AND resolved = false THEN 1 END) as business_active,
    COUNT(CASE WHEN category = 'system' AND resolved = false THEN 1 END) as system_active,
    MAX(timestamp) as last_alert_time
FROM system_alerts
WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Criar função para limpeza automática de alertas antigos
CREATE OR REPLACE FUNCTION cleanup_old_alerts(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_alerts 
    WHERE timestamp < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
    AND resolved = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO system_alerts (alert_id, type, category, title, message, data)
    VALUES (
        'cleanup-' || extract(epoch from now()),
        'info',
        'system',
        'Limpeza de Alertas Antigos',
        'Limpeza automática de alertas antigos executada',
        json_build_object('deleted_count', deleted_count, 'days_to_keep', days_to_keep)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Criar função para obter estatísticas de alertas
CREATE OR REPLACE FUNCTION get_alert_statistics(period_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    total_alerts BIGINT,
    active_alerts BIGINT,
    resolved_alerts BIGINT,
    critical_alerts BIGINT,
    warning_alerts BIGINT,
    info_alerts BIGINT,
    database_alerts BIGINT,
    performance_alerts BIGINT,
    security_alerts BIGINT,
    business_alerts BIGINT,
    system_alerts BIGINT,
    avg_resolution_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN resolved = false THEN 1 END) as active_alerts,
        COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_alerts,
        COUNT(CASE WHEN type = 'critical' THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_alerts,
        COUNT(CASE WHEN type = 'info' THEN 1 END) as info_alerts,
        COUNT(CASE WHEN category = 'database' THEN 1 END) as database_alerts,
        COUNT(CASE WHEN category = 'performance' THEN 1 END) as performance_alerts,
        COUNT(CASE WHEN category = 'security' THEN 1 END) as security_alerts,
        COUNT(CASE WHEN category = 'business' THEN 1 END) as business_alerts,
        COUNT(CASE WHEN category = 'system' THEN 1 END) as system_alerts,
        AVG(CASE WHEN resolved = true AND resolved_at IS NOT NULL 
            THEN resolved_at - timestamp END) as avg_resolution_time
    FROM system_alerts
    WHERE timestamp >= CURRENT_TIMESTAMP - (period_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE system_alerts IS 'Tabela para armazenar alertas do sistema de monitoramento';
COMMENT ON TABLE alert_rules IS 'Tabela para configuração de regras de alertas';
COMMENT ON TABLE alert_channels IS 'Tabela para configuração de canais de notificação';
COMMENT ON TABLE alert_notifications IS 'Tabela para histórico de notificações enviadas';
COMMENT ON VIEW alert_dashboard IS 'View para dashboard de alertas com estatísticas dos últimas 24 horas';
COMMENT ON FUNCTION cleanup_old_alerts IS 'Função para limpeza automática de alertas antigos resolvidos';
COMMENT ON FUNCTION get_alert_statistics IS 'Função para obter estatísticas detalhadas de alertas por período';