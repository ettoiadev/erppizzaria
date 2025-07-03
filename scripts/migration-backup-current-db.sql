-- BACKUP COMPLETO DO BANCO WILLIAMDISKPIZZA
-- Execute este script no pgAdmin4 para fazer backup antes da migração

-- ============================================================
-- FASE 1: BACKUP DA ESTRUTURA (DDL)
-- ============================================================

-- 1. Gerar script de criação de todas as tabelas
SELECT 'CREATE SCHEMA IF NOT EXISTS auth;' as backup_command
UNION ALL
SELECT 
    'CREATE TABLE IF NOT EXISTS ' || schemaname || '.' || tablename || ' (' ||
    array_to_string(
        array(
            SELECT column_name || ' ' || data_type || 
                   CASE 
                       WHEN character_maximum_length IS NOT NULL 
                       THEN '(' || character_maximum_length || ')'
                       WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL
                       THEN '(' || numeric_precision || ',' || numeric_scale || ')'
                       ELSE ''
                   END ||
                   CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
                   CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END
            FROM information_schema.columns 
            WHERE table_name = t.tablename 
            ORDER BY ordinal_position
        ), ', '
    ) || ');'
FROM pg_tables t
WHERE schemaname IN ('public', 'auth')
ORDER BY tablename;

-- 2. Gerar script de criação de índices
SELECT 
    'CREATE INDEX IF NOT EXISTS ' || indexname || ' ON ' || tablename || 
    ' USING ' || substr(indexdef, position('USING' in indexdef) + 6) || ';'
FROM pg_indexes 
WHERE schemaname IN ('public', 'auth')
AND indexname NOT LIKE '%_pkey';

-- 3. Gerar script de criação de ENUMs
SELECT 
    'CREATE TYPE ' || typname || ' AS ENUM (' ||
    array_to_string(
        array(
            SELECT '''' || enumlabel || ''''
            FROM pg_enum e2
            WHERE e2.enumtypid = t.oid
            ORDER BY e2.enumsortorder
        ), ', '
    ) || ');'
FROM pg_type t
WHERE typcategory = 'E';

-- ============================================================
-- FASE 2: BACKUP DOS DADOS (DML)
-- ============================================================

-- 4. Contar registros por tabela
SELECT 
    'Tabela: ' || tablename || ' - Registros: ' || 
    (xpath('/row/c/text()', query_to_xml('SELECT count(*) as c FROM ' || tablename, false, true, '')))[1]::text
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Gerar comandos INSERT para tabelas principais
-- Execute separadamente para cada tabela:

-- BACKUP auth.users
COPY (SELECT 'INSERT INTO auth.users (id, email, created_at, updated_at) VALUES (''' || 
             id || ''', ''' || email || ''', ''' || created_at || ''', ''' || updated_at || ''');'
      FROM auth.users) TO STDOUT;

-- BACKUP profiles
COPY (SELECT 'INSERT INTO profiles (id, email, full_name, phone, role, password_hash, email_verified, profile_completed, last_login, created_at, updated_at) VALUES (''' || 
             id || ''', ''' || email || ''', ''' || full_name || ''', ''' || 
             COALESCE(phone, '') || ''', ''' || role || ''', ''' || password_hash || ''', ' || 
             email_verified || ', ' || profile_completed || ', ' || 
             CASE WHEN last_login IS NULL THEN 'NULL' ELSE '''' || last_login || '''' END || ', ''' || 
             created_at || ''', ''' || updated_at || ''');'
      FROM profiles) TO STDOUT;

-- BACKUP categories
COPY (SELECT 'INSERT INTO categories (id, name, description, active, created_at, updated_at) VALUES (''' || 
             id || ''', ''' || name || ''', ''' || COALESCE(description, '') || ''', ' || 
             active || ', ''' || created_at || ''', ''' || updated_at || ''');'
      FROM categories) TO STDOUT;

-- BACKUP products
COPY (SELECT 'INSERT INTO products (id, name, description, price, category_id, image, active, created_at, updated_at) VALUES (''' || 
             id || ''', ''' || replace(name, '''', '''''') || ''', ''' || 
             COALESCE(replace(description, '''', ''''''), '') || ''', ' || price || ', ''' || 
             COALESCE(category_id::text, 'NULL') || ''', ''' || COALESCE(image, '') || ''', ' || 
             active || ', ''' || created_at || ''', ''' || updated_at || ''');'
      FROM products) TO STDOUT;

-- BACKUP orders (últimos 30 dias)
COPY (SELECT 'INSERT INTO orders (id, user_id, status, total, subtotal, delivery_fee, discount, payment_method, payment_status, delivery_address, delivery_phone, delivery_instructions, estimated_delivery_time, delivered_at, cancelled_at, cancellation_reason, created_at, updated_at) VALUES (''' || 
             id || ''', ''' || COALESCE(user_id::text, 'NULL') || ''', ''' || status || ''', ' || 
             total || ', ' || subtotal || ', ' || delivery_fee || ', ' || discount || ', ''' || 
             payment_method || ''', ''' || payment_status || ''', ''' || 
             replace(delivery_address, '''', '''''') || ''', ''' || delivery_phone || ''', ''' || 
             COALESCE(replace(delivery_instructions, '''', ''''''), '') || ''', ' ||
             CASE WHEN estimated_delivery_time IS NULL THEN 'NULL' ELSE '''' || estimated_delivery_time || '''' END || ', ' ||
             CASE WHEN delivered_at IS NULL THEN 'NULL' ELSE '''' || delivered_at || '''' END || ', ' ||
             CASE WHEN cancelled_at IS NULL THEN 'NULL' ELSE '''' || cancelled_at || '''' END || ', ''' ||
             COALESCE(replace(cancellation_reason, '''', ''''''), '') || ''', ''' || 
             created_at || ''', ''' || updated_at || ''');'
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '30 days') TO STDOUT;

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================

/*
INSTRUÇÕES PARA EXECUTAR O BACKUP:

1. Abra o pgAdmin4
2. Conecte ao banco williamdiskpizza
3. Abra o Query Tool
4. Execute cada seção separadamente
5. Salve os resultados em arquivos .sql separados:
   - backup-schema.sql (estrutura)
   - backup-data.sql (dados)
   
6. Mantenha estes backups seguros antes de prosseguir!
*/

-- 1. Verificar tabelas existentes
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Contar registros por tabela
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Inserções",
    n_tup_upd as "Atualizações", 
    n_tup_del as "Exclusões"
FROM pg_stat_user_tables
ORDER BY tablename;

-- 3. Backup dos dados principais (execute separadamente)
-- USUARIOS
SELECT 'Backup de ' || count(*) || ' usuários' FROM auth.users;
SELECT 'Backup de ' || count(*) || ' perfis' FROM profiles;

-- PRODUTOS
SELECT 'Backup de ' || count(*) || ' categorias' FROM categories;
SELECT 'Backup de ' || count(*) || ' produtos' FROM products;

-- PEDIDOS
SELECT 'Backup de ' || count(*) || ' pedidos' FROM orders;
SELECT 'Backup de ' || count(*) || ' itens de pedido' FROM order_items;

-- 4. Exportar dados em formato SQL
-- Execute no terminal do pgAdmin para exportar:
-- pg_dump -h localhost -U postgres -d williamdiskpizza --schema=public --data-only > backup-data.sql
-- pg_dump -h localhost -U postgres -d williamdiskpizza --schema=public --schema-only > backup-schema.sql 