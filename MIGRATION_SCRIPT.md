# Script de Migração - William Disk Pizza

## Passos para Migrar para Versão Simplificada

### 1. Backup dos Arquivos Importantes
```bash
# Criar pasta de backup
mkdir backup-original

# Backup de arquivos essenciais
cp -r app backup-original/
cp -r components backup-original/
cp -r lib backup-original/
cp package.json backup-original/
cp .env.local backup-original/
```

### 2. Limpar Arquivos Desnecessários

#### Remover arquivos de configuração complexos:
```bash
rm -rf .cursor
rm -rf .swc
rm -rf .trae
rm -rf coverage
rm -rf __tests__
rm -rf __tests__api
rm -rf __tests__components
rm -rf __tests__lib
rm -rf __tests__utils
rm -rf tests
rm -rf print-server
rm -rf scripts
rm -rf docs
```

#### Remover arquivos de configuração duplicados:
```bash
rm babel.config.js
rm jest.config.js
rm jest.setup.js
rm lighthouserc.json
rm clear-rate-limit.js
rm error-handling-validation-improvements.md
rm DEPLOYMENT.md
rm vercel.json
```

### 3. Substituir Arquivos por Versões Simplificadas

```bash
# Substituir package.json
mv package-simplified.json package.json

# Substituir configurações
mv .env.simplified .env.example
mv tailwind.config.simplified.js tailwind.config.js
mv next.config.simplified.js next.config.js
mv tsconfig.simplified.json tsconfig.json

# Substituir README
mv README-SIMPLIFIED.md README.md
```

### 4. Reorganizar Estrutura de Pastas

```bash
# Criar nova estrutura
mkdir -p src/app
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/types

# Mover arquivos para nova estrutura
mv app/* src/app/
mv components/ui/* src/components/ui/
```

### 5. Atualizar Imports

Executar script de substituição de imports:

```bash
# Substituir imports em todos os arquivos TypeScript/JavaScript
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i 's|@/components|@/components|g'
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i 's|@/lib|@/lib|g'
```

### 6. Instalar Dependências Simplificadas

```bash
# Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Instalar dependências simplificadas
npm install
```

### 7. Configurar Banco de Dados

Execute as queries SQL no Supabase conforme documentado no README-SIMPLIFIED.md

### 8. Testar Aplicação

```bash
# Executar aplicação
npm run dev

# Verificar se está funcionando em http://localhost:3000
```

### 9. Verificar Funcionalidades

- [ ] Página inicial carrega
- [ ] Login funciona
- [ ] Registro funciona
- [ ] APIs respondem corretamente

### 10. Commit das Mudanças

```bash
git add .
git commit -m "feat: simplify application structure and remove unnecessary complexity"
```

## Arquivos que Podem ser Removidos com Segurança

### Configurações Complexas:
- `babel.config.js`
- `jest.config.js`
- `jest.setup.js`
- `lighthouserc.json`
- `middleware.ts` (complexo demais)

### Bibliotecas de Logging Complexas:
- `lib/logging.ts`
- `lib/supabase-logger.ts`
- `lib/frontend-logger.ts`
- `lib/error-monitoring.ts`

### Middlewares Desnecessários:
- `lib/rate-limit-middleware.ts`
- `lib/validation-middleware.ts`
- `lib/sanitization-middleware.ts`
- `lib/auth-middleware.ts`

### Múltiplos Arquivos de DB:
- `lib/db.ts`
- `lib/db-supabase-optimized.ts`
- Manter apenas: `lib/supabase.ts`

### Testes Complexos:
- Toda pasta `__tests__`
- Toda pasta `tests`

### Scripts Desnecessários:
- Toda pasta `scripts`

## Benefícios Após Migração

1. **Redução de ~70% no número de arquivos**
2. **Dependências reduzidas de 50+ para ~20**
3. **Tempo de build reduzido**
4. **Código mais legível e manutenível**
5. **Estrutura mais intuitiva**