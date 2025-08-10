# Segurança das Variáveis de Ambiente - ERP Pizzaria

Este documento detalha as práticas de segurança implementadas para proteger informações sensíveis através do gerenciamento adequado das variáveis de ambiente.

## 🔒 Princípios de Segurança

### 1. Separação Client-Side vs Server-Side

**✅ Server-Side (Seguro)**
- Variáveis acessíveis apenas no servidor
- Não expostas no bundle do cliente
- Protegidas contra vazamentos

**❌ Client-Side (Inseguro)**
- Variáveis prefixadas com `NEXT_PUBLIC_`
- Expostas no bundle JavaScript
- Visíveis para qualquer usuário

### 2. Implementação Atual

```typescript
// ✅ CORRETO - Server-side apenas
const supabaseUrl = process.env.SUPABASE_URL        // Privada
const supabaseKey = process.env.SUPABASE_KEY        // Privada
const jwtSecret = process.env.JWT_SECRET            // Privada
const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN // Privada

// ✅ CORRETO - Client-side (apenas quando necessário)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL    // Pública
```

## 🚫 Variáveis Removidas por Segurança

### Antes (Inseguro)

```env
# ❌ Expostas no cliente - REMOVIDAS
NEXT_PUBLIC_SUPABASE_URL=https://projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Depois (Seguro)

```env
# ✅ Server-side apenas - SEGURAS
SUPABASE_URL=https://projeto.supabase.co
SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
JWT_SECRET=sua_chave_super_segura_de_pelo_menos_32_caracteres
MERCADOPAGO_ACCESS_TOKEN=APP_USR-sua_chave_de_producao
MERCADOPAGO_WEBHOOK_SECRET=sua_chave_webhook_secreta

# ✅ Client-side (apenas URL pública)
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

## 🔍 Verificação de Segurança

### 1. Auditoria Automática

O projeto inclui validação automática:

```bash
# Executar validação
npm run validate-env

# Verificar antes do build
npm run build  # Executa validate-env automaticamente
```

### 2. Verificação Manual

```bash
# Verificar se variáveis estão no bundle do cliente
npm run build
grep -r "SUPABASE_KEY" .next/static/  # Deve retornar vazio
grep -r "JWT_SECRET" .next/static/    # Deve retornar vazio
```

### 3. Inspeção do Browser

1. Abra as DevTools (F12)
2. Vá para Sources > _next/static
3. Procure por variáveis sensíveis
4. **Não deve encontrar**: `SUPABASE_KEY`, `JWT_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`

## 🛡️ Proteções Implementadas

### 1. Configuração do Next.js

```javascript
// next.config.js
module.exports = {
  // ✅ Removido: propriedade 'env' que expunha variáveis
  // ❌ env: { SUPABASE_KEY: process.env.SUPABASE_KEY }
  
  // ✅ Apenas variáveis NEXT_PUBLIC_* são expostas automaticamente
}
```

### 2. Validação de Build

```json
// package.json
{
  "scripts": {
    "build": "npm run validate-env && next build",
    "prebuild": "npm run validate-env"
  }
}
```

### 3. Verificação de Variáveis Legadas

```javascript
// scripts/validate-env.js
const deprecatedVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

// Falha o build se encontrar variáveis legadas
```

## 🚨 Cenários de Risco

### 1. Exposição Acidental

**Problema**: Adicionar `NEXT_PUBLIC_` a variáveis sensíveis

```env
# ❌ NUNCA fazer isso
NEXT_PUBLIC_JWT_SECRET=minha_chave_secreta
NEXT_PUBLIC_MERCADOPAGO_ACCESS_TOKEN=APP_USR-123
```

**Solução**: Usar apenas variáveis sem prefixo para dados sensíveis

### 2. Configuração Incorreta do Next.js

**Problema**: Expor variáveis via `next.config.js`

```javascript
// ❌ NUNCA fazer isso
module.exports = {
  env: {
    JWT_SECRET: process.env.JWT_SECRET,  // Expõe no cliente!
    SUPABASE_KEY: process.env.SUPABASE_KEY
  }
}
```

**Solução**: Remover propriedade `env` do config

### 3. Logs e Debug

**Problema**: Logar variáveis sensíveis

```javascript
// ❌ NUNCA fazer isso
console.log('Supabase Key:', process.env.SUPABASE_KEY)
console.log('All env:', process.env)
```

**Solução**: Usar logs seguros

```javascript
// ✅ Seguro
console.log('Supabase configured:', !!process.env.SUPABASE_KEY)
console.log('Environment:', process.env.NODE_ENV)
```

## 📋 Checklist de Segurança

### Antes do Deploy

- [ ] Executar `npm run validate-env`
- [ ] Verificar que não há `NEXT_PUBLIC_` em variáveis sensíveis
- [ ] Confirmar que `next.config.js` não expõe variáveis
- [ ] Testar build local: `npm run build`
- [ ] Verificar bundle do cliente por variáveis sensíveis

### Configuração do Vercel

- [ ] Configurar variáveis no dashboard do Vercel
- [ ] **NÃO** marcar variáveis sensíveis como "Expose to browser"
- [ ] Testar deploy em ambiente de preview
- [ ] Verificar logs de build por erros de variáveis

### Monitoramento Contínuo

- [ ] Configurar alertas para falhas de build
- [ ] Revisar logs regularmente
- [ ] Auditar variáveis de ambiente mensalmente
- [ ] Rotacionar chaves sensíveis periodicamente

## 🔄 Rotação de Chaves

### Frequência Recomendada

- **JWT_SECRET**: A cada 6 meses
- **MERCADOPAGO_ACCESS_TOKEN**: Conforme política do MP
- **SUPABASE_KEY**: Apenas se comprometida
- **MERCADOPAGO_WEBHOOK_SECRET**: A cada 3 meses

### Processo de Rotação

1. **Gerar nova chave**
2. **Atualizar no Vercel** (sem deploy)
3. **Testar em preview**
4. **Deploy para produção**
5. **Verificar funcionamento**
6. **Invalidar chave antiga**

## 📚 Recursos Adicionais

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)

## 🆘 Em Caso de Comprometimento

### Ação Imediata

1. **Revogar chaves comprometidas**
2. **Gerar novas chaves**
3. **Atualizar configurações**
4. **Deploy emergencial**
5. **Monitorar logs por atividade suspeita**

### Investigação

1. **Identificar fonte do vazamento**
2. **Revisar logs de acesso**
3. **Verificar integridade dos dados**
4. **Documentar incidente**
5. **Implementar melhorias**

---

**Última atualização**: Dezembro 2024  
**Responsável**: Equipe de Desenvolvimento  
**Próxima revisão**: Março 2025