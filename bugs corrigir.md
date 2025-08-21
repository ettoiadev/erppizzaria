aja como um engenheiro full stack experiente em bugs, corrija os erros apresentados abaixo:

main-app.js?v=1755770782541:1836 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
hot-reloader-client.js:187 [Fast Refresh] rebuilding
hot-reloader-client.js:44 [Fast Refresh] done in 747ms
page.tsx:74 Attempting login for: ettobr@gmail.com
frontend-logger.ts:222 [AUTH] Tentativa de login {email: 'et***@gmail.com'}
auth-context.tsx:160  POST http://localhost:3000/api/auth/login 401 (Unauthorized)
login @ auth-context.tsx:160
handleSubmit @ page.tsx:75
callCallback @ react-dom.development.js:20565
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:20703
executeDispatch @ react-dom.development.js:32128
processDispatchQueueItemsInOrder @ react-dom.development.js:32160
processDispatchQueue @ react-dom.development.js:32173
dispatchEventsForPlugins @ react-dom.development.js:32184
eval @ react-dom.development.js:32374
batchedUpdates$1 @ react-dom.development.js:24953
batchedUpdates @ react-dom.development.js:28844
dispatchEventForPluginEventSystem @ react-dom.development.js:32373
dispatchEvent @ react-dom.development.js:30141
dispatchDiscreteEvent @ react-dom.development.js:30112
frontend-logger.ts:233 [AUTH] Falha no login {email: 'et***@gmail.com', error: 'Email ou senha inválidos'}
warn @ frontend-logger.ts:233
login @ auth-context.tsx:180
await in login
handleSubmit @ page.tsx:75
callCallback @ react-dom.development.js:20565
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:20703
executeDispatch @ react-dom.development.js:32128
processDispatchQueueItemsInOrder @ react-dom.development.js:32160
processDispatchQueue @ react-dom.development.js:32173
dispatchEventsForPlugins @ react-dom.development.js:32184
eval @ react-dom.development.js:32374
batchedUpdates$1 @ react-dom.development.js:24953
batchedUpdates @ react-dom.development.js:28844
dispatchEventForPluginEventSystem @ react-dom.development.js:32373
dispatchEvent @ react-dom.development.js:30141
dispatchDiscreteEvent @ react-dom.development.js:30112
page.tsx:83 Redirecionando após login para: /cardapio
