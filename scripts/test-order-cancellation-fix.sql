-- Script para testar a correção do cancelamento de pedidos
-- Verifica se a estrutura está adequada e simula o UPDATE

-- 1. Verificar se há pedidos disponíveis para cancelar
SELECT 
    'Pedidos disponíveis para cancelamento:' as info,
    count(*) as total
FROM orders 
WHERE status IN ('RECEIVED', 'PREPARING', 'ON_THE_WAY');

-- 2. Mostrar alguns pedidos que podem ser cancelados
SELECT 
    id,
    status,
    total,
    created_at,
    delivery_address
FROM orders 
WHERE status IN ('RECEIVED', 'PREPARING', 'ON_THE_WAY')
ORDER BY created_at DESC
LIMIT 3;

-- 3. Testar a query UPDATE que será executada (simulação)
-- IMPORTANTE: Não execute o UPDATE real, apenas verifique a sintaxe
SELECT 
    'Teste de sintaxe da query UPDATE:' as teste,
    'A query abaixo seria executada pelo endpoint' as observacao;

-- Exemplo da query que seria executada (com tipos explícitos):
-- UPDATE orders 
-- SET status = 'CANCELLED'::VARCHAR, 
--     updated_at = NOW(),
--     cancelled_at = CASE WHEN 'CANCELLED'::VARCHAR = 'CANCELLED' THEN NOW() ELSE cancelled_at END
-- WHERE id = 'uuid-aqui'::UUID 
-- RETURNING *;

-- 4. Verificar se as colunas de timestamp existem
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('delivered_at', 'cancelled_at', 'updated_at')
ORDER BY column_name;

-- 5. Verificar se a tabela order_status_history existe e está pronta
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'order_status_history'
        ) THEN 'order_status_history existe ✅'
        ELSE 'order_status_history NÃO existe ⚠️'
    END as status_tabela_historico; 