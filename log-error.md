[23:11:22.278] Running build in Washington, D.C., USA (East) – iad1
[23:11:22.278] Build machine configuration: 2 cores, 8 GB
[23:11:22.323] Cloning github.com/ettoiadev/erppizzaria (Branch: main, Commit: 27b0be0)
[23:11:22.331] Skipping build cache, deployment was triggered without cache.
[23:11:23.176] Cloning completed: 852.000ms
[23:11:26.565] Running "vercel build"
[23:11:27.012] Vercel CLI 44.7.3
[23:11:27.357] Installing dependencies...
[23:11:27.948] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[23:11:27.949] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[23:11:27.949] npm warn config `--include=optional` to include them.
[23:11:27.949] npm warn config
[23:11:27.949] npm warn config       Default value does install optional deps unless otherwise omitted.
[23:11:32.606] npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
[23:11:33.260] npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
[23:11:33.318] npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
[23:11:34.991] npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
[23:11:41.481] 
[23:11:41.482] added 595 packages in 14s
[23:11:41.526] Detected Next.js version: 14.2.30
[23:11:41.532] Running "npm run build"
[23:11:41.614] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[23:11:41.615] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[23:11:41.615] npm warn config `--include=optional` to include them.
[23:11:41.615] npm warn config
[23:11:41.616] npm warn config       Default value does install optional deps unless otherwise omitted.
[23:11:41.642] 
[23:11:41.642] > pizzeria-delivery-platform@0.1.0 build
[23:11:41.643] > next build
[23:11:41.643] 
[23:11:42.181] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[23:11:42.181] This information is used to shape Next.js' roadmap and prioritize features.
[23:11:42.182] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[23:11:42.182] https://nextjs.org/telemetry
[23:11:42.182] 
[23:11:42.239]   ▲ Next.js 14.2.30
[23:11:42.239] 
[23:11:42.312]    Creating an optimized production build ...
[23:11:42.383]    Downloading swc package @next/swc-linux-x64-gnu...
[23:11:42.509] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[23:11:42.511] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[23:11:42.511] npm warn config `--include=optional` to include them.
[23:11:42.512] npm warn config
[23:11:42.512] npm warn config       Default value does install optional deps unless otherwise omitted.
[23:11:43.664]    Downloading swc package @next/swc-linux-x64-musl...
[23:11:43.788] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[23:11:43.788] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[23:11:43.788] npm warn config `--include=optional` to include them.
[23:11:43.788] npm warn config
[23:11:43.789] npm warn config       Default value does install optional deps unless otherwise omitted.
[23:11:49.269] request to https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap failed, reason: 
[23:11:49.270] 
[23:11:49.270] Retrying 1/3...
[23:12:17.321]  ⚠ Compiled with warnings
[23:12:17.321] 
[23:12:17.322] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[23:12:17.322] Critical dependency: the request of a dependency is an expression
[23:12:17.322] 
[23:12:17.323] Import trace for requested module:
[23:12:17.323] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[23:12:17.323] ./node_modules/@supabase/realtime-js/dist/module/index.js
[23:12:17.323] ./node_modules/@supabase/supabase-js/dist/module/index.js
[23:12:17.323] ./lib/supabase.ts
[23:12:17.323] ./app/api/audit-complete/route.ts
[23:12:17.324] 
[23:12:17.324]    Linting and checking validity of types ...
[23:12:34.659]    Collecting page data ...
[23:12:35.143] [Supabase Debug] Environment variables check:
[23:12:35.144] - SUPABASE_URL exists: true
[23:12:35.144] - SUPABASE_KEY exists: true
[23:12:35.145] - NODE_ENV: production
[23:12:37.588]    Generating static pages (0/79) ...
[23:12:38.227] Erro ao obter status de backup: B [Error]: Dynamic server usage: Route /api/admin/backup-status couldn't be rendered statically because it used `request.headers`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error
[23:12:38.228]     at V (/vercel/path0/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:21778)
[23:12:38.233]     at Object.get (/vercel/path0/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:29465)
[23:12:38.234]     at m (/vercel/path0/.next/server/app/api/admin/backup-status/route.js:1:1069)
[23:12:38.234]     at /vercel/path0/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:38417
[23:12:38.234]     at /vercel/path0/node_modules/next/dist/server/lib/trace/tracer.js:140:36
[23:12:38.234]     at NoopContextManager.with (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
[23:12:38.234]     at ContextAPI.with (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
[23:12:38.234]     at NoopTracer.startActiveSpan (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
[23:12:38.234]     at ProxyTracer.startActiveSpan (/vercel/path0/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
[23:12:38.235]     at /vercel/path0/node_modules/next/dist/server/lib/trace/tracer.js:122:103 {
[23:12:38.235]   description: "Route /api/admin/backup-status couldn't be rendered statically because it used `request.headers`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error",
[23:12:38.235]   digest: 'DYNAMIC_SERVER_USAGE'
[23:12:38.235] }
[23:12:38.585] [EXPORT_CLIENTS] Iniciando exportação de clientes...
[23:12:39.440] [EXPORT_CLIENTS] Erro ao exportar clientes: {
[23:12:39.441]   code: 'PGRST100',
[23:12:39.441]   details: 'unexpected end of input expecting "...", field name (* or [a..z0..9_$]), "*" or "count()"',
[23:12:39.441]   hint: null,
[23:12:39.441]   message: '"failed to parse select parameter (id,full_name,email,phone,customer_code,created_at,customer_addresses!left(*),)" (line 1, column 78)'
[23:12:39.442] }
[23:12:39.484] [EXPORT_PRODUCTS] Iniciando exportação de produtos...
[23:12:40.296] [EXPORT_PRODUCTS] Erro ao exportar produtos: {
[23:12:40.297]   code: '42703',
[23:12:40.297]   details: null,
[23:12:40.297]   hint: null,
[23:12:40.297]   message: 'column products.image_url does not exist'
[23:12:40.297] }
[23:12:40.583]    Generating static pages (19/79) 
[23:12:41.314] [CUSTOMERS] Próximo código sequencial: 0002
[23:12:41.328] 🔍 DEBUG: Iniciando diagnóstico de categorias...
[23:12:41.328] 1. Verificando estrutura da tabela categories...
[23:12:41.797] Estrutura (amostra): []
[23:12:41.798] 2. Verificando todas as categorias...
[23:12:42.047] Total de categorias no banco: 0
[23:12:42.048] 3. Verificando categoria Sobremesas...
[23:12:42.513] Categoria Sobremesas: NÃO ENCONTRADA
[23:12:42.514] 4. Testando UPDATE active = false...
[23:12:43.180] Resultado do UPDATE: NENHUMA LINHA AFETADA
[23:12:43.181] 5. Verificando após UPDATE...
[23:12:43.181] Categoria após UPDATE: NÃO ENCONTRADA
[23:12:43.181] 6. Testando query com filtro active = true...
[23:12:43.181] Categorias ativas: 0
[23:12:43.924] 🔍 Verificando status completo do sistema...
[23:12:44.590] 🧪 Testando conexão completa com williamdiskpizza...
[23:12:45.939] [TEST_DB_CONNECTION] Testando conexão com banco de dados Supabase...
[23:12:45.940] [TEST_DB_CONNECTION] Variáveis de ambiente: { 'SUPABASE_URL/KEY': true, 'NEXT_PUBLIC_SUPABASE_URL/ANON_KEY': true }
[23:12:45.940] [TEST_DB_CONNECTION] Testando conexão com Supabase...
[23:12:46.811] 🧪 Testando funcionalidade completa de entregadores...
[23:12:47.703]    Generating static pages (39/79) 
[23:12:47.705] 🧪 Testando sistema de geolocalização...
[23:12:50.169] [Supabase Debug] Environment variables check:
[23:12:50.170] - SUPABASE_URL exists: true
[23:12:50.171] - SUPABASE_KEY exists: true
[23:12:50.171] - NODE_ENV: production
[23:12:50.201]    Generating static pages (59/79) 
[23:12:50.275] CheckoutPage - Current user: null
[23:12:50.275] CheckoutPage - Cart items: []
[23:12:50.276] CheckoutPage - Cart total: 0
[23:12:50.511]  ✓ Generating static pages (79/79)
[23:12:50.527]    Finalizing page optimization ...
[23:12:50.528]    Collecting build traces ...
[23:12:50.531] 
[23:12:50.536] Route (app)                                     Size     First Load JS
[23:12:50.536] ┌ ○ /                                           4.61 kB         151 kB
[23:12:50.537] ├ ○ /_not-found                                 880 B          88.2 kB
[23:12:50.537] ├ ○ /admin                                      3.69 kB         152 kB
[23:12:50.537] ├ ○ /admin/clientes                             13.9 kB         177 kB
[23:12:50.537] ├ ○ /admin/configuracoes                        27.5 kB         190 kB
[23:12:50.537] ├ ○ /admin/emergencia                           3.66 kB        98.8 kB
[23:12:50.537] ├ ○ /admin/entregadores                         16.5 kB         179 kB
[23:12:50.537] ├ ○ /admin/geolocation                          572 B          87.9 kB
[23:12:50.537] ├ ○ /admin/geolocation-test                     2.04 kB        97.2 kB
[23:12:50.537] ├ ○ /admin/impressora                           571 B          87.9 kB
[23:12:50.538] ├ ○ /admin/login                                9.26 kB         114 kB
[23:12:50.538] ├ ○ /admin/notificacoes                         729 B           149 kB
[23:12:50.538] ├ ○ /admin/pdv                                  9.96 kB         173 kB
[23:12:50.538] ├ ○ /admin/pedidos                              53.4 kB         264 kB
[23:12:50.538] ├ ○ /admin/produtos                             8.5 kB          171 kB
[23:12:50.538] ├ ○ /admin/relatorios                           7.51 kB         163 kB
[23:12:50.538] ├ ƒ /api/about-content                          0 B                0 B
[23:12:50.538] ├ ƒ /api/addresses                              0 B                0 B
[23:12:50.538] ├ ƒ /api/addresses/[id]                         0 B                0 B
[23:12:50.538] ├ ƒ /api/admin/backup-status                    0 B                0 B
[23:12:50.538] ├ ƒ /api/admin/data-management/delete-clients   0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/data-management/delete-products  0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/data-management/delete-sales     0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/data-management/export-clients   0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/data-management/export-products  0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/data-management/import-clients   0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/debug                            0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/delivery-zones                   0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/delivery-zones/[id]              0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/delivery/reports                 0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/geolocation/settings             0 B                0 B
[23:12:50.539] ├ ƒ /api/admin/geolocation/setup                0 B                0 B
[23:12:50.540] ├ ƒ /api/admin/password                         0 B                0 B
[23:12:50.540] ├ ƒ /api/admin/profile                          0 B                0 B
[23:12:50.540] ├ ƒ /api/admin/register                         0 B                0 B
[23:12:50.540] ├ ƒ /api/admin/settings                         0 B                0 B
[23:12:50.540] ├ ƒ /api/audit-complete                         0 B                0 B
[23:12:50.540] ├ ƒ /api/audit-test                             0 B                0 B
[23:12:50.540] ├ ƒ /api/auth/login                             0 B                0 B
[23:12:50.540] ├ ƒ /api/auth/register                          0 B                0 B
[23:12:50.540] ├ ƒ /api/auth/verify                            0 B                0 B
[23:12:50.543] ├ ƒ /api/categories                             0 B                0 B
[23:12:50.543] ├ ƒ /api/categories-fixed                       0 B                0 B
[23:12:50.543] ├ ƒ /api/categories/[id]                        0 B                0 B
[23:12:50.543] ├ ƒ /api/contact                                0 B                0 B
[23:12:50.543] ├ ƒ /api/coupons                                0 B                0 B
[23:12:50.543] ├ ƒ /api/create-admin-settings                  0 B                0 B
[23:12:50.543] ├ ƒ /api/customers                              0 B                0 B
[23:12:50.543] ├ ƒ /api/customers/[id]                         0 B                0 B
[23:12:50.543] ├ ○ /api/customers/next-code                    0 B                0 B
[23:12:50.543] ├ ƒ /api/customers/search                       0 B                0 B
[23:12:50.543] ├ ○ /api/debug-categories                       0 B                0 B
[23:12:50.543] ├ ƒ /api/delivery/calculate                     0 B                0 B
[23:12:50.543] ├ ƒ /api/drivers                                0 B                0 B
[23:12:50.543] ├ ƒ /api/drivers/[id]                           0 B                0 B
[23:12:50.544] ├ ƒ /api/favorites                              0 B                0 B
[23:12:50.544] ├ ƒ /api/fix-dashboard                          0 B                0 B
[23:12:50.544] ├ ƒ /api/fix-login                              0 B                0 B
[23:12:50.544] ├ ƒ /api/health                                 0 B                0 B
[23:12:50.544] ├ ƒ /api/login-test                             0 B                0 B
[23:12:50.544] ├ ƒ /api/notifications                          0 B                0 B
[23:12:50.544] ├ ƒ /api/notifications/[id]/read                0 B                0 B
[23:12:50.544] ├ ƒ /api/notifications/realtime                 0 B                0 B
[23:12:50.544] ├ ƒ /api/orders                                 0 B                0 B
[23:12:50.544] ├ ƒ /api/orders/[id]                            0 B                0 B
[23:12:50.548] ├ ƒ /api/orders/[id]/assign-driver              0 B                0 B
[23:12:50.548] ├ ƒ /api/orders/[id]/status                     0 B                0 B
[23:12:50.549] ├ ƒ /api/orders/archive                         0 B                0 B
[23:12:50.549] ├ ƒ /api/orders/manual                          0 B                0 B
[23:12:50.549] ├ ƒ /api/payments/create                        0 B                0 B
[23:12:50.549] ├ ƒ /api/payments/webhook                       0 B                0 B
[23:12:50.549] ├ ƒ /api/products                               0 B                0 B
[23:12:50.549] ├ ƒ /api/products/[id]                          0 B                0 B
[23:12:50.549] ├ ○ /api/settings                               0 B                0 B
[23:12:50.549] ├ ƒ /api/simple-test                            0 B                0 B
[23:12:50.549] ├ ○ /api/system-status                          0 B                0 B
[23:12:50.549] ├ ○ /api/test-connection                        0 B                0 B
[23:12:50.549] ├ ○ /api/test-db-connection                     0 B                0 B
[23:12:50.549] ├ ƒ /api/test-delete-clients                    0 B                0 B
[23:12:50.549] ├ ○ /api/test-drivers                           0 B                0 B
[23:12:50.549] ├ ○ /api/test-geolocation                       0 B                0 B
[23:12:50.549] ├ ƒ /api/test-login                             0 B                0 B
[23:12:50.549] ├ ƒ /api/test-password                          0 B                0 B
[23:12:50.549] ├ ƒ /api/test-products                          0 B                0 B
[23:12:50.549] ├ ƒ /api/test-profiles                          0 B                0 B
[23:12:50.549] ├ ƒ /api/upload                                 0 B                0 B
[23:12:50.549] ├ ƒ /api/users/[id]                             0 B                0 B
[23:12:50.549] ├ ○ /cadastro                                   6.14 kB         114 kB
[23:12:50.549] ├ ○ /cardapio                                   2.85 kB         208 kB
[23:12:50.549] ├ ○ /checkout                                   6.59 kB         160 kB
[23:12:50.549] ├ ○ /checkout-simple                            2.62 kB         156 kB
[23:12:50.549] ├ ○ /conta                                      5.29 kB         144 kB
[23:12:50.549] ├ ○ /conta/enderecos                            8.59 kB         147 kB
[23:12:50.549] ├ ○ /contato                                    4.71 kB         140 kB
[23:12:50.549] ├ ○ /cupons                                     3.74 kB         142 kB
[23:12:50.549] ├ ○ /esqueci-senha                              3.79 kB         112 kB
[23:12:50.549] ├ ○ /favoritos                                  3.75 kB         142 kB
[23:12:50.549] ├ ○ /login                                      4.41 kB         112 kB
[23:12:50.549] ├ ○ /menu                                       1.23 kB         204 kB
[23:12:50.549] ├ ○ /pedido                                     2.41 kB         110 kB
[23:12:50.549] ├ ƒ /pedido/[id]                                6.58 kB         162 kB
[23:12:50.549] ├ ○ /pedidos                                    4.85 kB         191 kB
[23:12:50.549] ├ ○ /privacidade                                373 B           111 kB
[23:12:50.549] ├ ○ /seguranca                                  3.57 kB         142 kB
[23:12:50.549] ├ ○ /sobre                                      3.76 kB         158 kB
[23:12:50.549] └ ○ /termos                                     372 B           111 kB
[23:12:50.549] + First Load JS shared by all                   87.4 kB
[23:12:50.549]   ├ chunks/2117-c68d5c253a3200e4.js             31.8 kB
[23:12:50.549]   ├ chunks/fd9d1056-1456069a26ad7640.js         53.6 kB
[23:12:50.549]   └ other shared chunks (total)                 1.98 kB
[23:12:50.550] 
[23:12:50.550] 
[23:12:50.552] ○  (Static)   prerendered as static content
[23:12:50.552] ƒ  (Dynamic)  server-rendered on demand
[23:12:50.552] 
[23:12:50.923] Traced Next.js server files in: 46.725ms
[23:12:51.154] Created all serverless functions in: 230.402ms
[23:12:51.187] Collected static files (public/, static/, .next/static): 15.747ms
[23:12:51.375] Build Completed in /vercel/output [1m]
[23:12:51.590] Deploying outputs...
[23:12:59.481] Deployment completed
[23:13:00.344] Creating build cache...
[23:13:15.334] Created build cache: 14.984s
[23:13:15.334] Uploading build cache [187.11 MB]
[23:13:19.520] Build cache uploaded: 4.191s