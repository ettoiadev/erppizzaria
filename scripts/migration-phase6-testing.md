# FASE 6: TESTES E ROLLBACK

## 🧪 Testes Completos da Migração

### 6.1 Iniciar Aplicação com Supabase

```powershell
cd C:\williamdiskpizza

# Verificar se Supabase está rodando
supabase status

# Iniciar aplicação
npm run dev
```

### 6.2 Testes de Funcionalidade

#### ✅ **Teste 1: Autenticação Admin**

1. Acesse: `http://localhost:3000/admin/login`
2. Use credenciais:
   - Email: `admin@williamdiskpizza.com`
   - Senha: `admin123`
3. Verificar redirecionamento para dashboard
4. **✅ Resultado esperado:** Login bem-sucedido

#### ✅ **Teste 2: Dashboard Admin**

1. Acesse: `http://localhost:3000/admin`
2. Verificar carregamento de dados:
   - Total de pedidos
   - Total de clientes
   - Receita total
   - Gráficos funcionando
3. **✅ Resultado esperado:** Dados carregando do Supabase

#### ✅ **Teste 3: Gestão de Produtos**

1. Acesse: `http://localhost:3000/admin/produtos`
2. Verificar listagem de produtos
3. Testar criação de novo produto
4. Testar edição de produto existente
5. **✅ Resultado esperado:** CRUD funcionando

#### ✅ **Teste 4: Gestão de Pedidos**

1. Acesse: `http://localhost:3000/admin/pedidos`
2. Verificar listagem de pedidos
3. Testar mudança de status
4. Testar atribuição de entregador
5. **✅ Resultado esperado:** Gestão funcionando

#### ✅ **Teste 5: Sistema de Entregadores**

1. Acesse: `http://localhost:3000/admin/entregadores`
2. Verificar listagem de entregadores
3. Testar cadastro de novo entregador
4. Testar mudança de status (disponível/ocupado)
5. **✅ Resultado esperado:** Sistema funcionando

#### ✅ **Teste 6: Cadastro de Cliente**

1. Acesse: `http://localhost:3000/cadastro`
2. Criar nova conta de cliente
3. Verificar email de confirmação
4. Testar login do cliente
5. **✅ Resultado esperado:** Cadastro funcionando

#### ✅ **Teste 7: Processo de Pedido**

1. Acesse: `http://localhost:3000/cardapio`
2. Adicionar produtos ao carrinho
3. Prosseguir para checkout
4. Finalizar pedido
5. Verificar pedido no admin
6. **✅ Resultado esperado:** Fluxo completo funcionando

#### ✅ **Teste 8: Realtime (Futuro)**

```typescript
// Teste de subscription em tempo real
// Para implementar após migração básica
const testRealtime = () => {
  const subscription = supabase
    .channel('orders')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('Novo pedido:', payload.new)
        // Mostrar notificação
      }
    )
    .subscribe()
}
```

### 6.3 Verificação de Performance

```sql
-- Execute no Supabase Studio para verificar performance
-- Queries mais demoradas
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Verificar índices sendo usados
SELECT 
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### 6.4 Testes de Carga Básicos

```powershell
# Teste simples de requisições
# Instalar se necessário: npm install -g artillery

# Criar arquivo test-load.yml
echo "config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: 'Browse products'
    requests:
      - get:
          url: '/cardapio'
      - get:
          url: '/api/products'" > test-load.yml

# Executar teste
artillery run test-load.yml
```

## 🔄 PLANO DE ROLLBACK

### 6.5 Rollback Automático

**Se algo der errado, execute imediatamente:**

```powershell
cd C:\williamdiskpizza

# 1. Parar Supabase
supabase stop

# 2. Restaurar arquivos originais
copy lib\db.ts.backup lib\db.ts
copy contexts\auth-context.tsx.backup contexts\auth-context.tsx

# 3. Restaurar .env original (se existia)
# copy .env.local.backup .env.local

# 4. Remover dependências Supabase
npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react

# 5. Reinstalar dependências originais
npm install

# 6. Verificar PostgreSQL original
node -e "const { Pool } = require('pg'); const pool = new Pool({connectionString: 'postgresql://postgres:postgres@localhost:5432/williamdiskpizza'}); pool.query('SELECT NOW()').then(() => console.log('PostgreSQL original OK')).catch(err => console.log('Erro:', err.message)).finally(() => pool.end())"

# 7. Iniciar aplicação original
npm run dev
```

### 6.6 Restaurar Dados (Se Necessário)

```sql
-- No pgAdmin4, se precisar restaurar dados
-- Usar os backups da Fase 1

-- Exemplo:
-- TRUNCATE TABLE orders CASCADE;
-- COPY orders FROM '/caminho/para/backup_orders.csv' CSV HEADER;
```

### 6.7 Checklist de Rollback ✅

- [ ] Supabase parado
- [ ] Arquivos originais restaurados
- [ ] Dependências originais reinstaladas
- [ ] PostgreSQL original funcionando
- [ ] Aplicação rodando normalmente
- [ ] Dados intactos
- [ ] Funcionalidades testadas

## 📊 RELATÓRIO FINAL

### 6.8 Checklist Migração Completa ✅

**Infraestrutura:**
- [ ] Supabase local funcionando
- [ ] Docker containers saudáveis
- [ ] PostgreSQL na porta 54322
- [ ] API Gateway na porta 54321
- [ ] Studio na porta 54323

**Dados:**
- [ ] Schema migrado 100%
- [ ] Dados importados
- [ ] Integridade referencial OK
- [ ] Índices funcionando
- [ ] Triggers ativos

**Aplicação:**
- [ ] Dependências instaladas
- [ ] Configuração atualizada
- [ ] Autenticação funcionando
- [ ] APIs funcionando
- [ ] Frontend funcionando

**Funcionalidades:**
- [ ] Login admin OK
- [ ] Dashboard carregando
- [ ] CRUD produtos OK
- [ ] Gestão pedidos OK
- [ ] Sistema entregadores OK
- [ ] Cadastro cliente OK
- [ ] Processo compra OK

**Performance:**
- [ ] Queries otimizadas
- [ ] Tempo resposta < 500ms
- [ ] Sem memory leaks
- [ ] Logs limpos

### 6.9 Próximos Passos (Pós-Migração)

1. **Implementar Supabase Realtime** 
   - Substituir polling por subscriptions
   - Notificações em tempo real

2. **Configurar Supabase Auth**
   - Migrar para auth nativo do Supabase
   - Social logins (Google, Facebook)

3. **Supabase Storage**
   - Migrar uploads para Supabase Storage
   - CDN automático

4. **Preparar para Cloud**
   - Configurar projeto Supabase Cloud
   - Migração para produção

**🎉 Migração Concluída com Sucesso!** 