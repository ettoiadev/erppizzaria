[22:45:34.672] Running build in Washington, D.C., USA (East) – iad1
[22:45:34.672] Build machine configuration: 2 cores, 8 GB
[22:45:34.690] Cloning github.com/ettoiadev/erppizzaria (Branch: main, Commit: c0bbde6)
[22:45:37.731] Cloning completed: 3.041s
[22:45:40.201] Restored build cache from previous deployment (Dp9HVoQjwG1tnnVJJFuRzjU7uAXt)
[22:45:45.290] Running "vercel build"
[22:45:45.872] Vercel CLI 44.7.3
[22:45:46.227] Installing dependencies...
[22:45:46.610] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[22:45:46.610] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[22:45:46.610] npm warn config `--include=optional` to include them.
[22:45:46.610] npm warn config
[22:45:46.611] npm warn config       Default value does install optional deps unless otherwise omitted.
[22:45:48.922] 
[22:45:48.923] removed 1 package, and changed 11 packages in 2s
[22:45:48.958] Detected Next.js version: 14.2.30
[22:45:48.963] Running "npm run build"
[22:45:49.049] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[22:45:49.050] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[22:45:49.050] npm warn config `--include=optional` to include them.
[22:45:49.050] npm warn config
[22:45:49.050] npm warn config       Default value does install optional deps unless otherwise omitted.
[22:45:49.092] 
[22:45:49.092] > pizzeria-delivery-platform@0.1.0 build
[22:45:49.092] > next build
[22:45:49.092] 
[22:45:49.776]   ▲ Next.js 14.2.30
[22:45:49.777] 
[22:45:49.843]    Creating an optimized production build ...
[22:46:01.262]  ⚠ Compiled with warnings
[22:46:01.264] 
[22:46:01.264] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[22:46:01.264] Critical dependency: the request of a dependency is an expression
[22:46:01.264] 
[22:46:01.264] Import trace for requested module:
[22:46:01.264] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[22:46:01.264] ./node_modules/@supabase/realtime-js/dist/module/index.js
[22:46:01.264] ./node_modules/@supabase/supabase-js/dist/module/index.js
[22:46:01.264] ./lib/supabase.ts
[22:46:01.264] ./app/api/audit-complete/route.ts
[22:46:01.264] 
[22:46:01.265]    Linting and checking validity of types ...
[22:46:20.575]    Collecting page data ...
[22:46:21.168] [Supabase Debug] Environment variables check:
[22:46:21.169] - SUPABASE_URL exists: true
[22:46:21.169] - SUPABASE_KEY exists: true
[22:46:21.169] - NODE_ENV: production
[22:46:23.510]    Generating static pages (0/82) ...
[22:46:24.103] Erro ao obter status de backup: B [Error]: Dynamic server usage: Route /api/admin/backup-status couldn't be rendered statically because it used `request.headers`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
[22:46:24.104]     at V (/vercel/path0/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:21778)
[22:46:24.104]     at Object.get (/vercel/path0/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:29465)
[22:46:24.104]     at m (/vercel/path0/.next/server/app/api/admin/backup-status/route.js:1:1069)
[22:46:24.106]     at /vercel/path0/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:38417
[22:46:24.106]     at /vercel/path0/node_modules/next/dist/server/lib/trace/tracer.js:140:36
[22:46:24.106]     at NoopContextManager.with (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
[22:46:24.107]     at ContextAPI.with (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
[22:46:24.107]     at NoopTracer.startActiveSpan (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
[22:46:24.107]     at ProxyTracer.startActiveSpan (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
[22:46:24.107]     at /vercel/path0/node_modules/next/dist/server/lib/trace/tracer.js:122:103 {
[22:46:24.108]   description: "Route /api/admin/backup-status couldn't be rendered statically because it used `request.headers`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
[22:46:24.108]   digest: 'DYNAMIC_SERVER_USAGE'
[22:46:24.108] }
[22:46:24.452] [EXPORT_CLIENTS] Iniciando exportação de clientes...
[22:46:25.208] [EXPORT_CLIENTS] Erro ao exportar clientes: {
[22:46:25.208]   code: 'PGRST100',
[22:46:25.208]   details: 'unexpected end of input expecting "...", field name (* or [a..z0..9_$]), "*" or "count()"',
[22:46:25.208]   hint: null,
[22:46:25.208]   message: '"failed to parse select parameter (id,full_name,email,phone,customer_code,created_at,customer_addresses!left(*),)" (line 1, column 78)'
[22:46:25.208] }
[22:46:25.271] [EXPORT_PRODUCTS] Iniciando exportação de produtos...
[22:46:25.780] [EXPORT_PRODUCTS] Erro ao exportar produtos: {
[22:46:25.780]   code: '42703',
[22:46:25.781]   details: null,
[22:46:25.781]   hint: null,
[22:46:25.781]   message: 'column products.image_url does not exist'
[22:46:25.781] }
[22:46:25.941]    Generating static pages (20/82) 
[22:46:26.526] [CUSTOMERS] Próximo código sequencial: 0002
[22:46:27.398] 🔍 DEBUG: Iniciando diagnóstico de categorias...
[22:46:27.398] 1. Verificando estrutura da tabela categories...
[22:46:27.582] Estrutura (amostra): []
[22:46:27.583] 2. Verificando todas as categorias...
[22:46:28.698] Total de categorias no banco: 0
[22:46:28.698] 3. Verificando categoria Sobremesas...
[22:46:28.698] Categoria Sobremesas: NÃO ENCONTRADA
[22:46:28.698] 4. Testando UPDATE active = false...
[22:46:28.698] Resultado do UPDATE: NENHUMA LINHA AFETADA
[22:46:28.699] 5. Verificando após UPDATE...
[22:46:28.699] Categoria após UPDATE: NÃO ENCONTRADA
[22:46:28.699] 6. Testando query com filtro active = true...
[22:46:28.850] Categorias ativas: 0
[22:46:30.220] 🔍 Verificando status completo do sistema...
[22:46:30.894] 🧪 Testando conexão completa com williamdiskpizza...
[22:46:32.228] [TEST_DB_CONNECTION] Testando conexão com banco de dados Supabase...
[22:46:32.228] [TEST_DB_CONNECTION] Variáveis de ambiente: { 'SUPABASE_URL/KEY': true, 'NEXT_PUBLIC_SUPABASE_URL/ANON_KEY': true }
[22:46:32.228] [TEST_DB_CONNECTION] Testando conexão com Supabase...
[22:46:32.827]    Generating static pages (40/82) 
[22:46:32.829] 🧪 Testando funcionalidade completa de entregadores...
[22:46:33.801] 🧪 Testando sistema de geolocalização...
[22:46:36.532] [Supabase Debug] Environment variables check:
[22:46:36.532] - SUPABASE_URL exists: true
[22:46:36.533] - SUPABASE_KEY exists: true
[22:46:36.533] - NODE_ENV: production
[22:46:36.542]    Generating static pages (61/82) 
[22:46:36.641] CheckoutPage - Current user: null
[22:46:36.641] CheckoutPage - Cart items: []
[22:46:36.642] CheckoutPage - Cart total: 0
[22:46:36.919]  ✓ Generating static pages (82/82)
[22:46:36.937]    Finalizing page optimization ...
[22:46:36.938]    Collecting build traces ...
[22:46:36.942] 
[22:46:36.947] Route (app)                                     Size     First Load JS
[22:46:36.947] ┌ ○ /                                           4.61 kB         151 kB
[22:46:36.947] ├ ○ /_not-found                                 880 B          88.2 kB
[22:46:36.948] ├ ○ /admin                                      3.69 kB         152 kB
[22:46:36.948] ├ ○ /admin/clientes                             13.9 kB         177 kB
[22:46:36.948] ├ ○ /admin/configuracoes                        27.5 kB         190 kB
[22:46:36.948] ├ ○ /admin/emergencia                           3.66 kB        98.8 kB
[22:46:36.948] ├ ○ /admin/entregadores                         16.5 kB         179 kB
[22:46:36.948] ├ ○ /admin/geolocation                          572 B          87.9 kB
[22:46:36.948] ├ ○ /admin/geolocation-test                     2.04 kB        97.2 kB
[22:46:36.948] ├ ○ /admin/impressora                           571 B          87.9 kB
[22:46:36.948] ├ ○ /admin/login                                9.26 kB         114 kB
[22:46:36.949] ├ ○ /admin/notificacoes                         729 B           149 kB
[22:46:36.949] ├ ○ /admin/pdv                                  9.96 kB         173 kB
[22:46:36.949] ├ ○ /admin/pedidos                              53.4 kB         264 kB
[22:46:36.949] ├ ○ /admin/produtos                             8.5 kB          171 kB
[22:46:36.949] ├ ○ /admin/relatorios                           7.51 kB         163 kB
[22:46:36.949] ├ ƒ /api/about-content                          0 B                0 B
[22:46:36.949] ├ ƒ /api/addresses                              0 B                0 B
[22:46:36.949] ├ ƒ /api/addresses/[id]                         0 B                0 B
[22:46:36.949] ├ ƒ /api/admin/backup-status                    0 B                0 B
[22:46:36.950] ├ ƒ /api/admin/data-management/delete-clients   0 B                0 B
[22:46:36.950] ├ ƒ /api/admin/data-management/delete-products  0 B                0 B
[22:46:36.950] ├ ƒ /api/admin/data-management/delete-sales     0 B                0 B
[22:46:36.950] ├ ƒ /api/admin/data-management/export-clients   0 B                0 B
[22:46:36.950] ├ ƒ /api/admin/data-management/export-products  0 B                0 B
[22:46:36.950] ├ ƒ /api/admin/data-management/import-clients   0 B                0 B
[22:46:36.952] ├ ƒ /api/admin/debug                            0 B                0 B
[22:46:36.952] ├ ƒ /api/admin/delivery-zones                   0 B                0 B
[22:46:36.952] ├ ƒ /api/admin/delivery-zones/[id]              0 B                0 B
[22:46:36.952] ├ ƒ /api/admin/delivery/reports                 0 B                0 B
[22:46:36.952] ├ ƒ /api/admin/geolocation/settings             0 B                0 B
[22:46:36.952] ├ ƒ /api/admin/geolocation/setup                0 B                0 B
[22:46:36.953] ├ ƒ /api/admin/password                         0 B                0 B
[22:46:36.953] ├ ƒ /api/admin/profile                          0 B                0 B
[22:46:36.953] ├ ƒ /api/admin/register                         0 B                0 B
[22:46:36.953] ├ ƒ /api/admin/settings                         0 B                0 B
[22:46:36.953] ├ ƒ /api/audit-complete                         0 B                0 B
[22:46:36.953] ├ ƒ /api/audit-test                             0 B                0 B
[22:46:36.953] ├ ƒ /api/auth/login                             0 B                0 B
[22:46:36.954] ├ ƒ /api/auth/register                          0 B                0 B
[22:46:36.954] ├ ƒ /api/auth/verify                            0 B                0 B
[22:46:36.954] ├ ƒ /api/categories                             0 B                0 B
[22:46:36.955] ├ ƒ /api/categories-fixed                       0 B                0 B
[22:46:36.955] ├ ƒ /api/categories/[id]                        0 B                0 B
[22:46:36.955] ├ ƒ /api/contact                                0 B                0 B
[22:46:36.955] ├ ƒ /api/coupons                                0 B                0 B
[22:46:36.955] ├ ƒ /api/create-admin-settings                  0 B                0 B
[22:46:36.955] ├ ○ /api/customers                              0 B                0 B
[22:46:36.955] ├ ƒ /api/customers/[id]                         0 B                0 B
[22:46:36.955] ├ ○ /api/customers/next-code                    0 B                0 B
[22:46:36.955] ├ ƒ /api/customers/search                       0 B                0 B
[22:46:36.955] ├ ○ /api/debug-categories                       0 B                0 B
[22:46:36.955] ├ ƒ /api/delivery/calculate                     0 B                0 B
[22:46:36.955] ├ ƒ /api/drivers                                0 B                0 B
[22:46:36.955] ├ ƒ /api/drivers/[id]                           0 B                0 B
[22:46:36.955] ├ ƒ /api/favorites                              0 B                0 B
[22:46:36.955] ├ ƒ /api/fix-dashboard                          0 B                0 B
[22:46:36.955] ├ ƒ /api/fix-login                              0 B                0 B
[22:46:36.955] ├ ƒ /api/health                                 0 B                0 B
[22:46:36.955] ├ ƒ /api/login-test                             0 B                0 B
[22:46:36.956] ├ ƒ /api/notifications                          0 B                0 B
[22:46:36.956] ├ ƒ /api/notifications/[id]/read                0 B                0 B
[22:46:36.956] ├ ƒ /api/notifications/realtime                 0 B                0 B
[22:46:36.956] ├ ƒ /api/orders                                 0 B                0 B
[22:46:36.956] ├ ƒ /api/orders/[id]                            0 B                0 B
[22:46:36.956] ├ ƒ /api/orders/[id]/assign-driver              0 B                0 B
[22:46:36.956] ├ ƒ /api/orders/[id]/status                     0 B                0 B
[22:46:36.956] ├ ƒ /api/orders/archive                         0 B                0 B
[22:46:36.958] ├ ƒ /api/orders/manual                          0 B                0 B
[22:46:36.959] ├ ƒ /api/payments/create                        0 B                0 B
[22:46:36.959] ├ ƒ /api/payments/webhook                       0 B                0 B
[22:46:36.959] ├ ƒ /api/products                               0 B                0 B
[22:46:36.959] ├ ƒ /api/products/[id]                          0 B                0 B
[22:46:36.959] ├ ○ /api/settings                               0 B                0 B
[22:46:36.959] ├ ƒ /api/simple-test                            0 B                0 B
[22:46:36.960] ├ ○ /api/system-status                          0 B                0 B
[22:46:36.960] ├ ○ /api/test-connection                        0 B                0 B
[22:46:36.960] ├ ○ /api/test-db-connection                     0 B                0 B
[22:46:36.960] ├ ƒ /api/test-delete-clients                    0 B                0 B
[22:46:36.960] ├ ○ /api/test-drivers                           0 B                0 B
[22:46:36.960] ├ ○ /api/test-geolocation                       0 B                0 B
[22:46:36.961] ├ ƒ /api/test-login                             0 B                0 B
[22:46:36.961] ├ ƒ /api/test-password                          0 B                0 B
[22:46:36.961] ├ ƒ /api/test-products                          0 B                0 B
[22:46:36.961] ├ ƒ /api/test-profiles                          0 B                0 B
[22:46:36.961] ├ ƒ /api/upload                                 0 B                0 B
[22:46:36.961] ├ ƒ /api/users/[id]                             0 B                0 B
[22:46:36.961] ├ ○ /cadastro                                   6.14 kB         114 kB
[22:46:36.961] ├ ○ /cardapio                                   2.85 kB         208 kB
[22:46:36.961] ├ ○ /checkout                                   6.59 kB         160 kB
[22:46:36.961] ├ ○ /checkout-simple                            2.62 kB         156 kB
[22:46:36.962] ├ ○ /conta                                      5.29 kB         144 kB
[22:46:36.962] ├ ○ /conta/enderecos                            8.59 kB         147 kB
[22:46:36.962] ├ ○ /contato                                    4.71 kB         140 kB
[22:46:36.962] ├ ○ /cupons                                     3.74 kB         142 kB
[22:46:36.962] ├ ○ /esqueci-senha                              3.79 kB         112 kB
[22:46:36.962] ├ ○ /favoritos                                  3.75 kB         142 kB
[22:46:36.962] ├ ○ /login                                      4.41 kB         112 kB
[22:46:36.962] ├ ○ /menu                                       1.23 kB         204 kB
[22:46:36.962] ├ ○ /pedido                                     2.41 kB         110 kB
[22:46:36.962] ├ ƒ /pedido/[id]                                6.58 kB         162 kB
[22:46:36.962] ├ ○ /pedidos                                    4.85 kB         191 kB
[22:46:36.962] ├ ○ /privacidade                                373 B           111 kB
[22:46:36.962] ├ ○ /seguranca                                  3.57 kB         142 kB
[22:46:36.962] ├ ○ /sobre                                      3.76 kB         158 kB
[22:46:36.962] └ ○ /termos                                     372 B           111 kB
[22:46:36.963] + First Load JS shared by all                   87.4 kB
[22:46:36.963]   ├ chunks/2117-c68d5c253a3200e4.js             31.8 kB
[22:46:36.963]   ├ chunks/fd9d1056-1456069a26ad7640.js         53.6 kB
[22:46:36.963]   └ other shared chunks (total)                 1.98 kB
[22:46:36.963] 
[22:46:36.964] 
[22:46:36.964] ○  (Static)   prerendered as static content
[22:46:36.964] ƒ  (Dynamic)  server-rendered on demand
[22:46:36.964] 
[22:46:37.343] Traced Next.js server files in: 74.886ms
[22:46:37.546] Created all serverless functions in: 203.076ms
[22:46:37.595] Collected static files (public/, static/, .next/static): 33.538ms
[22:46:37.771] Build Completed in /vercel/output [52s]
[22:46:37.996] Deploying outputs...
[22:46:45.769] Deployment completed
[22:46:46.621] Creating build cache...
[22:47:02.767] Created build cache: 16.149s
[22:47:02.769] Uploading build cache [186.42 MB]
[22:47:05.573] Build cache uploaded: 2.803s