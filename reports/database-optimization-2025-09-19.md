# Relatório de Otimização do Banco de Dados

**Data:** 2025-09-19T13:34:22.924Z
**Banco:** erp_pizzaria

## Índices Criados

- **idx_profiles_email_active** (profiles): Otimizar login e busca de usuários ativos
- **idx_profiles_role_active** (profiles): Otimizar busca de usuários por role
- **idx_products_category_active** (products): Otimizar listagem de produtos por categoria
- **idx_products_name_search** (products): Otimizar busca textual de produtos
- **idx_products_price_active** (products): Otimizar filtros por faixa de preço
- **idx_orders_customer_status** (orders): Otimizar consulta de pedidos por cliente e status
- **idx_orders_created_at_desc** (orders): Otimizar ordenação por data de criação (mais recentes primeiro)
- **idx_orders_status_created** (orders): Otimizar dashboard admin por status e data
- **idx_order_items_order_id** (order_items): Otimizar busca de itens por pedido
- **idx_order_items_product_stats** (order_items): Otimizar relatórios de produtos mais vendidos
- **idx_favorites_customer_product** (favorites): Otimizar verificação de favoritos (unique constraint)
- **idx_customer_addresses_customer_active** (customer_addresses): Otimizar busca de endereços ativos por cliente
- **idx_refresh_tokens_token_hash** (refresh_tokens): Otimizar validação de refresh tokens
- **idx_refresh_tokens_user_expires** (refresh_tokens): Otimizar limpeza de tokens expirados
- **idx_categories_active_sort** (categories): Otimizar listagem ordenada de categorias ativas

## Configurações Aplicadas

- **work_mem**: 16MB - Memória para operações de ordenação e hash
- **shared_buffers**: 256MB - Buffer compartilhado (25% da RAM)
- **effective_cache_size**: 1GB - Tamanho estimado do cache do SO (75% da RAM)
- **random_page_cost**: 1.1 - Custo de página aleatória (otimizado para SSD)
- **checkpoint_completion_target**: 0.9 - Target para conclusão de checkpoint
- **wal_buffers**: 16MB - Buffers do WAL
- **default_statistics_target**: 100 - Target de estatísticas para otimizador

## Próximos Passos

1. Monitorar performance das queries após otimizações
2. Executar VACUUM FULL se necessário (em horário de baixo uso)
3. Considerar particionamento para tabelas grandes
4. Implementar monitoramento contínuo de performance

## Comandos Úteis

```sql
-- Verificar uso de índices
SELECT * FROM pg_stat_user_indexes ORDER BY idx_tup_read + idx_tup_fetch DESC;

-- Verificar cache hit ratio
SELECT 
  sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)) as hit_ratio
FROM pg_stat_database;

-- Verificar queries lentas (se pg_stat_statements estiver habilitado)
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```
