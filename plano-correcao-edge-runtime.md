# Plano de Correção - Edge Runtime e TypeScript
## Sistema William Disk Pizza

**Data:** 17 de Janeiro de 2025  
**Prioridade:** Alta  
**Tempo Estimado:** 2-3 horas  
**Complexidade:** Baixa a Média

---

## 🎯 Objetivo

Corrigir todos os problemas de Edge Runtime identificados na auditoria, garantindo 100% de compatibilidade e estabilidade do sistema.

---

## 📋 Resumo das Correções

| Prioridade | Arquivos | Problema | Tempo Est. |
|------------|----------|----------|------------|
| 🚨 **CRÍTICA** | 3 arquivos | Módulos Node.js sem runtime | 1h |
| ⚠️ **ALTA** | 3 arquivos | bcrypt/jwt sem runtime | 30min |
| ✅ **VERIFICAÇÃO** | Sistema | Testes de funcionamento | 1h |

---

## 🚨 FASE 1: Correções Críticas (Prioridade Máxima)

### 1.1 Correção do Upload de Arquivos

**Arquivo:** `app/api/upload/route.ts`  
**Problema:** Usa `fs/promises`, `path`, `fs` sem especificar runtime  
**Impacto:** Sistema de upload pode falhar completamente

**Correção:**
```typescript
// Adicionar no início do arquivo, após os imports
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Localização:** Linha 7 (após os imports)

**Validação:**
- [ ] Testar upload de imagem de produto
- [ ] Verificar criação de diretório uploads
- [ ] Confirmar salvamento de arquivo

---

### 1.2 Correção do Webhook de Pagamentos

**Arquivo:** `app/api/payments/webhook/route.ts`  
**Problema:** Usa módulo `crypto` sem especificar runtime  
**Impacto:** Webhooks do Mercado Pago podem falhar

**Correção:**
```typescript
// Adicionar no início do arquivo, após os imports
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Localização:** Linha 7 (após os imports)

**Validação:**
- [ ] Testar webhook de pagamento aprovado
- [ ] Verificar assinatura de webhook
- [ ] Confirmar atualização de status do pedido

---

### 1.3 Correção do Status de Backup

**Arquivo:** `app/api/admin/backup-status/route.ts`  
**Problema:** Usa `fs` e `path` sem especificar runtime  
**Impacto:** Funcionalidade de backup administrativo indisponível

**Correção:**
```typescript
// Adicionar no início do arquivo, após os imports
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Localização:** Linha 6 (após os imports)

**Validação:**
- [ ] Acessar painel de backup no admin
- [ ] Verificar listagem de arquivos de backup
- [ ] Confirmar estatísticas de disco

---

## ⚠️ FASE 2: Correções de Alta Prioridade

### 2.1 Correção do Setup Admin

**Arquivo:** `app/api/setup-admin/route.ts`  
**Problema:** Usa `bcrypt` sem especificar runtime  
**Impacto:** Setup inicial do sistema pode falhar

**Correção:**
```typescript
// Adicionar no início do arquivo, após os imports
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Localização:** Linha 5 (após os imports)

**Validação:**
- [ ] Testar criação de usuário admin inicial
- [ ] Verificar hash de senha
- [ ] Confirmar inserção no banco de dados

---

### 2.2 Correção da Alteração de Senha Admin

**Arquivo:** `app/api/admin/password/route.ts`  
**Problema:** Usa `bcrypt` sem especificar runtime  
**Impacto:** Alteração de senha administrativa pode falhar

**Correção:**
```typescript
// Adicionar no início do arquivo, após os imports
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Localização:** Linha 6 (após os imports)

**Validação:**
- [ ] Testar alteração de senha no painel admin
- [ ] Verificar hash da nova senha
- [ ] Confirmar login com nova senha

---

### 2.3 Correção do Conteúdo Sobre

**Arquivo:** `app/api/about-content/route.ts`  
**Problema:** Importa `JwtPayload` de `jsonwebtoken`  
**Impacto:** Página "Sobre" pode apresentar problemas

**Correção:**
```typescript
// Adicionar no início do arquivo, após os imports
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Localização:** Linha 6 (após os imports)

**Validação:**
- [ ] Acessar página "Sobre" no frontend
- [ ] Verificar carregamento de conteúdo
- [ ] Confirmar autenticação JWT

---

## ✅ FASE 3: Verificação e Testes

### 3.1 Testes de Regressão

**Objetivo:** Garantir que as correções não quebrem funcionalidades existentes

**Checklist de Testes:**

#### Autenticação
- [ ] Login de usuário comum
- [ ] Login de administrador
- [ ] Logout do sistema
- [ ] Refresh de token
- [ ] Verificação de token

#### Upload e Mídia
- [ ] Upload de imagem de produto
- [ ] Visualização de imagem carregada
- [ ] Validação de tipo de arquivo
- [ ] Validação de tamanho de arquivo

#### Pagamentos
- [ ] Criação de pagamento
- [ ] Recebimento de webhook
- [ ] Atualização de status do pedido
- [ ] Validação de assinatura

#### Administração
- [ ] Acesso ao painel admin
- [ ] Visualização de status de backup
- [ ] Alteração de senha admin
- [ ] Setup inicial (se aplicável)

### 3.2 Verificação de Performance

**Métricas a Monitorar:**
- Tempo de resposta das APIs corrigidas
- Uso de memória
- Logs de erro
- Estabilidade geral

### 3.3 Verificação de Logs

**Verificar logs para:**
- Erros de runtime
- Warnings de compatibilidade
- Mensagens de sucesso
- Performance degradada

---

## 🔧 Implementação Passo a Passo

### Passo 1: Preparação
```bash
# 1. Fazer backup do código atual
git add .
git commit -m "backup: antes das correções de edge runtime"

# 2. Criar branch para correções
git checkout -b fix/edge-runtime-compatibility

# 3. Verificar status atual
npm run type-check
npm run build
```

### Passo 2: Implementar Correções Críticas

**2.1 Upload Route:**
```bash
# Editar arquivo
code app/api/upload/route.ts

# Adicionar após linha 6:
# export const runtime = 'nodejs'
# export const dynamic = 'force-dynamic'
```

**2.2 Webhook Route:**
```bash
# Editar arquivo
code app/api/payments/webhook/route.ts

# Adicionar após linha 6:
# export const runtime = 'nodejs'
# export const dynamic = 'force-dynamic'
```

**2.3 Backup Status Route:**
```bash
# Editar arquivo
code app/api/admin/backup-status/route.ts

# Adicionar após linha 5:
# export const runtime = 'nodejs'
# export const dynamic = 'force-dynamic'
```

### Passo 3: Implementar Correções de Alta Prioridade

**3.1 Setup Admin:**
```bash
code app/api/setup-admin/route.ts
# Adicionar runtime configuration
```

**3.2 Admin Password:**
```bash
code app/api/admin/password/route.ts
# Adicionar runtime configuration
```

**3.3 About Content:**
```bash
code app/api/about-content/route.ts
# Adicionar runtime configuration
```

### Passo 4: Verificação
```bash
# 1. Verificar TypeScript
npm run type-check

# 2. Fazer build
npm run build

# 3. Executar testes (se existirem)
npm test

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

### Passo 5: Testes Manuais

1. **Testar Upload:**
   - Acessar admin → Produtos → Adicionar produto
   - Fazer upload de imagem
   - Verificar se arquivo foi salvo

2. **Testar Webhook:**
   - Simular webhook do Mercado Pago
   - Verificar logs de processamento
   - Confirmar atualização de status

3. **Testar Backup:**
   - Acessar admin → Configurações → Backup
   - Verificar listagem de backups
   - Confirmar estatísticas

### Passo 6: Finalização
```bash
# 1. Commit das correções
git add .
git commit -m "fix: adicionar runtime nodejs para compatibilidade edge"

# 2. Merge para main (se tudo estiver funcionando)
git checkout main
git merge fix/edge-runtime-compatibility

# 3. Deploy (se aplicável)
# npm run build
# npm run start
```

---

## 📝 Checklist de Validação Final

### Antes do Deploy
- [ ] Todas as correções implementadas
- [ ] TypeScript compila sem erros
- [ ] Build executa com sucesso
- [ ] Testes manuais passaram
- [ ] Logs não mostram erros de runtime
- [ ] Performance mantida

### Após Deploy
- [ ] Sistema funcionando normalmente
- [ ] Upload de arquivos operacional
- [ ] Webhooks de pagamento funcionando
- [ ] Painel administrativo acessível
- [ ] Nenhum erro nos logs de produção

---

## 🚨 Plano de Rollback

**Se algo der errado:**

1. **Rollback Imediato:**
   ```bash
   git checkout main
   git reset --hard HEAD~1
   npm run build
   npm run start
   ```

2. **Rollback Seletivo:**
   - Remover apenas as linhas de runtime adicionadas
   - Manter outras correções que funcionaram

3. **Investigação:**
   - Verificar logs específicos
   - Testar cada correção individualmente
   - Aplicar correções uma por vez

---

## 📊 Métricas de Sucesso

- ✅ **100%** dos arquivos críticos corrigidos
- ✅ **0 erros** de TypeScript
- ✅ **0 erros** de Edge Runtime
- ✅ **100%** das funcionalidades testadas
- ✅ **Performance** mantida ou melhorada

---

## 📞 Suporte e Documentação

**Documentação de Referência:**
- [Next.js Runtime Configuration](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime)
- [Edge Runtime vs Node.js Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)

**Contato para Dúvidas:**
- Desenvolvedor Principal: SOLO Coding Assistant
- Documentação: `auditoria-typescript-edge-runtime.md`

---

*Plano criado por: SOLO Coding Assistant*  
*Baseado na auditoria completa do sistema*  
*Última atualização: 17 de Janeiro de 2025*