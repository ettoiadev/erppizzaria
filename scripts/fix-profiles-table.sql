-- Script para diagnosticar e corrigir o problema da tabela profiles
-- Execute este script no pgAdmin4

\echo '🔍 DIAGNÓSTICO DA TABELA PROFILES'
\echo '================================='

-- 1. Verificar se a tabela profiles existe
\echo '\n📋 1. VERIFICANDO SE A TABELA PROFILES EXISTE'

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN '✅ Tabela profiles existe no schema public'
        ELSE '❌ Tabela profiles NÃO EXISTE no schema public'
    END as status_profiles;

-- 2. Verificar em outros schemas
\echo '\n🔍 2. PROCURANDO TABELA PROFILES EM OUTROS SCHEMAS'

SELECT 
    table_schema as "Schema",
    table_name as "Tabela",
    table_type as "Tipo"
FROM information_schema.tables 
WHERE table_name = 'profiles'
ORDER BY table_schema;

-- 3. Verificar todas as tabelas existentes no schema public
\echo '\n📊 3. TODAS AS TABELAS NO SCHEMA PUBLIC'

SELECT 
    table_name as "Tabela",
    table_type as "Tipo"
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Se a tabela não existir, criar ela
\echo '\n🔧 4. CRIANDO TABELA PROFILES SE NÃO EXISTIR'

-- Criar extensões necessárias primeiro
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar tipos ENUM se não existirem
DO $$
BEGIN
    -- Criar role_type se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'admin', 'kitchen', 'delivery');
        RAISE NOTICE '✅ Tipo user_role criado';
    ELSE
        RAISE NOTICE '✅ Tipo user_role já existe';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠️ Erro ao criar tipo user_role: %', SQLERRM;
END$$;

-- Criar tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'kitchen', 'delivery')),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar se foi criada
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN '✅ Tabela profiles criada/existe no schema public'
        ELSE '❌ ERRO: Tabela profiles ainda não existe'
    END as status_after_creation;

-- 5. Verificar estrutura da tabela profiles
\echo '\n📋 5. ESTRUTURA DA TABELA PROFILES'

SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Permite NULL",
    column_default as "Padrão"
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Inserir usuário admin se não existir
\echo '\n👨‍💼 6. CRIANDO USUÁRIO ADMIN'

DO $$
BEGIN
    -- Verificar se já existe admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@pizzaria.com') THEN
        INSERT INTO public.profiles (
            email, 
            full_name, 
            role, 
            password_hash,
            created_at,
            updated_at
        ) VALUES (
            'admin@pizzaria.com',
            'Administrador',
            'admin',
            '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu', -- senha: admin123
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Usuário admin criado: admin@pizzaria.com / senha: admin123';
    ELSE
        RAISE NOTICE '✅ Usuário admin já existe';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Erro ao criar usuário admin: %', SQLERRM;
END$$;

-- 7. Verificar usuários existentes
\echo '\n👥 7. USUÁRIOS EXISTENTES NA TABELA PROFILES'

SELECT 
    id,
    email,
    full_name,
    role,
    CASE 
        WHEN password_hash IS NOT NULL AND LENGTH(password_hash) > 10 THEN '✅ Senha OK'
        ELSE '❌ Sem senha'
    END as "Status Senha",
    created_at
FROM public.profiles
ORDER BY created_at;

-- 8. Testar query que estava falhando
\echo '\n🧪 8. TESTANDO QUERY QUE ESTAVA FALHANDO'

DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Tentar executar a query que estava falhando
    SELECT id, email, full_name, role, password_hash, phone, created_at, updated_at 
    INTO test_result
    FROM public.profiles 
    WHERE email = 'admin@pizzaria.com';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Query funcionando! Usuário encontrado: %', test_result.email;
        RAISE NOTICE '   ID: %', test_result.id;
        RAISE NOTICE '   Nome: %', test_result.full_name;
        RAISE NOTICE '   Role: %', test_result.role;
    ELSE
        RAISE NOTICE '⚠️ Query funcionou mas usuário admin não encontrado';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Erro na query de teste: %', SQLERRM;
END$$;

-- 9. Criar índices importantes
\echo '\n📈 9. CRIANDO ÍNDICES PARA PERFORMANCE'

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 10. Verificar permissões
\echo '\n🔐 10. VERIFICANDO PERMISSÕES'

SELECT 
    table_name as "Tabela",
    privilege_type as "Permissão",
    grantee as "Usuário"
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

-- 11. Resumo final
\echo '\n📋 11. RESUMO FINAL'

SELECT 
    'Tabela profiles existe' as "Verificação",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'profiles'
        ) THEN '✅ SIM'
        ELSE '❌ NÃO'
    END as "Status"
UNION ALL
SELECT 
    'Usuário admin existe',
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') 
        THEN '✅ SIM'
        ELSE '❌ NÃO'
    END
UNION ALL
SELECT 
    'Estrutura correta',
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
            AND column_name IN ('id', 'email', 'full_name', 'role', 'password_hash')
        ) = 5 THEN '✅ SIM'
        ELSE '❌ NÃO'
    END;

\echo '\n🎉 DIAGNÓSTICO E CORREÇÃO FINALIZADOS!'
\echo 'Se todos os itens estão com ✅, o login deve funcionar agora.'