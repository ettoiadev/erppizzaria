-- Script para testar login e verificar senhas
-- Execute este script no PostgreSQL

-- Verificar usuários admin existentes
SELECT 
    id,
    email,
    full_name,
    role,
    LEFT(password_hash, 20) as password_preview,
    created_at
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Verificar se a senha 'password' corresponde ao hash
-- O hash $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi 
-- corresponde à senha 'password'

-- Testar login com admin@pizzaria.com
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Usuário encontrado'
        ELSE '❌ Usuário não encontrado'
    END as status,
    COUNT(*) as user_count
FROM profiles 
WHERE email = 'admin@pizzaria.com'; 