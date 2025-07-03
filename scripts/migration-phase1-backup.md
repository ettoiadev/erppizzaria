# FASE 1: BACKUP COMPLETO DO BANCO ATUAL

## ⚠️ CRÍTICO: Execute ANTES de qualquer migração

### 1.1 Corrigir Autenticação PostgreSQL

O erro `autenticação do tipo senha falhou` indica problema de configuração.

**Execute no pgAdmin4:**

```sql
-- 1. Verificar usuários existentes
SELECT usename, usesuper, usecreatedb FROM pg_user;

-- 2. Alterar senha do postgres se necessário
ALTER USER postgres PASSWORD 'postgres';

-- 3. Testar conexão
SELECT 'Conexão OK - ' || current_database() as status, now() as timestamp;
```

### 1.2 Extrair Schema Completo

**Execute no pgAdmin4 - Query Tool:**

```sql
-- Verificar todas as tabelas
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
ORDER BY table_name;

-- Verificar ENUMs
SELECT 
    typname,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typcategory = 'E'
GROUP BY typname;

-- Verificar constraints
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 1.3 Backup dos Dados

**Execute CADA comando separadamente no pgAdmin4:**

```sql
-- Contar registros
SELECT 'auth.users: ' || count(*) FROM auth.users;
SELECT 'profiles: ' || count(*) FROM profiles;
SELECT 'categories: ' || count(*) FROM categories;
SELECT 'products: ' || count(*) FROM products;
SELECT 'orders: ' || count(*) FROM orders;
SELECT 'order_items: ' || count(*) FROM order_items;
SELECT 'drivers: ' || count(*) FROM drivers;
SELECT 'customer_addresses: ' || count(*) FROM customer_addresses;
```

### 1.4 Exportar Dados Críticos

**Para cada tabela, execute:**

```sql
-- Backup usuários
COPY (
    SELECT 
        id, email, created_at, updated_at
    FROM auth.users
) TO '/tmp/backup_users.csv' CSV HEADER;

-- Backup perfis  
COPY (
    SELECT 
        id, email, full_name, phone, role, password_hash, 
        email_verified, profile_completed, created_at
    FROM profiles
) TO '/tmp/backup_profiles.csv' CSV HEADER;

-- Backup produtos
COPY (
    SELECT 
        id, name, description, price, category_id, 
        image, active, created_at
    FROM products
) TO '/tmp/backup_products.csv' CSV HEADER;

-- Backup pedidos (últimos 30 dias)
COPY (
    SELECT *
    FROM orders 
    WHERE created_at >= NOW() - INTERVAL '30 days'
) TO '/tmp/backup_orders.csv' CSV HEADER;
```

### 1.5 Checklist de Backup ✅

- [ ] Conexão PostgreSQL funcionando
- [ ] Schema completo exportado
- [ ] Dados de usuários salvos
- [ ] Dados de produtos salvos  
- [ ] Dados de pedidos salvos
- [ ] ENUMs documentados
- [ ] Constraints documentadas
- [ ] Backup testado com restore

**💾 Salve todos os arquivos em pasta segura antes de continuar!** 