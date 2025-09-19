login:1  GET http://localhost:3000/admin/login 500 (Internal Server Error)
main-app.js:1836 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./app/admin/login/page.tsx', lineno: 61, colno: 97, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at HTMLUnknownElement.callCallback (react-dom.development.js:20565:14)
    at Object.invokeGuardedCallbackImpl (react-dom.development.js:20614:16)
    at invokeGuardedCallback (react-dom.development.js:20689:29)
    at beginWork (react-dom.development.js:26949:7)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534

## CONFIGURAÇÃO POSTGRESQL CONCLUÍDA - 2024

### ✅ STATUS: BANCO DE DADOS CONFIGURADO COM SUCESSO

**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Senha PostgreSQL:** 134679
**Banco:** erp_pizzaria
**Status:** Funcionando perfeitamente

### 📋 CONFIGURAÇÕES REALIZADAS:

1. **Atualização do arquivo .env:**
   - DATABASE_URL="postgresql://postgres:134679@localhost:5432/erp_pizzaria"
   - POSTGRES_PASSWORD="134679"
   - Todas as configurações de conexão atualizadas

2. **Banco de dados criado:**
   - Nome: erp_pizzaria
   - Host: localhost
   - Porta: 5432
   - Usuário: postgres

3. **Estrutura do banco:**
   - ✅ Tabelas criadas via init.sql
   - ✅ Dados iniciais inseridos via seed.sql
   - ✅ 8 tabelas principais disponíveis

### 📊 DADOS VERIFICADOS:

**Tabelas disponíveis:**
- admin_settings
- categories (4 registros)
- customer_addresses
- customers (1 registro)
- order_items
- orders (1 registro)
- products (5 registros)
- profiles

**Exemplos de categorias:**
- Pizzas Tradicionais
- Pizzas Especiais
- Bebidas
- Sobremesas

### 🔧 SCRIPTS CRIADOS:

1. **test-connection.js** - Teste básico de conexão
2. **setup-database.js** - Configuração completa do banco
3. **verify-database.js** - Verificação de status e dados

### ✅ TESTES REALIZADOS:

1. **Conexão PostgreSQL:** ✅ Sucesso
2. **Criação do banco:** ✅ Sucesso
3. **Execução init.sql:** ✅ Sucesso
4. **Execução seed.sql:** ✅ Sucesso
5. **Verificação de dados:** ✅ Sucesso
6. **Servidor Next.js:** ✅ Rodando em http://localhost:3000

### 🎯 PRÓXIMOS PASSOS:

1. **Aplicação funcionando:** O banco está pronto para uso
2. **pgAdmin 4:** Pode ser usado para administração visual
3. **Desenvolvimento:** Continuar com as funcionalidades da aplicação

### 📝 COMANDOS ÚTEIS:

```bash
# Testar conexão
node verify-database.js

# Iniciar aplicação
npm run dev

# Acessar aplicação
http://localhost:3000
```

### 🔐 CREDENCIAIS:

- **Host:** localhost
- **Porta:** 5432
- **Banco:** erp_pizzaria
- **Usuário:** postgres
- **Senha:** 134679

**CONFIGURAÇÃO POSTGRESQL FINALIZADA COM SUCESSO! 🎉**
page.tsx:48 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at HTMLUnknownElement.callCallback (react-dom.development.js:20565:14)
    at Object.invokeGuardedCallbackImpl (react-dom.development.js:20614:16)
    at invokeGuardedCallback (react-dom.development.js:20689:29)
    at beginWork (react-dom.development.js:26949:7)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
callCallback @ react-dom.development.js:20565
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…/next/dist/client/components/redirect-boundary.js', lineno: 57, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
redirect-boundary.js:57 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…/next/dist/client/components/redirect-boundary.js', lineno: 57, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
redirect-boundary.js:57 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…/next/dist/client/components/redirect-boundary.js', lineno: 57, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
redirect-boundary.js:57 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…next/dist/client/components/not-found-boundary.js', lineno: 37, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
not-found-boundary.js:37 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (react-dom.development.js:24504:74)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./app/admin/login/page.tsx', lineno: 61, colno: 97, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at HTMLUnknownElement.callCallback (react-dom.development.js:20565:14)
    at Object.invokeGuardedCallbackImpl (react-dom.development.js:20614:16)
    at invokeGuardedCallback (react-dom.development.js:20689:29)
    at beginWork (react-dom.development.js:26949:7)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
page.tsx:48 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at HTMLUnknownElement.callCallback (react-dom.development.js:20565:14)
    at Object.invokeGuardedCallbackImpl (react-dom.development.js:20614:16)
    at invokeGuardedCallback (react-dom.development.js:20689:29)
    at beginWork (react-dom.development.js:26949:7)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
callCallback @ react-dom.development.js:20565
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…/next/dist/client/components/redirect-boundary.js', lineno: 57, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
redirect-boundary.js:57 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…/next/dist/client/components/redirect-boundary.js', lineno: 57, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
redirect-boundary.js:57 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…/next/dist/client/components/redirect-boundary.js', lineno: 57, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
redirect-boundary.js:57 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
frontend-logger.ts:248 [UI] Erro JavaScript não tratado {filename: 'webpack-internal:///(app-pages-browser)/./node_mod…next/dist/client/components/not-found-boundary.js', lineno: 37, colno: 9, message: 'Uncaught ReferenceError: CardHeader is not defined'} ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
logError @ frontend-logger.ts:248
eval @ frontend-logger.ts:54
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
beginWork @ react-dom.development.js:26949
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
not-found-boundary.js:37 Uncaught ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
AdminLoginPage @ page.tsx:48
renderWithHooks @ react-dom.development.js:11121
mountIndeterminateComponent @ react-dom.development.js:16869
beginWork$1 @ react-dom.development.js:18458
beginWork @ react-dom.development.js:26927
performUnitOfWork @ react-dom.development.js:25748
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
recoverFromConcurrentError @ react-dom.development.js:24597
performConcurrentWorkOnRoot @ react-dom.development.js:24542
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
app-index.js:33 The above error occurred in the <NotFoundErrorBoundary> component:

    at AdminLoginPage (webpack-internal:///(app-pages-browser)/./app/admin/login/page.tsx:29:78)
    at ClientPageRoot (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/client-page.js:14:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.2.32_react-dom@18.3.1_react@18.3.1__react@
window.console.error @ app-index.js:33
logCapturedError @ react-dom.development.js:15295
update.callback @ react-dom.development.js:15344
callCallback @ react-dom.development.js:8696
commitCallbacks @ react-dom.development.js:8743
commitClassCallbacks @ react-dom.development.js:21323
commitLayoutEffectOnFiber @ react-dom.development.js:21425
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21418
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21488
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21488
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21418
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21418
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21418
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21418
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21407
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21577
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21418
recursivelyTraverseLayoutEffects @ react-dom.development.js:22926
commitLayoutEffectOnFiber @ react-dom.development.js:21437
commitLayoutEffects @ react-dom.development.js:22912
commitRootImpl @ react-dom.development.js:26226
commitRoot @ react-dom.development.js:26077
commitRootWhenReady @ react-dom.development.js:24749
finishConcurrentRender @ react-dom.development.js:24714
performConcurrentWorkOnRoot @ react-dom.development.js:24559
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
error.tsx:15 Erro da aplicação: ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
eval @ error.tsx:15
commitHookEffectListMount @ react-dom.development.js:21102
commitHookPassiveMountEffects @ react-dom.development.js:23154
commitPassiveMountOnFiber @ react-dom.development.js:23259
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23267
commitPassiveMountEffects @ react-dom.development.js:23225
flushPassiveEffectsImpl @ react-dom.development.js:26497
flushPassiveEffects @ react-dom.development.js:26438
performSyncWorkOnRoot @ react-dom.development.js:24870
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:7758
flushSyncWorkOnAllRoots @ react-dom.development.js:7718
commitRootImpl @ react-dom.development.js:26369
commitRoot @ react-dom.development.js:26077
commitRootWhenReady @ react-dom.development.js:24749
finishConcurrentRender @ react-dom.development.js:24714
performConcurrentWorkOnRoot @ react-dom.development.js:24559
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
error.tsx:15 Erro da aplicação: ReferenceError: CardHeader is not defined
    at AdminLoginPage (page.tsx:48:10)
    at renderWithHooks (react-dom.development.js:11121:18)
    at mountIndeterminateComponent (react-dom.development.js:16869:13)
    at beginWork$1 (react-dom.development.js:18458:16)
    at beginWork (react-dom.development.js:26927:14)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performConcurrentWorkOnRoot (react-dom.development.js:24542:26)
    at workLoop (scheduler.development.js:256:34)
    at flushWork (scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:534:21)
window.console.error @ app-index.js:33
eval @ error.tsx:15
commitHookEffectListMount @ react-dom.development.js:21102
invokePassiveEffectMountInDEV @ react-dom.development.js:23980
invokeEffectsInDev @ react-dom.development.js:26852
legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26835
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26816
flushPassiveEffectsImpl @ react-dom.development.js:26514
flushPassiveEffects @ react-dom.development.js:26438
performSyncWorkOnRoot @ react-dom.development.js:24870
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:7758
flushSyncWorkOnAllRoots @ react-dom.development.js:7718
commitRootImpl @ react-dom.development.js:26369
commitRoot @ react-dom.development.js:26077
commitRootWhenReady @ react-dom.development.js:24749
finishConcurrentRender @ react-dom.development.js:24714
performConcurrentWorkOnRoot @ react-dom.development.js:24559
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
