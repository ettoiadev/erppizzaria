# 🔒 Checklist de Segurança - William Disk Pizza

## 🚨 ANTES DE CADA DEPLOY EM PRODUÇÃO

### 1. **Variáveis de Ambiente Críticas**
- [ ] `JWT_SECRET` configurado e com mínimo 32 caracteres
- [ ] `SUPABASE_URL` apontando para produção (não localhost)
- [ ] `SUPABASE_KEY` configurado corretamente
- [ ] `NODE_ENV=production`

### 2. **Segurança de Pagamentos**
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` configurado
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado
- [ ] Webhooks usando HTTPS

### 3. **Validações Automáticas**
- [ ] Executar `npm run validate-security`
- [ ] Executar `npm run validate-env`
- [ ] Todos os testes passando

## 🔐 CONFIGURAÇÃO DE SEGURANÇA

### **JWT_SECRET (OBRIGATÓRIO)**
```bash
# Gerar chave segura
openssl rand -base64 32

# Exemplo de .env.local
JWT_SECRET=K8mP9qR2sT5vW8xY1zA4bC7dE0fG3hI6jK9lM2nO5pQ8rS1tU4vW7xY0zA3b
```

### **SUPABASE (OBRIGATÓRIO)**
```bash
# Em produção, NUNCA usar localhost
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **MERCADO PAGO (RECOMENDADO)**
```bash
# Em produção, OBRIGATÓRIO
MERCADOPAGO_WEBHOOK_SECRET=seu_segredo_aqui_32_caracteres
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 🚫 O QUE NUNCA FAZER

1. **NUNCA** commitar `.env.local` com valores reais
2. **NUNCA** usar chaves de desenvolvimento em produção
3. **NUNCA** deixar JWT_SECRET vazio ou padrão
4. **NUNCA** aceitar webhooks sem verificação em produção
5. **NUNCA** desabilitar rate limiting em produção

## ✅ VERIFICAÇÕES AUTOMÁTICAS

### **Script de Validação**
```bash
npm run validate-security
```

### **Validação Antes do Build**
```bash
npm run prebuild
# Executa automaticamente:
# - validate-env
# - validate-security
```

## 🧪 TESTES DE SEGURANÇA

### **Teste de Rate Limiting**
```bash
# Testar se rate limiting está funcionando
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Deve retornar 429 após muitas tentativas
```

### **Teste de JWT**
```bash
# Verificar se tokens são únicos
# Cada login deve gerar token diferente
```

## 📊 MONITORAMENTO

### **Logs de Segurança**
- Tentativas de login falhadas
- Rate limiting ativado
- Webhooks rejeitados
- Erros de autenticação

### **Alertas**
- Muitas tentativas de login
- Webhooks sem assinatura
- JWT inválidos

## 🔄 ATUALIZAÇÕES DE SEGURANÇA

### **Mensalmente**
- [ ] Revisar logs de segurança
- [ ] Verificar se rate limiting está ativo
- [ ] Testar validação de webhooks

### **A Cada Deploy**
- [ ] Executar checklist completo
- [ ] Validar variáveis de ambiente
- [ ] Testar funcionalidades críticas

## 📞 EMERGÊNCIAS

### **Se JWT_SECRET for comprometido**
1. Gerar nova chave
2. Invalidar todos os tokens existentes
3. Forçar re-login de todos os usuários
4. Investigar causa da exposição

### **Se Rate Limiting falhar**
1. Verificar logs de erro
2. Reiniciar aplicação
3. Verificar configuração
4. Implementar fallback

---

**Última atualização**: $(date)
**Responsável**: Equipe de Desenvolvimento
**Versão**: 1.0
