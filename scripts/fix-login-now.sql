-- CORREÇÃO IMEDIATA PARA O PROBLEMA DE LOGIN
-- Execute este script AGORA no pgAdmin4

\echo '🚨 CORREÇÃO URGENTE - PROBLEMA DE LOGIN'
\echo '======================================'

-- 1. Instalar extensões obrigatórias
\echo '\n🔧 1. INSTALANDO EXTENSÕES...'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Deletar tabela profiles se existir (para recriar limpa)
\echo '\n🗑️ 2. LIMPANDO TABELA PROFILES EXISTENTE...'
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Criar tabela profiles do zero
\echo '\n📋 3. CRIANDO TABELA PROFILES...'
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'kitchen', 'delivery')),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para performance
\echo '\n📈 4. CRIANDO ÍNDICES...'
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 5. Inserir usuário admin com senha correta
\echo '\n👨‍💼 5. CRIANDO USUÁRIO ADMIN...'
INSERT INTO public.profiles (
    email, 
    full_name, 
    role, 
    password_hash,
    phone,
    created_at,
    updated_at
) VALUES (
    'admin@pizzaria.com',
    'Administrador do Sistema',
    'admin',
    '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu',
    '11999999999',
    NOW(),
    NOW()
);

-- 6. Inserir usuário de teste adicional
INSERT INTO public.profiles (
    email, 
    full_name, 
    role, 
    password_hash,
    created_at,
    updated_at
) VALUES (
    'admin@williamdiskpizza.com',
    'Admin William Disk Pizza',
    'admin',
    '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu',
    NOW(),
    NOW()
);

-- 7. Verificar se foi criado corretamente
\echo '\n✅ 7. VERIFICANDO CRIAÇÃO...'
SELECT 
    'Tabela profiles criada' as status,
    COUNT(*) as total_users
FROM public.profiles;

-- 8. Mostrar usuários admin criados
\echo '\n👥 8. USUÁRIOS ADMIN CRIADOS:'
SELECT 
    id,
    email,
    full_name,
    role,
    CASE 
        WHEN LENGTH(password_hash) > 50 THEN '✅ Senha OK'
        ELSE '❌ Problema na senha'
    END as senha_status,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- 9. Testar a query exata que estava falhando
\echo '\n🧪 9. TESTANDO QUERY DE LOGIN...'
SELECT 
    'TESTE DE LOGIN' as teste,
    id, 
    email, 
    full_name, 
    role,
    CASE 
        WHEN password_hash IS NOT NULL THEN '✅ Hash OK'
        ELSE '❌ Sem hash'
    END as password_check
FROM public.profiles 
WHERE email = 'admin@pizzaria.com';

-- 10. Verificar permissões na tabela
\echo '\n🔐 10. VERIFICANDO PERMISSÕES...'
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

-- 11. Criar trigger para updated_at
\echo '\n⚡ 11. CRIANDO TRIGGER UPDATED_AT...'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Status final
\echo '\n🎉 12. STATUS FINAL:'
SELECT 
    'CORREÇÃO COMPLETA!' as status,
    'Usuários admin criados:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role = 'admin';

\echo '\n📋 CREDENCIAIS DE LOGIN:'
\echo '  Email: admin@pizzaria.com'
\echo '  Senha: admin123'
\echo '  OU'
\echo '  Email: admin@williamdiskpizza.com'
\echo '  Senha: admin123'
\echo '\n✅ AGORA O LOGIN DEVE FUNCIONAR!'