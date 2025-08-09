# Migração Completa para Supabase

## Visão Geral

A aplicação William Disk Pizza foi completamente migrada para utilizar exclusivamente o cliente oficial do Supabase para todas as operações de banco de dados. Esta documentação descreve as mudanças realizadas e fornece orientações para desenvolvedores.

## Mudanças Principais

### 1. Remoção de Conexões Diretas PostgreSQL

- Todas as conexões diretas via `pg` foram removidas
- Não é mais necessário configurar `DATABASE_URL`
- Não é mais necessário usar pgAdmin 4 para operações de banco de dados

### 2. Uso Exclusivo do Cliente Supabase

- Todas as operações de banco de dados são realizadas através do cliente oficial Supabase
- O arquivo `lib/supabase.ts` fornece o cliente configurado para uso em toda a aplicação
- As funções em `lib/db.ts` foram adaptadas para usar o cliente Supabase

### 3. Limpeza de Código Legado

- O arquivo `lib/db-native.ts` foi removido após a migração completa
- Todos os scripts SQL obsoletos relacionados ao PostgreSQL nativo foram removidos
- A aplicação agora usa exclusivamente o cliente Supabase para todas as operações

## Benefícios da Migração

1. **Simplificação da Infraestrutura**: Não é mais necessário gerenciar conexões PostgreSQL separadamente
2. **Segurança Aprimorada**: Uso de Row Level Security (RLS) nativo do Supabase
3. **Facilidade de Deploy**: Configuração simplificada em ambientes de produção
4. **Consistência**: Todas as operações de banco de dados seguem o mesmo padrão
5. **Suporte a Realtime**: Facilidade para implementar funcionalidades em tempo real

## Como Trabalhar com o Supabase

### Obter Cliente Supabase

```typescript
import { getSupabaseServerClient } from '@/lib/supabase';

async function minhaFuncao() {
  const supabase = getSupabaseServerClient();
  // Use o cliente supabase aqui
}
```

### Executar Queries

```typescript
// Usando a função query adaptada
import { query } from '@/lib/db';

async function buscarProdutos() {
  const result = await query('products', 'select', {
    columns: '*',
    options: { order: { column: 'name', ascending: true } }
  });
  return result.data;
}

// Usando o cliente Supabase diretamente
import { getSupabaseServerClient } from '@/lib/supabase';

async function buscarProdutos() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}
```

## Scripts SQL

Os scripts SQL na pasta `scripts/` são mantidos para referência histórica e podem ser úteis para entender a estrutura do banco de dados. No entanto, para operações no banco de dados, recomenda-se usar:

1. Console web do Supabase
2. Supabase CLI
3. Migrações gerenciadas pelo Supabase

## Status da Migração

✅ **Concluído**: Migração completa para Supabase
✅ **Concluído**: Remoção de scripts SQL obsoletos do PostgreSQL nativo
✅ **Concluído**: Remoção do arquivo `db-native.ts`
✅ **Concluído**: Limpeza de arquivos de configuração obsoletos

## Próximos Passos Opcionais

1. Implementar migrações gerenciadas pelo Supabase para controle de versão do banco de dados
2. Configurar backup automático via Supabase
3. Implementar monitoramento avançado de performance

## Referências

- [Documentação Oficial do Supabase](https://supabase.com/docs)
- [Guia de Migração do PostgreSQL para Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase CLI](https://supabase.com/docs/guides/cli)