# Plano de Correção - ERP Pizzaria
## Baseado no Relatório TestSprite MCP

### 📋 Resumo Executivo

**Data de Criação:** 18 de Setembro de 2025  
**Baseado em:** Relatório TestSprite MCP  
**Problemas Críticos:** 3 principais identificados  
**Taxa de Falha Atual:** 64% (16 de 25 testes)  
**Meta de Sucesso:** 90% de testes passando  

---

## 🎯 Problemas Críticos Identificados

### 1. 🔴 **CRÍTICO** - API de Categorias com Erro 500
- **Endpoint:** `GET /api/categories`
- **Impacto:** Cardápio não carrega, impossível adicionar produtos ao carrinho
- **Testes Afetados:** TC007, TC008, TC010, TC011, TC012, TC021
- **Prioridade:** MÁXIMA

### 2. 🔴 **CRÍTICO** - Falhas na Autenticação Admin
- **Endpoint:** `POST /api/auth/login`
- **Impacto:** Painel administrativo inacessível
- **Testes Afetados:** TC013, TC014, TC015, TC016, TC017
- **Prioridade:** MÁXIMA

### 3. 🔴 **CRÍTICO** - Rate Limiting Excessivo
- **Status:** 429 Too Many Requests
- **Impacto:** Usuários legítimos bloqueados
- **Testes Afetados:** TC010, TC011, TC013, TC016, TC017
- **Prioridade:** ALTA

---

## 📅 Plano de Ação Estruturado

### **FASE 1 - Correções Críticas (1-2 dias)**

#### **Dia 1 - Manhã (2-4 horas)**

##### **1.1 Diagnóstico da API de Categorias**

**Passos:**
1. Verificar logs do servidor para erros específicos
2. Testar conexão com PostgreSQL
3. Validar estrutura da tabela categories
4. Verificar dados existentes

**Scripts de Diagnóstico:**
```sql
-- Verificar se a tabela categories existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Verificar dados existentes
SELECT id, name, description, active, created_at, updated_at
FROM categories
ORDER BY created_at DESC;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'categories';
```

**Checklist de Validação:**
- [ ] Tabela categories existe
- [ ] Colunas obrigatórias presentes (id, name, active)
- [ ] Pelo menos uma categoria ativa existe
- [ ] Índices apropriados configurados
- [ ] Conexão PostgreSQL funcional

##### **1.2 Correção da API de Categorias**

**Passos:**
1. Revisar código do endpoint `/api/categories`
2. Adicionar tratamento de erro robusto
3. Implementar logging estruturado
4. Criar dados de seed se necessário

**Script de Seed (se necessário):**
```sql
-- Inserir categorias básicas se não existirem
INSERT INTO categories (name, description, active, created_at, updated_at)
VALUES 
  ('Pizzas Tradicionais', 'Pizzas clássicas com ingredientes tradicionais', true, NOW(), NOW()),
  ('Pizzas Especiais', 'Pizzas gourmet com ingredientes especiais', true, NOW(), NOW()),
  ('Bebidas', 'Refrigerantes, sucos e águas', true, NOW(), NOW()),
  ('Sobremesas', 'Doces e sobremesas variadas', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Verificar inserção
SELECT COUNT(*) as total_categorias FROM categories WHERE active = true;
```

**Checklist de Validação:**
- [ ] Endpoint retorna status 200
- [ ] JSON válido retornado
- [ ] Categorias ativas listadas
- [ ] Logs estruturados funcionando
- [ ] Tratamento de erro implementado

#### **Dia 1 - Tarde (2-3 horas)**

##### **1.3 Diagnóstico da Autenticação Admin**

**Passos:**
1. Verificar tabela users e roles
2. Validar usuários admin existentes
3. Testar processo de login admin
4. Verificar JWT e refresh tokens

**Scripts de Diagnóstico:**
```sql
-- Verificar estrutura da tabela users
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verificar usuários admin
SELECT id, email, role, active, created_at
FROM users 
WHERE role = 'admin' OR role LIKE '%admin%'
ORDER BY created_at;

-- Verificar tabela profiles se existir
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar refresh_tokens
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'refresh_tokens'
ORDER BY ordinal_position;
```

**Checklist de Validação:**
- [ ] Tabela users existe com coluna role
- [ ] Pelo menos um usuário admin existe
- [ ] Senhas estão hasheadas corretamente
- [ ] Tabelas profiles e refresh_tokens existem
- [ ] Estrutura JWT configurada

##### **1.4 Correção da Autenticação Admin**

**Passos:**
1. Criar usuário admin se não existir
2. Corrigir endpoint de login admin
3. Validar geração de JWT
4. Testar middleware de autenticação

**Script de Criação Admin:**
```sql
-- Criar usuário admin padrão (assumindo estrutura)
INSERT INTO users (email, password_hash, role, active, created_at, updated_at)
VALUES (
  'admin@erppizzaria.com',
  '$2b$12$exemplo_hash_bcrypt_aqui', -- Substituir por hash real
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  active = true,
  updated_at = NOW();

-- Verificar criação
SELECT id, email, role, active FROM users WHERE role = 'admin';
```

**Checklist de Validação:**
- [ ] Usuário admin criado/atualizado
- [ ] Login admin funcional
- [ ] JWT gerado corretamente
- [ ] Middleware de auth funcionando
- [ ] Acesso ao painel admin liberado

#### **Dia 2 - Manhã (1-2 horas)**

##### **1.5 Ajuste do Rate Limiting**

**Passos:**
1. Localizar configuração de rate limiting
2. Ajustar limites para desenvolvimento
3. Implementar whitelist para IPs locais
4. Configurar diferentes limites por endpoint

**Configurações Sugeridas:**
```javascript
// Configuração de rate limiting ajustada
const rateLimitConfig = {
  // Para desenvolvimento
  development: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 tentativas por IP
    skipSuccessfulRequests: true,
    whitelist: ['127.0.0.1', '::1', 'localhost']
  },
  // Para produção
  production: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 tentativas por IP
    skipSuccessfulRequests: true
  }
};
```

**Checklist de Validação:**
- [ ] Rate limiting ajustado para dev
- [ ] Whitelist de IPs locais funcionando
- [ ] Diferentes limites por endpoint
- [ ] Logs de rate limiting implementados
- [ ] Testes de login não bloqueados

---

### **FASE 2 - Estabilização (3-5 dias)**

#### **Dia 3-4 - Logging e Monitoramento**

##### **2.1 Implementar Logging Estruturado**

**Objetivos:**
- Logs padronizados em JSON
- Diferentes níveis (error, warn, info, debug)
- Correlação de requests
- Logs de performance

**Estrutura de Log Sugerida:**
```javascript
const logStructure = {
  timestamp: '2025-09-18T20:30:00.000Z',
  level: 'error|warn|info|debug',
  service: 'erp-pizzaria',
  requestId: 'uuid-v4',
  userId: 'user-id-if-available',
  endpoint: '/api/categories',
  method: 'GET',
  statusCode: 500,
  duration: 150, // ms
  message: 'Descrição do evento',
  error: {
    name: 'DatabaseError',
    message: 'Connection timeout',
    stack: 'stack trace'
  },
  metadata: {
    // Dados adicionais específicos
  }
};
```

**Checklist de Validação:**
- [ ] Logger estruturado implementado
- [ ] Logs de todas as APIs críticas
- [ ] Correlação de requests funcionando
- [ ] Logs de performance implementados
- [ ] Rotação de logs configurada

##### **2.2 Criar Seeds de Desenvolvimento**

**Script Completo de Seeds:**
```sql
-- Seeds para desenvolvimento
BEGIN;

-- Categorias
INSERT INTO categories (name, description, active, created_at, updated_at)
VALUES 
  ('Pizzas Tradicionais', 'Pizzas clássicas com ingredientes tradicionais', true, NOW(), NOW()),
  ('Pizzas Especiais', 'Pizzas gourmet com ingredientes especiais', true, NOW(), NOW()),
  ('Bebidas', 'Refrigerantes, sucos e águas', true, NOW(), NOW()),
  ('Sobremesas', 'Doces e sobremesas variadas', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Produtos de exemplo (assumindo estrutura)
INSERT INTO products (name, description, price, category_id, active, created_at, updated_at)
SELECT 
  'Pizza Margherita',
  'Pizza tradicional com molho de tomate, mussarela e manjericão',
  29.90,
  c.id,
  true,
  NOW(),
  NOW()
FROM categories c WHERE c.name = 'Pizzas Tradicionais'
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, category_id, active, created_at, updated_at)
SELECT 
  'Pizza Pepperoni',
  'Pizza com molho de tomate, mussarela e pepperoni',
  34.90,
  c.id,
  true,
  NOW(),
  NOW()
FROM categories c WHERE c.name = 'Pizzas Tradicionais'
ON CONFLICT (name) DO NOTHING;

-- Usuário admin
INSERT INTO users (email, password_hash, role, active, created_at, updated_at)
VALUES (
  'admin@erppizzaria.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBcQQo0Pl5PL.S', -- senha: admin123
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  active = true,
  updated_at = NOW();

-- Usuário teste
INSERT INTO users (email, password_hash, role, active, created_at, updated_at)
VALUES (
  'teste@erppizzaria.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBcQQo0Pl5PL.S', -- senha: teste123
  'customer',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Verificar seeds
SELECT 'Categorias' as tipo, COUNT(*) as total FROM categories WHERE active = true
UNION ALL
SELECT 'Produtos' as tipo, COUNT(*) as total FROM products WHERE active = true
UNION ALL
SELECT 'Usuários Admin' as tipo, COUNT(*) as total FROM users WHERE role = 'admin' AND active = true
UNION ALL
SELECT 'Usuários Total' as tipo, COUNT(*) as total FROM users WHERE active = true;
```

#### **Dia 5 - Health Checks e Monitoramento**

##### **2.3 Implementar Health Checks**

**Endpoints de Health Check:**
```javascript
// Estrutura de health check
const healthCheck = {
  status: 'healthy|degraded|unhealthy',
  timestamp: '2025-09-18T20:30:00.000Z',
  version: '1.0.0',
  uptime: 3600, // segundos
  checks: {
    database: {
      status: 'healthy',
      responseTime: 45, // ms
      details: 'PostgreSQL connection OK'
    },
    redis: {
      status: 'healthy',
      responseTime: 12, // ms
      details: 'Redis connection OK'
    },
    external_apis: {
      mercadopago: {
        status: 'healthy',
        responseTime: 200, // ms
      }
    }
  }
};
```

**Checklist de Validação:**
- [ ] Endpoint `/api/health` implementado
- [ ] Check de conexão PostgreSQL
- [ ] Check de APIs externas
- [ ] Métricas de performance
- [ ] Alertas automáticos configurados

---

### **FASE 3 - Melhorias (1-2 semanas)**

#### **Semana 1 - Testes Automatizados**

##### **3.1 Implementar Testes de API**

**Estrutura de Testes:**
```javascript
// Exemplo de teste para API de categorias
describe('Categories API', () => {
  test('GET /api/categories should return active categories', async () => {
    const response = await request(app)
      .get('/api/categories')
      .expect(200);
    
    expect(response.body).toHaveProperty('categories');
    expect(Array.isArray(response.body.categories)).toBe(true);
    expect(response.body.categories.length).toBeGreaterThan(0);
  });
  
  test('GET /api/categories should handle database errors', async () => {
    // Mock database error
    jest.spyOn(db, 'query').mockRejectedValue(new Error('Database error'));
    
    const response = await request(app)
      .get('/api/categories')
      .expect(500);
    
    expect(response.body).toHaveProperty('error');
  });
});
```

##### **3.2 Testes de Autenticação**

**Checklist de Testes:**
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Rate limiting funcionando
- [ ] JWT válido gerado
- [ ] Refresh token funcionando
- [ ] Middleware de auth protegendo rotas

#### **Semana 2 - Monitoramento Avançado**

##### **3.3 Dashboard de Métricas**

**Métricas a Monitorar:**
- Tempo de resposta por endpoint
- Taxa de erro por endpoint
- Número de usuários ativos
- Performance do banco de dados
- Uso de memória e CPU
- Taxa de conversão (carrinho → pedido)

**Checklist de Validação:**
- [ ] Dashboard de métricas implementado
- [ ] Alertas automáticos configurados
- [ ] Logs centralizados
- [ ] Monitoramento de performance
- [ ] Relatórios automáticos

---

## 📊 Critérios de Sucesso

### **Métricas Principais**

| Métrica | Valor Atual | Meta | Prazo |
|---------|-------------|------|-------|
| Taxa de Sucesso dos Testes | 36% | 90% | Fase 1 |
| Tempo de Resposta API | Variável | < 200ms | Fase 2 |
| Disponibilidade | 64% | 99% | Fase 2 |
| Cobertura de Testes | 0% | 80% | Fase 3 |
| MTTR (Mean Time to Recovery) | N/A | < 5min | Fase 3 |

### **Validação por Fase**

#### **Fase 1 - Sucesso se:**
- [ ] API `/api/categories` retorna 200 consistentemente
- [ ] Login admin funciona sem erro 500
- [ ] Rate limiting não bloqueia usuários legítimos
- [ ] Pelo menos 20 dos 25 testes TestSprite passam

#### **Fase 2 - Sucesso se:**
- [ ] Logs estruturados em todos os endpoints críticos
- [ ] Health checks funcionando
- [ ] Seeds de desenvolvimento criados
- [ ] Tempo de resposta < 500ms em 95% das requests

#### **Fase 3 - Sucesso se:**
- [ ] Cobertura de testes > 80%
- [ ] Dashboard de monitoramento funcionando
- [ ] Alertas automáticos configurados
- [ ] 24 dos 25 testes TestSprite passam

---

## 🔄 Processo de Validação

### **Validação Diária**
1. Executar testes TestSprite
2. Verificar logs de erro
3. Monitorar métricas de performance
4. Validar health checks

### **Validação Semanal**
1. Executar suite completa de testes
2. Revisar métricas de negócio
3. Analisar logs de segurança
4. Atualizar documentação

### **Comandos de Validação**

```bash
# Testar API de categorias
curl -X GET http://localhost:3001/api/categories

# Testar login admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erppizzaria.com","password":"admin123","isAdminLogin":true}'

# Verificar health check
curl -X GET http://localhost:3001/api/health

# Executar testes TestSprite
npx @testsprite/testsprite-mcp generateCodeAndExecute
```

---

## 📋 Checklist Geral de Execução

### **Preparação**
- [ ] Backup do banco de dados atual
- [ ] Ambiente de desenvolvimento configurado
- [ ] Acesso aos logs do servidor
- [ ] Ferramentas de teste instaladas

### **Fase 1 - Críticas**
- [ ] Diagnóstico API categorias completo
- [ ] Correção API categorias implementada
- [ ] Diagnóstico autenticação admin completo
- [ ] Correção autenticação admin implementada
- [ ] Rate limiting ajustado
- [ ] Validação com TestSprite executada

### **Fase 2 - Estabilização**
- [ ] Logging estruturado implementado
- [ ] Seeds de desenvolvimento criados
- [ ] Health checks implementados
- [ ] Monitoramento básico configurado

### **Fase 3 - Melhorias**
- [ ] Testes automatizados implementados
- [ ] Dashboard de métricas criado
- [ ] Alertas automáticos configurados
- [ ] Documentação atualizada

---

## 🚨 Plano de Contingência

### **Se API de Categorias não for corrigida:**
1. Implementar cache em memória temporário
2. Criar endpoint de fallback com dados estáticos
3. Investigar problemas de conexão PostgreSQL
4. Considerar rollback para versão anterior

### **Se Autenticação Admin falhar:**
1. Criar usuário admin via script SQL direto
2. Implementar bypass temporário para desenvolvimento
3. Verificar configuração JWT
4. Revisar middleware de autenticação

### **Se Rate Limiting continuar problemático:**
1. Desabilitar temporariamente em desenvolvimento
2. Implementar whitelist mais ampla
3. Configurar limites por usuário autenticado
4. Revisar configuração de proxy/load balancer

---

## 📞 Contatos e Responsabilidades

### **Responsáveis por Fase**
- **Fase 1:** Desenvolvedor Backend Senior
- **Fase 2:** Equipe DevOps + Backend
- **Fase 3:** Equipe QA + Monitoramento

### **Escalação de Problemas**
1. **Nível 1:** Desenvolvedor responsável
2. **Nível 2:** Tech Lead
3. **Nível 3:** Arquiteto de Software
4. **Nível 4:** CTO

---

**Documento criado em:** 18 de Setembro de 2025  
**Próxima revisão:** Após conclusão da Fase 1  
**Versão:** 1.0
