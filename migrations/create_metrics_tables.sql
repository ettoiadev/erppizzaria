-- Criação das tabelas para sistema de métricas e alertas
-- Fase 3 - Melhorias do Plano de Correção
-- Tabelas de métricas para PostgreSQL local

-- Tabela para métricas de endpoints
CREATE TABLE IF NOT EXISTS metrics_endpoints (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER NOT NULL, -- em milissegundos
    status_code INTEGER NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para métricas de endpoints
CREATE INDEX IF NOT EXISTS idx_metrics_endpoints_created_at ON metrics_endpoints(created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_endpoints_endpoint ON metrics_endpoints(endpoint);
CREATE INDEX IF NOT EXISTS idx_metrics_endpoints_status ON metrics_endpoints(status_code);
CREATE INDEX IF NOT EXISTS idx_metrics_endpoints_response_time ON metrics_endpoints(response_time);

-- Tabela para métricas do sistema
CREATE TABLE IF NOT EXISTS metrics_system (
    id SERIAL PRIMARY KEY,
    metric_key VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para métricas do sistema
CREATE INDEX IF NOT EXISTS idx_metrics_system_created_at ON metrics_system(created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_system_type ON metrics_system(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_system_key ON metrics_system(metric_key);

-- Tabela para métricas de negócio
CREATE TABLE IF NOT EXISTS metrics_business (
    id SERIAL PRIMARY KEY,
    metric_key VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para métricas de negócio
CREATE INDEX IF NOT EXISTS idx_metrics_business_created_at ON metrics_business(created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_business_type ON metrics_business(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_business_key ON metrics_business(metric_key);

-- Tabela para métricas gerais
CREATE TABLE IF NOT EXISTS metrics_general (
    id SERIAL PRIMARY KEY,
    metric_key VARCHAR(100) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para métricas gerais
CREATE INDEX IF NOT EXISTS idx_metrics_general_created_at ON metrics_general(created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_general_key ON metrics_general(metric_key);

-- Tabela para alertas
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(100) PRIMARY KEY,
    rule_id VARCHAR(100) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    metric VARCHAR(100) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    threshold DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_alerts_metric ON alerts(metric);

-- Tabela para sessões de usuário (para métricas de usuários ativos)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, -- Referência lógica para users(id)
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices para sessões de usuário
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Função para limpeza automática de métricas antigas
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    -- Remove métricas de endpoints mais antigas que 30 dias
    DELETE FROM metrics_endpoints 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Remove métricas de sistema mais antigas que 30 dias
    DELETE FROM metrics_system 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Remove métricas de negócio mais antigas que 90 dias
    DELETE FROM metrics_business 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Remove métricas gerais mais antigas que 30 dias
    DELETE FROM metrics_general 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Remove alertas resolvidos mais antigos que 90 dias
    DELETE FROM alerts 
    WHERE resolved = true AND resolved_at < NOW() - INTERVAL '90 days';
    
    -- Remove sessões expiradas
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    RAISE NOTICE 'Cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas agregadas
CREATE OR REPLACE FUNCTION calculate_hourly_metrics()
RETURNS void AS $$
DECLARE
    current_hour TIMESTAMP;
BEGIN
    current_hour := DATE_TRUNC('hour', NOW());
    
    -- Insere métricas agregadas de endpoints por hora
    INSERT INTO metrics_general (metric_key, value, metadata, created_at)
    SELECT 
        'hourly_avg_response_time',
        AVG(response_time),
        jsonb_build_object(
            'hour', current_hour,
            'total_requests', COUNT(*),
            'error_count', COUNT(CASE WHEN status_code >= 400 THEN 1 END)
        ),
        current_hour
    FROM metrics_endpoints 
    WHERE created_at >= current_hour - INTERVAL '1 hour'
      AND created_at < current_hour
    HAVING COUNT(*) > 0;
    
    -- Insere métricas de taxa de erro por hora
    INSERT INTO metrics_general (metric_key, value, metadata, created_at)
    SELECT 
        'hourly_error_rate',
        (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)),
        jsonb_build_object(
            'hour', current_hour,
            'total_requests', COUNT(*),
            'error_count', COUNT(CASE WHEN status_code >= 400 THEN 1 END)
        ),
        current_hour
    FROM metrics_endpoints 
    WHERE created_at >= current_hour - INTERVAL '1 hour'
      AND created_at < current_hour
    HAVING COUNT(*) > 0;
    
    RAISE NOTICE 'Hourly metrics calculated for %', current_hour;
END;
$$ LANGUAGE plpgsql;

-- View para dashboard de métricas
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
    'endpoints' as category,
    COUNT(*) as total_requests,
    AVG(response_time) as avg_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) as error_rate
FROM metrics_endpoints 
WHERE created_at >= NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'system' as category,
    COUNT(*) as total_metrics,
    AVG(value) as avg_value,
    COUNT(CASE WHEN value > 80 THEN 1 END) as high_values,
    (COUNT(CASE WHEN value > 80 THEN 1 END) * 100.0 / COUNT(*)) as high_value_rate
FROM metrics_system 
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Comentários para documentação
COMMENT ON TABLE metrics_endpoints IS 'Métricas de performance dos endpoints da API';
COMMENT ON TABLE metrics_system IS 'Métricas do sistema (CPU, memória, etc.)';
COMMENT ON TABLE metrics_business IS 'Métricas de negócio (vendas, pedidos, etc.)';
COMMENT ON TABLE metrics_general IS 'Métricas gerais e agregadas';
COMMENT ON TABLE alerts IS 'Sistema de alertas baseado em métricas';
COMMENT ON TABLE user_sessions IS 'Sessões ativas de usuários para métricas';
COMMENT ON VIEW dashboard_metrics IS 'View para dashboard de métricas em tempo real';
COMMENT ON FUNCTION cleanup_old_metrics IS 'Função para limpeza automática de dados antigos';
COMMENT ON FUNCTION calculate_hourly_metrics IS 'Função para cálculo de métricas agregadas por hora';