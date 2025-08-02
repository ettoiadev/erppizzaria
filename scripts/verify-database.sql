-- Script de Verificação Completa do Banco williamdiskpizza
-- Execute este script no pgAdmin4 para verificar se tudo está correto

\echo '🔍 INICIANDO VERIFICAÇÃO COMPLETA DO BANCO williamdiskpizza'
\echo '================================================================'

-- 1. INFORMAÇÕES BÁSICAS DO BANCO
\echo '\n📋 1. INFORMAÇÕES BÁSICAS'
SELECT 
    'Banco de Dados' as info,
    current_database() as valor
UNION ALL
SELECT 
    'Versão PostgreSQL',
    version()
UNION ALL
SELECT 
    'Data/Hora Atual',
    NOW()::text
UNION ALL
SELECT 
    'Usuário Atual',
    current_user;

-- 2. VERIFICAR EXTENSÕES NECESSÁRIAS
\echo '\n🔧 2. EXTENSÕES INSTALADAS'
SELECT 
    extname as "Extensão",
    extversion as "Versão",
    CASE WHEN extname IN ('uuid-ossp', 'pgcrypto') THEN '✅ Necessária' ELSE '⚠️ Opcional' END as "Status"
FROM pg_extension
ORDER BY extname;

-- Verificar se extensões obrigatórias estão instaladas
SELECT 
    CASE 
        WHEN COUNT(*) FILTER (WHERE extname = 'uuid-ossp') > 0 THEN '✅ uuid-ossp instalada'
        ELSE '❌ uuid-ossp FALTANDO - Execute: CREATE EXTENSION "uuid-ossp";'
    END as "UUID Extension",
    CASE 
        WHEN COUNT(*) FILTER (WHERE extname = 'pgcrypto') > 0 THEN '✅ pgcrypto instalada'
        ELSE '❌ pgcrypto FALTANDO - Execute: CREATE EXTENSION "pgcrypto";'
    END as "Crypto Extension"
FROM pg_extension;

-- 3. VERIFICAR SCHEMAS
\echo '\n📁 3. SCHEMAS EXISTENTES'
SELECT 
    schema_name as "Schema",
    CASE 
        WHEN schema_name = 'public' THEN '✅ Principal'
        WHEN schema_name = 'auth' THEN '✅ Autenticação'
        ELSE '⚠️ Outros'
    END as "Status"
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- 4. VERIFICAR TIPOS PERSONALIZADOS (ENUMs)
\echo '\n🏷️ 4. TIPOS PERSONALIZADOS (ENUMs)'
SELECT 
    t.typname as "Tipo",
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as "Valores",
    CASE 
        WHEN t.typname = 'order_status' THEN '✅ Obrigatório'
        WHEN t.typname = 'payment_method' THEN '✅ Obrigatório'
        WHEN t.typname = 'payment_status' THEN '✅ Obrigatório'
        ELSE '⚠️ Opcional'
    END as "Status"
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
GROUP BY t.typname
ORDER BY t.typname;

-- Verificar valores específicos dos ENUMs
\echo '\n🔍 4.1. VERIFICAÇÃO DETALHADA DOS ENUMs'

-- Order Status
SELECT 
    'order_status' as "Enum",
    enumlabel as "Valor",
    CASE 
        WHEN enumlabel IN ('PENDING', 'RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') 
        THEN '✅ OK' 
        ELSE '⚠️ Extra' 
    END as "Status"
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
ORDER BY enumsortorder;

-- Payment Method
SELECT 
    'payment_method' as "Enum",
    enumlabel as "Valor",
    CASE 
        WHEN enumlabel IN ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'MERCADO_PAGO') 
        THEN '✅ OK' 
        ELSE '⚠️ Extra' 
    END as "Status"
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method')
ORDER BY enumsortorder;

-- Payment Status
SELECT 
    'payment_status' as "Enum",
    enumlabel as "Valor",
    CASE 
        WHEN enumlabel IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') 
        THEN '✅ OK' 
        ELSE '⚠️ Extra' 
    END as "Status"
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status')
ORDER BY enumsortorder;

-- 5. VERIFICAR TABELAS OBRIGATÓRIAS
\echo '\n📊 5. TABELAS PRINCIPAIS'
WITH required_tables AS (
    SELECT unnest(ARRAY[
        'profiles', 'categories', 'products', 'orders', 'order_items',
        'admin_settings', 'customer_addresses', 'drivers', 'contact_messages'
    ]) as table_name
),
existing_tables AS (
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public'
)
SELECT 
    rt.table_name as "Tabela",
    CASE 
        WHEN et.table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ FALTANDO'
    END as "Status",
    CASE 
        WHEN rt.table_name IN ('profiles', 'orders', 'order_items', 'categories', 'products') THEN 'Crítica'
        ELSE 'Importante'
    END as "Prioridade"
FROM required_tables rt
LEFT JOIN existing_tables et ON rt.table_name = et.table_name
ORDER BY 
    CASE WHEN et.table_name IS NULL THEN 0 ELSE 1 END,
    rt.table_name;

-- 6. VERIFICAR ESTRUTURA DA TABELA ORDERS (CRÍTICA)
\echo '\n🍕 6. ESTRUTURA DA TABELA ORDERS'
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Nulo?",
    column_default as "Padrão",
    CASE 
        WHEN column_name IN ('id', 'user_id', 'status', 'total', 'payment_method', 'delivery_address', 'created_at') 
        THEN '✅ Obrigatória'
        WHEN column_name IN ('customer_name', 'customer_phone', 'payment_status', 'subtotal', 'delivery_fee')
        THEN '✅ Importante'
        ELSE '⚠️ Opcional'
    END as "Importância"
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. VERIFICAR ESTRUTURA DA TABELA ORDER_ITEMS
\echo '\n📝 7. ESTRUTURA DA TABELA ORDER_ITEMS'
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Nulo?",
    CASE 
        WHEN column_name IN ('id', 'order_id', 'name', 'quantity', 'unit_price', 'total_price') 
        THEN '✅ Obrigatória'
        ELSE '⚠️ Opcional'
    END as "Importância"
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. VERIFICAR ESTRUTURA DA TABELA PROFILES
\echo '\n👤 8. ESTRUTURA DA TABELA PROFILES'
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Nulo?",
    CASE 
        WHEN column_name IN ('id', 'email', 'full_name', 'role', 'password_hash') 
        THEN '✅ Obrigatória'
        ELSE '⚠️ Opcional'
    END as "Importância"
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. VERIFICAR CHAVES ESTRANGEIRAS
\echo '\n🔗 9. CHAVES ESTRANGEIRAS'
SELECT 
    tc.table_name as "Tabela",
    kcu.column_name as "Coluna",
    ccu.table_name as "Referencia_Tabela",
    ccu.column_name as "Referencia_Coluna",
    tc.constraint_name as "Nome_Constraint"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 10. VERIFICAR ÍNDICES IMPORTANTES
\echo '\n📈 10. ÍNDICES IMPORTANTES'
SELECT 
    schemaname as "Schema",
    tablename as "Tabela",
    indexname as "Índice",
    CASE 
        WHEN indexname LIKE '%_pkey' THEN '✅ Chave Primária'
        WHEN indexname LIKE 'idx_orders_%' THEN '✅ Performance Orders'
        WHEN indexname LIKE 'idx_profiles_%' THEN '✅ Performance Profiles'
        ELSE '⚠️ Outros'
    END as "Tipo"
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items', 'profiles', 'products', 'categories')
ORDER BY tablename, indexname;

-- 11. VERIFICAR DADOS EXISTENTES
\echo '\n📊 11. CONTAGEM DE DADOS'
SELECT 
    'profiles' as "Tabela",
    COUNT(*) as "Registros",
    CASE WHEN COUNT(*) > 0 THEN '✅ Com dados' ELSE '⚠️ Vazia' END as "Status"
FROM profiles
UNION ALL
SELECT 'categories', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ Com dados' ELSE '⚠️ Vazia' END FROM categories
UNION ALL
SELECT 'products', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ Com dados' ELSE '⚠️ Vazia' END FROM products
UNION ALL
SELECT 'orders', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ Com dados' ELSE '⚠️ Vazia' END FROM orders
UNION ALL
SELECT 'order_items', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ Com dados' ELSE '⚠️ Vazia' END FROM order_items
UNION ALL
SELECT 'admin_settings', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ Com dados' ELSE '⚠️ Vazia' END FROM admin_settings;

-- 12. VERIFICAR USUÁRIO ADMIN
\echo '\n👨‍💼 12. USUÁRIO ADMINISTRADOR'
SELECT 
    email as "Email",
    full_name as "Nome",
    role as "Função",
    CASE 
        WHEN password_hash IS NOT NULL AND LENGTH(password_hash) > 10 THEN '✅ Senha OK'
        ELSE '❌ Senha Inválida'
    END as "Senha",
    created_at as "Criado em"
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- 13. VERIFICAR CONFIGURAÇÕES ADMIN
\echo '\n⚙️ 13. CONFIGURAÇÕES ADMINISTRATIVAS'
SELECT 
    setting_key as "Configuração",
    setting_value as "Valor",
    CASE 
        WHEN setting_key IN ('allowAdminRegistration', 'deliveryFee', 'storeOpen') THEN '✅ Importante'
        ELSE '⚠️ Opcional'
    END as "Importância"
FROM admin_settings
ORDER BY setting_key;

-- 14. VERIFICAR TRIGGERS E FUNÇÕES
\echo '\n⚡ 14. TRIGGERS E FUNÇÕES'
SELECT 
    trigger_name as "Trigger",
    event_object_table as "Tabela",
    action_timing as "Quando",
    event_manipulation as "Evento"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 15. VERIFICAR PERMISSÕES
\echo '\n🔐 15. PERMISSÕES DO USUÁRIO ATUAL'
SELECT 
    table_name as "Tabela",
    privilege_type as "Permissão",
    is_grantable as "Pode Conceder?"
FROM information_schema.role_table_grants
WHERE grantee = current_user
AND table_schema = 'public'
AND table_name IN ('orders', 'order_items', 'profiles', 'categories', 'products')
ORDER BY table_name, privilege_type;

-- 16. RESUMO FINAL
\echo '\n📋 16. RESUMO DA VERIFICAÇÃO'
WITH verification_summary AS (
    SELECT 
        'Extensões UUID' as item,
        CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN 1 ELSE 0 END as status
    UNION ALL
    SELECT 
        'Tabelas Principais',
        CASE WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('profiles', 'orders', 'order_items', 'categories', 'products')
        ) = 5 THEN 1 ELSE 0 END
    UNION ALL
    SELECT 
        'ENUMs Configurados',
        CASE WHEN (
            SELECT COUNT(*) FROM pg_type 
            WHERE typname IN ('order_status', 'payment_method', 'payment_status')
        ) = 3 THEN 1 ELSE 0 END
    UNION ALL
    SELECT 
        'Usuário Admin',
        CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE role = 'admin') THEN 1 ELSE 0 END
    UNION ALL
    SELECT 
        'Dados de Categoria',
        CASE WHEN EXISTS(SELECT 1 FROM categories) THEN 1 ELSE 0 END
)
SELECT 
    item as "Item Verificado",
    CASE 
        WHEN status = 1 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END as "Status",
    CASE 
        WHEN status = 1 THEN 'Configurado corretamente'
        ELSE 'Precisa de correção'
    END as "Observação"
FROM verification_summary;

\echo '\n🎉 VERIFICAÇÃO COMPLETA FINALIZADA!'
\echo '================================================================'
\echo 'Se todos os itens críticos estão com ✅, o banco está pronto!'
\echo 'Itens com ❌ precisam ser corrigidos antes de rodar a aplicação.'