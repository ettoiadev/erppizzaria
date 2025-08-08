-- Script para criar usuário admin se não existir
-- Execute este script no PostgreSQL

-- Verificar se já existe um usuário admin
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- Contar usuários admin
    SELECT COUNT(*) INTO admin_count 
    FROM profiles 
    WHERE role = 'admin';
    
    -- Se não existir admin, criar um
    IF admin_count = 0 THEN
        INSERT INTO profiles (
            email, 
            full_name, 
            password_hash, 
            role, 
            phone
        ) VALUES (
            'admin@pizzaria.com',
            'Administrador',
            '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
            'admin',
            '(11) 99999-9999'
        );
        
        RAISE NOTICE '✅ Usuário admin criado: admin@pizzaria.com / password';
    ELSE
        RAISE NOTICE 'ℹ️ Usuário admin já existe';
    END IF;
END $$;

-- Mostrar todos os usuários admin
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at DESC; 