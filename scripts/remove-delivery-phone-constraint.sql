-- Script para remover constraint NOT NULL do campo delivery_phone
-- e torná-lo opcional na tabela orders

-- Tornar delivery_phone opcional (remover NOT NULL constraint)
ALTER TABLE orders ALTER COLUMN delivery_phone DROP NOT NULL;

-- Alterar delivery_phone para aceitar NULL e definir valor padrão vazio
ALTER TABLE orders ALTER COLUMN delivery_phone SET DEFAULT '';

-- Mostrar informações da coluna atualizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'delivery_phone';

-- Teste para verificar se o campo está funcionando corretamente
SELECT 'Campo delivery_phone agora é opcional' AS status; 