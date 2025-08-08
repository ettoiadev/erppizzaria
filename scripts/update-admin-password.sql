-- Script para atualizar senha do admin
-- Execute este script no PostgreSQL

-- Atualizar senha do admin@pizzaria.com para 'password'
UPDATE profiles 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'admin@pizzaria.com';

-- Verificar se foi atualizado
SELECT 
    email,
    full_name,
    role,
    LEFT(password_hash, 20) as password_preview,
    CASE 
        WHEN password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
        THEN '✅ Senha correta'
        ELSE '❌ Senha incorreta'
    END as password_status
FROM profiles 
WHERE email = 'admin@pizzaria.com'; 