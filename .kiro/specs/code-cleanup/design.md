# Design Document - Code Cleanup

## Overview

Este documento detalha a estratégia para limpeza estrutural do projeto William Disk Pizza, removendo elementos desnecessários enquanto preserva funcionalidades essenciais. A limpeza será realizada de forma incremental e segura, com backup das configurações importantes.

## Architecture

### Análise de Dependências

**Pastas para Análise Detalhada:**
- `.cursor/` - Configurações específicas do editor Cursor
- `.github/` - Workflows de CI/CD e templates
- `tests/` - Estrutura de testes (contracts, integration, performance)
- `.vercel/` - Configurações de deploy
- `coverage/` - Relatórios de cobertura de testes
- `src/` - Estrutura duplicada (já existe `app/`, `components/`, `lib/`)

**Arquivos Duplicados Identificados:**
- `package-simplified.json` vs `package.json`
- `next.config.simplified.js` vs `next.config.js`
- `tailwind.config.simplified.js` vs `tailwind.config.js`
- `tsconfig.simplified.json` vs `tsconfig.json`
- `README-SIMPLIFIED.md` vs `README.md`

## Components and Interfaces

### Sistema de Classificação

**Categoria 1: Remover Completamente**
- Pastas vazias ou com conteúdo obsoleto
- Arquivos duplicados com sufixo "simplified"
- Configurações de ferramentas não utilizadas

**Categoria 2: Consolidar**
- Estruturas de teste duplicadas
- Documentação redundante
- Configurações similares

**Categoria 3: Preservar**
- Configurações essenciais de build e deploy
- Testes de integração críticos
- Documentação técnica importante

### Mapeamento de Remoções

```
Estrutura Atual → Estrutura Limpa

/.cursor/                    → REMOVER (específico do editor)
/.github/                    → MANTER (CI/CD necessário)
/tests/contracts/            → REMOVER (duplicado com __tests__)
/tests/integration/          → CONSOLIDAR em __tests__
/tests/performance/          → CONSOLIDAR em __tests__
/coverage/                   → REMOVER (gerado automaticamente)
/src/                        → REMOVER (duplicado)
/.vercel/                    → MANTER (deploy config)
package-simplified.json      → REMOVER
next.config.simplified.js    → REMOVER
tailwind.config.simplified.js → REMOVER
tsconfig.simplified.json     → REMOVER
README-SIMPLIFIED.md         → REMOVER
```

## Data Models

### Estrutura de Backup

```typescript
interface BackupStructure {
  removedFiles: string[];
  consolidatedFiles: {
    source: string;
    destination: string;
    content: string;
  }[];
  preservedConfigs: string[];
}
```

### Validação de Dependências

```typescript
interface DependencyCheck {
  file: string;
  isReferenced: boolean;
  referencedBy: string[];
  canRemove: boolean;
}
```

## Error Handling

### Estratégia de Segurança

1. **Backup Automático**: Criar backup de arquivos antes da remoção
2. **Validação de Build**: Verificar se o projeto ainda compila após cada etapa
3. **Rollback**: Possibilidade de reverter mudanças se necessário
4. **Verificação de Dependências**: Confirmar que arquivos removidos não são referenciados

### Pontos de Verificação

- Após remoção de cada categoria de arquivos
- Verificação de build (`npm run build`)
- Verificação de tipos (`npm run type-check`)
- Teste de desenvolvimento (`npm run dev`)

## Testing Strategy

### Testes de Regressão

1. **Build Test**: Verificar se `npm run build` executa sem erros
2. **Type Check**: Confirmar que `npm run type-check` passa
3. **Dev Server**: Testar se `npm run dev` inicia corretamente
4. **Lint Check**: Verificar se `npm run lint` funciona

### Consolidação de Testes

**Estrutura Atual:**
```
/tests/contracts/        → Testes de contrato de API
/tests/integration/      → Testes de integração
/tests/performance/      → Testes de performance
/__tests__/             → Testes unitários
```

**Estrutura Proposta:**
```
/__tests__/
├── unit/               → Testes unitários
├── integration/        → Testes de integração consolidados
├── api/               → Testes de API (contracts)
└── performance/       → Testes de performance
```

### Validação de Funcionalidades

- Verificar se todas as rotas da aplicação ainda funcionam
- Confirmar que configurações de build estão corretas
- Testar se deploy no Vercel continua funcionando
- Validar se configurações de TypeScript estão adequadas

## Implementation Phases

### Fase 1: Análise e Backup
- Criar backup de segurança
- Analisar dependências de cada arquivo/pasta
- Documentar referências cruzadas

### Fase 2: Remoção de Arquivos Duplicados
- Remover arquivos com sufixo "simplified"
- Consolidar configurações principais
- Verificar build após cada remoção

### Fase 3: Limpeza de Pastas
- Remover pasta `src/` duplicada
- Limpar pasta `.cursor/`
- Remover `coverage/` (será regenerado)

### Fase 4: Consolidação de Testes
- Mover testes para estrutura unificada
- Atualizar configurações de Jest
- Verificar execução de todos os testes

### Fase 5: Validação Final
- Build completo do projeto
- Testes de regressão
- Verificação de deploy
- Documentação das mudanças