# 🚀 PLANO TÉCNICO COMPLETO: PostgreSQL → Supabase

## 📋 VISÃO GERAL

**Objetivo:** Migrar aplicação William Disk Pizza de PostgreSQL nativo para Supabase local, mantendo todas as funcionalidades existentes e preparando para recursos avançados (Auth, Storage, Realtime).

**Tempo Estimado:** 4-6 horas
**Complexidade:** Média
**Risco:** Baixo (com rollback completo)

## 🔄 FASES DA MIGRAÇÃO

### **🔴 FASE 1: BACKUP E ANÁLISE** (30-45 min)
- [ ] Corrigir autenticação PostgreSQL atual
- [ ] Extrair schema completo (15 tabelas)
- [ ] Backup dados críticos (usuários, produtos, pedidos)
- [ ] Documentar ENUMs e constraints
- [ ] Verificar integridade dos dados

**📁 Arquivo:** `migration-phase1-backup.md`

---

### **🐳 FASE 2: SETUP SUPABASE LOCAL** (45-60 min)
- [ ] Instalar Supabase CLI via Chocolatey
- [ ] Configurar Docker Desktop
- [ ] Inicializar projeto: `supabase init`
- [ ] Iniciar serviços: `supabase start`
- [ ] Verificar todos os serviços online
- [ ] Preparar variáveis de ambiente

**📁 Arquivo:** `migration-phase2-supabase-setup.md`

---

### **🏗️ FASE 3: MIGRAÇÃO SCHEMA** (60-90 min)
- [ ] Executar script completo de criação
- [ ] Recriar 15 tabelas principais
- [ ] Configurar ENUMs (user_role, order_status, etc.)
- [ ] Aplicar índices para performance
- [ ] Configurar triggers e funções
- [ ] Verificar estrutura completa

**📁 Arquivo:** `migration-phase3-schema.md`

---

### **📊 FASE 4: MIGRAÇÃO DADOS** (30-45 min)
- [ ] Inserir dados de teste ou reais
- [ ] Verificar contagem de registros
- [ ] Testar integridade referencial
- [ ] Configurar RLS (Row Level Security)
- [ ] Aplicar políticas de segurança
- [ ] Validar dados migrados

**📁 Arquivo:** `migration-phase4-data.md`

---

### **⚙️ FASE 5: CONFIGURAÇÃO APP** (60-90 min)
- [ ] Instalar dependências Supabase
- [ ] Configurar variáveis `.env.local`
- [ ] Criar cliente Supabase
- [ ] Atualizar `lib/db.ts` (compatibilidade)
- [ ] Migrar Auth Context
- [ ] Configurar tipos TypeScript

**📁 Arquivo:** `migration-phase5-app-config.md`

---

### **🧪 FASE 6: TESTES E ROLLBACK** (45-60 min)
- [ ] Testar login admin
- [ ] Verificar dashboard
- [ ] Testar CRUD produtos
- [ ] Testar gestão pedidos
- [ ] Validar sistema entregadores
- [ ] Preparar plano rollback

**📁 Arquivo:** `migration-phase6-testing.md`

---

## 🎯 ESTRUTURA ATUAL IDENTIFICADA

### **Tabelas Principais (15)**
```
✅ auth.users         - Usuários base
✅ profiles           - Perfis e roles
✅ categories         - Categorias produtos
✅ products           - Produtos e preços
✅ drivers            - Sistema entregadores
✅ orders             - Pedidos principais
✅ order_items        - Itens dos pedidos
✅ order_status_history - Histórico status
✅ customer_addresses - Endereços clientes
✅ contact_messages   - Mensagens contato
✅ about_content      - Conteúdo sobre
✅ admin_settings     - Configurações admin
```

### **ENUMs Identificados**
```sql
user_role: 'customer', 'admin', 'kitchen', 'delivery'
order_status: 'RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'
payment_status: 'PENDING', 'PAID', 'FAILED', 'REFUNDED'
payment_method: 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX'
```

### **Sistema Atual**
- ✅ PostgreSQL direto (porta 5432)
- ✅ Autenticação customizada
- ✅ [Sistema de polling para pedidos (sem WebSocket)][[memory:76733126241975131]]
- ✅ Upload de imagens local
- ✅ Admin panel completo

## 🔄 CONFIGURAÇÃO FINAL

### **Conexões Atualizadas**
```env
# Antes
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/williamdiskpizza

# Depois  
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Portas Supabase Local**
```
PostgreSQL: 54322
API Gateway: 54321  
Studio UI: 54323
Inbucket Email: 54324
```

## 🚫 PLANO DE ROLLBACK SEGURO

**Em caso de problemas:**

```powershell
# Rollback rápido (2 minutos)
supabase stop
copy lib\db.ts.backup lib\db.ts
copy contexts\auth-context.tsx.backup contexts\auth-context.tsx
npm uninstall @supabase/supabase-js
npm run dev
```

## 🎉 BENEFÍCIOS ESPERADOS

### **Imediatos**
- ✅ Manter todas as funcionalidades atuais
- ✅ Base para recursos avançados
- ✅ Interface visual (Supabase Studio)
- ✅ Infraestrutura mais robusta

### **Futuros**
- 🔄 **Realtime:** Substituir polling por WebSockets
- 🔐 **Auth:** Social login, magic links
- 📁 **Storage:** CDN automático para imagens
- ☁️ **Cloud:** Migração para produção
- 📊 **Analytics:** Métricas built-in

## ⚠️ CONSIDERAÇÕES IMPORTANTES

1. **[Manter PostgreSQL direto sem Supabase era preferência anterior][[memory:4982292085434957309]]** - Esta migração é uma mudança de arquitetura
2. **Backup obrigatório** antes de qualquer alteração
3. **Teste em ambiente local** antes de produção
4. **Rollback preparado** para qualquer problema
5. **Funcionalidades existentes preservadas**

## 🚀 COMANDO DE INÍCIO

```powershell
# Para começar a migração:
cd C:\williamdiskpizza

# Verifique se está tudo funcionando antes:
npm run dev

# Pare a aplicação e inicie a Fase 1
# Seguir exatamente a ordem dos arquivos de fase
```

---

**📞 Em caso de dúvidas:** Interrompa o processo e solicite esclarecimentos antes de prosseguir.

**🎯 Próximo passo:** Executar `migration-phase1-backup.md` 