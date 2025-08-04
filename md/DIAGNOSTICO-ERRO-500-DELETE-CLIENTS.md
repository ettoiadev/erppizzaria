# 🔍 Diagnóstico do Erro 500 - API Delete Clients

## 📋 Problema Identificado

A API `/api/admin/data-management/delete-clients` está retornando erro 500 (Internal Server Error) quando tentamos excluir todos os clientes.

### Erro no Console:
```
DELETE http://localhost:3000/api/admin/data-management/delete-clients 500 (Internal Server Error)
```

## 🧪 Passos para Diagnóstico

### 1. **Testar Conexão com Banco de Dados**

Acesse: `http://localhost:3000/api/test-db-connection`

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Conexão com banco de dados funcionando",
  "database": {
    "connected": true,
    "version": "PostgreSQL 16.0...",
    "currentTime": "2025-01-XX..."
  },
  "tables": {
    "total": 15,
    "list": ["profiles", "orders", "products", ...],
    "profilesExists": true,
    "profilesStructure": [...],
    "profilesCount": 2
  }
}
```

### 2. **Testar API Simplificada**

Acesse: `http://localhost:3000/api/test-delete-clients`

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Teste concluído. Encontrados X clientes.",
  "totalClients": 2
}
```

### 3. **Verificar Variáveis de Ambiente**

Verifique se o arquivo `.env.local` contém:
```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/williamdiskpizza
JWT_SECRET=sua_chave_secreta_aqui
```

### 4. **Verificar Estrutura do Banco**

Execute no PostgreSQL:
```sql
-- Verificar se a tabela profiles existe
SELECT table_name FROM information_schema.tables WHERE table_name = 'profiles';

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar se há dados
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers
FROM profiles;
```

## 🔧 Possíveis Causas e Soluções

### **Causa 1: DATABASE_URL não configurada**

**Sintoma:** Erro de conexão
**Solução:** Configurar `.env.local` com a URL correta do PostgreSQL

### **Causa 2: Tabela profiles não existe**

**Sintoma:** Erro "relation 'profiles' does not exist"
**Solução:** Executar script de criação da tabela:
```bash
# Execute no PostgreSQL
\i scripts/setup-postgresql-complete.sql
```

### **Causa 3: Token de autenticação inválido**

**Sintoma:** Erro 401 ou 403
**Solução:** Verificar se o token está sendo enviado corretamente

### **Causa 4: Tabelas relacionadas não existem**

**Sintoma:** Erro ao deletar customer_addresses ou user_coupons
**Solução:** A API agora verifica se as tabelas existem antes de tentar deletar

### **Causa 5: Problema de permissões no banco**

**Sintoma:** Erro de permissão
**Solução:** Verificar se o usuário do banco tem permissões adequadas

## 🛠️ Correções Implementadas

### **1. Logs Detalhados**
```typescript
console.log('[DELETE_CLIENTS] Token recebido:', token ? 'SIM' : 'NÃO')
console.log('[DELETE_CLIENTS] Verificando admin...')
console.log('[DELETE_CLIENTS] Admin verificado:', admin.email)
console.log('[DELETE_CLIENTS] Verificando se a tabela profiles existe...')
```

### **2. Verificação de Tabelas**
```typescript
const tableExists = await query(`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'profiles'
  ) as exists
`)
```

### **3. Tratamento de Erros Melhorado**
```typescript
catch (error: any) {
  console.error('[DELETE_CLIENTS] Erro:', error)
  console.error('[DELETE_CLIENTS] Stack trace:', error.stack)
  return NextResponse.json({ 
    error: 'Erro ao excluir todos os clientes',
    details: error.message,
    stack: error.stack
  }, { status: 500 })
}
```

## 🧪 Como Testar

### **1. Teste Manual via Browser:**
1. Acesse `http://localhost:3000/api/test-db-connection`
2. Verifique se a conexão está funcionando
3. Acesse `http://localhost:3000/api/test-delete-clients`
4. Verifique se a autenticação está funcionando

### **2. Teste via Interface:**
1. Acesse `http://localhost:3000/admin`
2. Vá em "Configurações" → "Gerenciamento de Dados"
3. Tente excluir clientes
4. Verifique os logs no console do navegador

### **3. Teste via Script:**
```bash
# Instalar dependência
npm install node-fetch

# Executar teste
node scripts/test-delete-clients.js
```

## 📊 Logs para Monitorar

### **Logs de Sucesso:**
```
[DELETE_CLIENTS] Iniciando exclusão de todos os clientes...
[DELETE_CLIENTS] Token recebido: SIM
[DELETE_CLIENTS] Verificando admin...
[DELETE_CLIENTS] Admin verificado: admin@pizzaria.com
[DELETE_CLIENTS] Verificando se a tabela profiles existe...
[DELETE_CLIENTS] Tabela profiles existe
[DELETE_CLIENTS] Encontrados 2 clientes
[DELETE_CLIENTS] 2 clientes deletados completamente
```

### **Logs de Erro:**
```
[DELETE_CLIENTS] Erro ao deletar todos os clientes: Error: relation 'profiles' does not exist
[DELETE_CLIENTS] Stack trace: Error: relation 'profiles' does not exist
```

## 🔄 Próximos Passos

1. **Executar testes de diagnóstico**
2. **Verificar logs detalhados**
3. **Corrigir problemas identificados**
4. **Testar novamente a funcionalidade**

---

**Status**: 🔍 **EM DIAGNÓSTICO**  
**Data**: $(date)  
**Versão**: 1.0.0 