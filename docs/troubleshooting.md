# 🔧 Guia de Troubleshooting - William Disk Pizza

## Problemas Comuns e Soluções

### 🚫 Erros de Configuração de Ambiente

#### Erro: "SUPABASE_URL não configurada"
**Sintomas**: Aplicação não inicia ou falha ao conectar com banco
**Solução**:
1. Verifique se o arquivo `.env.local` existe
2. Confirme se `SUPABASE_URL` está definida
3. Execute `npm run validate-env` para verificar configuração

```bash
# Exemplo de configuração correta
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-aqui
```

#### Erro: "JWT_SECRET temporário não deve ser usado em produção"
**Sintomas**: Deploy falha ou aviso de segurança
**Solução**:
1. Gere uma chave segura: `openssl rand -base64 32`
2. Configure `JWT_SECRET` no ambiente de produção
3. Nunca use a chave temporária em produção

### 🔐 Problemas de Autenticação

#### Erro: "Token inválido ou expirado"
**Sintomas**: Usuário é deslogado constantemente
**Solução**:
1. Limpe cookies do navegador
2. Verifique se `JWT_SECRET` está configurado corretamente
3. Confirme se o relógio do servidor está sincronizado

#### Erro: "Falha no login com credenciais corretas"
**Sintomas**: Login falha mesmo com senha correta
**Solução**:
1. Verifique logs do servidor para detalhes
2. Confirme se o usuário existe no banco
3. Teste hash da senha no banco

```javascript
// Teste de hash de senha
const bcrypt = require('bcryptjs')
const isValid = await bcrypt.compare('senha-teste', 'hash-do-banco')
console.log('Senha válida:', isValid)
```

### 🗄️ Problemas de Banco de Dados

#### Erro: "Connection refused" ou timeout
**Sintomas**: Aplicação não consegue conectar com Supabase
**Solução**:
1. Verifique se `SUPABASE_URL` está correta
2. Confirme se o projeto Supabase está ativo
3. Teste conectividade: `curl https://seu-projeto.supabase.co`

#### Erro: "Row Level Security policy violation"
**Sintomas**: Operações de banco falham com erro 403
**Solução**:
1. Verifique políticas RLS no Supabase Dashboard
2. Confirme se o usuário tem permissões adequadas
3. Use service role key para operações administrativas

### 🚀 Problemas de Deploy

#### Erro: Build falha na Vercel
**Sintomas**: Deploy falha durante build
**Solução**:
1. Execute `npm run build` localmente para reproduzir
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Confirme se não há erros de TypeScript: `npm run type-check`

#### Erro: "Module not found" após deploy
**Sintomas**: Aplicação funciona localmente mas falha em produção
**Solução**:
1. Verifique imports case-sensitive
2. Confirme se todos os arquivos estão commitados
3. Limpe cache da Vercel e faça redeploy

### 📱 Problemas de Interface

#### Erro: "useAuth must be used within an AuthProvider"
**Sintomas**: Erro ao usar hook de autenticação
**Solução**:
1. Confirme se componente está dentro de `<AuthProvider>`
2. Verifique se `providers.tsx` está configurado corretamente
3. Teste com componente de exemplo

#### Erro: Componentes não renderizam corretamente
**Sintomas**: Layout quebrado ou componentes em branco
**Solução**:
1. Verifique console do navegador para erros JavaScript
2. Confirme se Tailwind CSS está carregando
3. Teste com componentes básicos primeiro

### 🔄 Problemas de Estado

#### Erro: Estado não persiste entre páginas
**Sintomas**: Dados do usuário ou carrinho são perdidos
**Solução**:
1. Verifique se Context Providers estão no nível correto
2. Confirme se localStorage está funcionando
3. Teste persistência com dados simples

#### Erro: "Hydration mismatch"
**Sintomas**: Erro de hidratação no Next.js
**Solução**:
1. Evite renderização condicional baseada em `window`
2. Use `useEffect` para código client-side
3. Implemente loading states adequados

### 🖨️ Problemas de Impressão

#### Erro: Print server não conecta
**Sintomas**: Pedidos não são impressos
**Solução**:
1. Verifique se print-server está rodando: `cd print-server && npm start`
2. Confirme configuração da impressora
3. Teste conectividade: `curl http://localhost:3001/health`

### 📊 Problemas de Performance

#### Erro: Consultas lentas no banco
**Sintomas**: Aplicação lenta para carregar dados
**Solução**:
1. Ative logs de consulta: `ENABLE_SLOW_QUERY_LOGS=true`
2. Analise consultas no Supabase Dashboard
3. Adicione índices necessários

#### Erro: Bundle muito grande
**Sintomas**: Aplicação demora para carregar
**Solução**:
1. Analise bundle: `npm run build && npx @next/bundle-analyzer`
2. Implemente code splitting
3. Otimize imports de bibliotecas

## 🛠️ Ferramentas de Diagnóstico

### Validação de Ambiente
```bash
# Validar configuração completa
npm run validate-env

# Validar antes do deploy
npm run pre-deploy
```

### Logs e Monitoramento
```bash
# Ver logs em tempo real (desenvolvimento)
npm run dev

# Verificar saúde da aplicação
curl http://localhost:3000/api/health
```

### Testes
```bash
# Executar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Banco de Dados
```bash
# Conectar ao Supabase CLI
npx supabase login
npx supabase link --project-ref SEU-PROJECT-ID

# Ver logs do banco
npx supabase logs
```

## 📞 Quando Buscar Ajuda

Se os problemas persistirem após seguir este guia:

1. **Colete informações**:
   - Logs completos do erro
   - Configuração de ambiente (sem dados sensíveis)
   - Passos para reproduzir o problema

2. **Verifique documentação**:
   - [Documentação das APIs](./api-documentation.md)
   - [Guia de Deploy](./deploy-guide.md)
   - Documentação do Supabase e Next.js

3. **Entre em contato**:
   - Email: contato@williamdiskpizza.com.br
   - Inclua logs e contexto do problema
   - Especifique ambiente (desenvolvimento/produção)

## 🔍 Logs Úteis

### Localização dos Logs
- **Desenvolvimento**: Console do terminal
- **Produção**: Vercel Dashboard > Functions > Logs
- **Supabase**: Dashboard > Logs

### Níveis de Log
- `ERROR`: Erros críticos que impedem funcionamento
- `WARN`: Avisos que podem indicar problemas
- `INFO`: Informações gerais de funcionamento
- `DEBUG`: Detalhes técnicos para diagnóstico

### Configuração de Logs
```env
# .env.local
LOG_LEVEL=debug
ENABLE_QUERY_LOGS=true
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=1000
```