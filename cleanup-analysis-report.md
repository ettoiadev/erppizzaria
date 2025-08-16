# Relatório de Análise - Limpeza de Código

**Data:** 16/08/2025  
**Backup criado em:** `backup-cleanup/2025-08-16T12-10-26-433Z`

## Resumo Executivo

- **Total de arquivos analisados:** 451
- **Itens para remoção:** 11
- **Seguros para remoção:** 10
- **Com referências:** 1

## Status dos Itens para Remoção

### ✅ SEGUROS PARA REMOÇÃO (10 itens)

1. **`.cursor/`** - Configurações específicas do editor Cursor
2. **`src/`** - Pasta duplicada (versão principal em `lib/` é mais completa)
3. **`coverage/`** - Relatórios de cobertura (regenerados automaticamente)
4. **`package-simplified.json`** - Arquivo duplicado
5. **`next.config.simplified.js`** - Arquivo duplicado
6. **`tailwind.config.simplified.js`** - Arquivo duplicado
7. **`tsconfig.simplified.json`** - Arquivo duplicado
8. **`README-SIMPLIFIED.md`** - Documentação duplicada
9. **`REORGANIZATION_PLAN.md`** - Documentação temporária
10. **`REORGANIZATION_SUMMARY.md`** - Documentação temporária

### ⚠️ REQUER ATENÇÃO (1 item)

#### 1. `src/` - Pasta duplicada ✅ RESOLVIDO
**Problema:** Contém arquivo `src/lib/auth.ts` com referência interna
- **Referência encontrada:** `import { supabase, User } from './supabase'` (linha 3)
- **Análise:** Existe `lib/auth.ts` mais completo e atualizado (208 linhas vs 89 linhas)
- **Solução:** Pasta `src/` pode ser removida com segurança - versão principal é mais robusta

#### 1. `tests/` - Estrutura de testes
**Problema:** Referenciado por `tests/contracts/package.json`
- **Referências:** URLs do repositório e bugs apontam para pasta pai
- **Solução:** Atualizar referências antes da consolidação

## Recomendações de Execução

### Fase 1: Remoção Imediata (Seguros)
Podem ser removidos sem impacto:
- Arquivos com sufixo "simplified"
- Pasta `.cursor/`
- Pasta `coverage/`
- Arquivos de documentação temporária

### Fase 2: Consolidação (Requer Cuidado)

#### Para `src/`:
✅ **Verificado:** `lib/auth.ts` existe e é mais completo que `src/lib/auth.ts`
- Pasta `src/` pode ser removida com segurança

#### Para `tests/`:
1. Mover conteúdo para estrutura `__tests__/`
2. Atualizar `tests/contracts/package.json` com novas URLs
3. Verificar configurações de Jest
4. Remover pasta `tests/` original

## Arquivos de Backup Criados

Todos os itens foram salvos em `backup-cleanup/2025-08-16T12-10-26-433Z/`:
- Total de itens no backup: 11
- Tamanho total: 0.02 MB
- Arquivo de informações: `backup-info.json`

## Próximos Passos

1. ✅ **Concluído:** Backup e análise de dependências
2. **Próximo:** Executar Fase 1 - Remoção de arquivos seguros
3. **Depois:** Executar Fase 2 - Consolidação cuidadosa
4. **Final:** Verificação de build e testes

## Scripts Criados

- `scripts/backup-cleanup.js` - Script de backup automático
- `scripts/analyze-dependencies.js` - Análise de dependências
- `dependency-analysis.json` - Relatório detalhado em JSON

---

**Nota:** Este relatório deve ser revisado antes de prosseguir com a remoção dos arquivos. O backup está disponível para rollback se necessário.