[23:18:51.627] Running build in Washington, D.C., USA (East) – iad1
[23:18:51.628] Build machine configuration: 2 cores, 8 GB
[23:18:51.653] Cloning github.com/ettoiadev/erppizzaria (Branch: main, Commit: 9f74344)
[23:18:52.581] Cloning completed: 927.000ms
[23:18:53.833] Restored build cache from previous deployment (3LDRvZFM1NsV1BtE9C1EJAWzypFX)
[23:18:58.599] Running "vercel build"
[23:18:59.102] Vercel CLI 44.7.3
[23:18:59.515] Installing dependencies...
[23:18:59.821] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[23:18:59.822] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[23:18:59.822] npm warn config `--include=optional` to include them.
[23:18:59.822] npm warn config
[23:18:59.822] npm warn config       Default value does install optional deps unless otherwise omitted.
[23:19:01.857] 
[23:19:01.858] up to date in 2s
[23:19:01.886] Detected Next.js version: 14.2.30
[23:19:01.891] Running "npm run build"
[23:19:01.980] npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
[23:19:01.981] npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
[23:19:01.982] npm warn config `--include=optional` to include them.
[23:19:01.982] npm warn config
[23:19:01.982] npm warn config       Default value does install optional deps unless otherwise omitted.
[23:19:02.023] 
[23:19:02.023] > pizzeria-delivery-platform@0.1.0 build
[23:19:02.024] > next build
[23:19:02.024] 
[23:19:02.702]   ▲ Next.js 14.2.30
[23:19:02.703] 
[23:19:02.766]    Creating an optimized production build ...
[23:19:13.279]  ⚠ Compiled with warnings
[23:19:13.280] 
[23:19:13.281] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[23:19:13.281] Critical dependency: the request of a dependency is an expression
[23:19:13.281] 
[23:19:13.282] Import trace for requested module:
[23:19:13.282] ./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
[23:19:13.282] ./node_modules/@supabase/realtime-js/dist/module/index.js
[23:19:13.282] ./node_modules/@supabase/supabase-js/dist/module/index.js
[23:19:13.282] ./lib/supabase.ts
[23:19:13.283] ./app/api/audit-complete/route.ts
[23:19:13.283] 
[23:19:13.283]    Linting and checking validity of types ...
[23:19:32.749]    Collecting page data ...
[23:19:33.261] [Supabase Debug] Environment variables check:
[23:19:33.262] - SUPABASE_URL exists: true
[23:19:33.263] - SUPABASE_KEY exists: true
[23:19:33.263] - NODE_ENV: production
[23:19:35.808]    Generating static pages (0/78) ...
[23:19:36.733] [EXPORT_CLIENTS] Iniciando exportação de clientes...
[23:19:37.459] [EXPORT_CLIENTS] 1 clientes encontrados para exportação
[23:19:37.460] [EXPORT_CLIENTS] Arquivo Excel gerado com sucesso
[23:19:37.532] [EXPORT_PRODUCTS] Iniciando exportação de produtos...
[23:19:37.708] [EXPORT_PRODUCTS] 0 produtos encontrados para exportação
[23:19:37.709] [EXPORT_PRODUCTS] Arquivo Excel de produtos gerado com sucesso
[23:19:38.083]    Generating static pages (19/78) 
[23:19:38.249] [CUSTOMERS] Próximo código sequencial: 0002
[23:19:38.305] 🔍 DEBUG: Iniciando diagnóstico de categorias...
[23:19:38.306] 1. Verificando estrutura da tabela categories...
[23:19:38.698] Estrutura (amostra): []
[23:19:38.699] 2. Verificando todas as categorias...
[23:19:39.436] Total de categorias no banco: 0
[23:19:39.436] 3. Verificando categoria Sobremesas...
[23:19:39.631] Categoria Sobremesas: NÃO ENCONTRADA
[23:19:39.632] 4. Testando UPDATE active = false...
[23:19:39.842] Resultado do UPDATE: NENHUMA LINHA AFETADA
[23:19:39.842] 5. Verificando após UPDATE...
[23:19:39.916] Categoria após UPDATE: NÃO ENCONTRADA
[23:19:39.917] 6. Testando query com filtro active = true...
[23:19:40.334] Categorias ativas: 0
[23:19:41.294] 🔍 Verificando status completo do sistema...
[23:19:42.027] 🧪 Testando conexão completa com williamdiskpizza...
[23:19:43.015] [TEST_DB_CONNECTION] Testando conexão com banco de dados Supabase...
[23:19:43.017] [TEST_DB_CONNECTION] Variáveis de ambiente: { 'SUPABASE_URL/KEY': true, 'NEXT_PUBLIC_SUPABASE_URL/ANON_KEY': true }
[23:19:43.017] [TEST_DB_CONNECTION] Testando conexão com Supabase...
[23:19:43.867] 🧪 Testando funcionalidade completa de entregadores...
[23:19:44.753]    Generating static pages (38/78) 
[23:19:44.755] 🧪 Testando sistema de geolocalização...
[23:19:46.647] [Supabase Debug] Environment variables check:
[23:19:46.648] - SUPABASE_URL exists: true
[23:19:46.648] - SUPABASE_KEY exists: true
[23:19:46.648] - NODE_ENV: production
[23:19:46.671]    Generating static pages (58/78) 
[23:19:46.744] CheckoutPage - Current user: null
[23:19:46.750] CheckoutPage - Cart items: []
[23:19:46.750] CheckoutPage - Cart total: 0
[23:19:46.993]  ✓ Generating static pages (78/78)
[23:19:47.012]    Finalizing page optimization ...
[23:19:47.014]    Collecting build traces ...
[23:19:47.018] 
[23:19:47.022] Route (app)                                     Size     First Load JS
[23:19:47.022] ┌ ○ /                                           4.61 kB         151 kB
[23:19:47.023] ├ ○ /_not-found                                 880 B          88.2 kB
[23:19:47.023] ├ ○ /admin                                      3.69 kB         152 kB
[23:19:47.024] ├ ○ /admin/clientes                             13.9 kB         177 kB
[23:19:47.024] ├ ○ /admin/configuracoes                        27.5 kB         190 kB
[23:19:47.024] ├ ○ /admin/emergencia                           3.66 kB        98.8 kB
[23:19:47.024] ├ ○ /admin/entregadores                         16.5 kB         179 kB
[23:19:47.024] ├ ○ /admin/geolocation                          572 B          87.9 kB
[23:19:47.024] ├ ○ /admin/geolocation-test                     2.04 kB        97.2 kB
[23:19:47.024] ├ ○ /admin/impressora                           571 B          87.9 kB
[23:19:47.024] ├ ○ /admin/login                                9.26 kB         114 kB
[23:19:47.024] ├ ○ /admin/notificacoes                         729 B           149 kB
[23:19:47.025] ├ ○ /admin/pdv                                  9.96 kB         173 kB
[23:19:47.025] ├ ○ /admin/pedidos                              53.4 kB         264 kB
[23:19:47.025] ├ ○ /admin/produtos                             8.5 kB          171 kB
[23:19:47.025] ├ ○ /admin/relatorios                           7.51 kB         163 kB
[23:19:47.025] ├ ƒ /api/about-content                          0 B                0 B
[23:19:47.025] ├ ƒ /api/addresses                              0 B                0 B
[23:19:47.025] ├ ƒ /api/addresses/[id]                         0 B                0 B
[23:19:47.025] ├ ƒ /api/admin/backup-status                    0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/data-management/delete-clients   0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/data-management/delete-products  0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/data-management/delete-sales     0 B                0 B
[23:19:47.026] ├ ○ /api/admin/data-management/export-clients   0 B                0 B
[23:19:47.026] ├ ○ /api/admin/data-management/export-products  0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/data-management/import-clients   0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/debug                            0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/delivery-zones                   0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/delivery-zones/[id]              0 B                0 B
[23:19:47.026] ├ ƒ /api/admin/delivery/reports                 0 B                0 B
[23:19:47.027] ├ ƒ /api/admin/geolocation/settings             0 B                0 B
[23:19:47.027] ├ ƒ /api/admin/geolocation/setup                0 B                0 B
[23:19:47.027] ├ ƒ /api/admin/password                         0 B                0 B
[23:19:47.027] ├ ƒ /api/admin/profile                          0 B                0 B
[23:19:47.027] ├ ƒ /api/admin/register                         0 B                0 B
[23:19:47.027] ├ ƒ /api/admin/settings                         0 B                0 B
[23:19:47.027] ├ ƒ /api/audit-complete                         0 B                0 B
[23:19:47.027] ├ ƒ /api/audit-test                             0 B                0 B
[23:19:47.027] ├ ƒ /api/auth/login                             0 B                0 B
[23:19:47.028] ├ ƒ /api/auth/register                          0 B                0 B
[23:19:47.028] ├ ƒ /api/auth/verify                            0 B                0 B
[23:19:47.028] ├ ƒ /api/categories                             0 B                0 B
[23:19:47.029] ├ ƒ /api/categories-fixed                       0 B                0 B
[23:19:47.029] ├ ƒ /api/categories/[id]                        0 B                0 B
[23:19:47.030] ├ ƒ /api/contact                                0 B                0 B
[23:19:47.030] ├ ƒ /api/coupons                                0 B                0 B
[23:19:47.030] ├ ƒ /api/create-admin-settings                  0 B                0 B
[23:19:47.030] ├ ƒ /api/customers                              0 B                0 B
[23:19:47.030] ├ ƒ /api/customers/[id]                         0 B                0 B
[23:19:47.030] ├ ○ /api/customers/next-code                    0 B                0 B
[23:19:47.030] ├ ƒ /api/customers/search                       0 B                0 B
[23:19:47.030] ├ ○ /api/debug-categories                       0 B                0 B
[23:19:47.030] ├ ƒ /api/delivery/calculate                     0 B                0 B
[23:19:47.031] ├ ƒ /api/drivers                                0 B                0 B
[23:19:47.031] ├ ƒ /api/drivers/[id]                           0 B                0 B
[23:19:47.031] ├ ƒ /api/favorites                              0 B                0 B
[23:19:47.031] ├ ƒ /api/fix-dashboard                          0 B                0 B
[23:19:47.031] ├ ƒ /api/fix-login                              0 B                0 B
[23:19:47.031] ├ ƒ /api/health                                 0 B                0 B
[23:19:47.031] ├ ƒ /api/login-test                             0 B                0 B
[23:19:47.031] ├ ƒ /api/notifications                          0 B                0 B
[23:19:47.031] ├ ƒ /api/notifications/[id]/read                0 B                0 B
[23:19:47.031] ├ ƒ /api/notifications/realtime                 0 B                0 B
[23:19:47.032] ├ ƒ /api/orders                                 0 B                0 B
[23:19:47.032] ├ ƒ /api/orders/[id]                            0 B                0 B
[23:19:47.032] ├ ƒ /api/orders/[id]/assign-driver              0 B                0 B
[23:19:47.032] ├ ƒ /api/orders/[id]/status                     0 B                0 B
[23:19:47.032] ├ ƒ /api/orders/archive                         0 B                0 B
[23:19:47.032] ├ ƒ /api/orders/manual                          0 B                0 B
[23:19:47.032] ├ ƒ /api/payments/create                        0 B                0 B
[23:19:47.032] ├ ƒ /api/payments/webhook                       0 B                0 B
[23:19:47.032] ├ ƒ /api/products                               0 B                0 B
[23:19:47.032] ├ ƒ /api/products/[id]                          0 B                0 B
[23:19:47.033] ├ ○ /api/settings                               0 B                0 B
[23:19:47.033] ├ ƒ /api/simple-test                            0 B                0 B
[23:19:47.033] ├ ○ /api/system-status                          0 B                0 B
[23:19:47.033] ├ ○ /api/test-connection                        0 B                0 B
[23:19:47.033] ├ ○ /api/test-db-connection                     0 B                0 B
[23:19:47.033] ├ ƒ /api/test-delete-clients                    0 B                0 B
[23:19:47.033] ├ ○ /api/test-drivers                           0 B                0 B
[23:19:47.033] ├ ○ /api/test-geolocation                       0 B                0 B
[23:19:47.033] ├ ƒ /api/test-login                             0 B                0 B
[23:19:47.033] ├ ƒ /api/test-password                          0 B                0 B
[23:19:47.033] ├ ƒ /api/test-products                          0 B                0 B
[23:19:47.034] ├ ƒ /api/test-profiles                          0 B                0 B
[23:19:47.034] ├ ƒ /api/upload                                 0 B                0 B
[23:19:47.034] ├ ƒ /api/users/[id]                             0 B                0 B
[23:19:47.034] ├ ○ /cadastro                                   6.14 kB         114 kB
[23:19:47.034] ├ ○ /cardapio                                   2.85 kB         208 kB
[23:19:47.034] ├ ○ /checkout                                   6.59 kB         160 kB
[23:19:47.034] ├ ○ /checkout-simple                            2.62 kB         156 kB
[23:19:47.034] ├ ○ /conta                                      5.29 kB         144 kB
[23:19:47.034] ├ ○ /conta/enderecos                            8.59 kB         147 kB
[23:19:47.034] ├ ○ /contato                                    4.71 kB         140 kB
[23:19:47.034] ├ ○ /cupons                                     3.74 kB         142 kB
[23:19:47.034] ├ ○ /esqueci-senha                              3.79 kB         112 kB
[23:19:47.034] ├ ○ /favoritos                                  3.75 kB         142 kB
[23:19:47.034] ├ ○ /login                                      4.41 kB         112 kB
[23:19:47.034] ├ ○ /menu                                       1.23 kB         204 kB
[23:19:47.035] ├ ○ /pedido                                     2.41 kB         110 kB
[23:19:47.035] ├ ƒ /pedido/[id]                                6.58 kB         162 kB
[23:19:47.035] ├ ○ /pedidos                                    4.85 kB         191 kB
[23:19:47.035] ├ ○ /privacidade                                373 B           111 kB
[23:19:47.035] ├ ○ /seguranca                                  3.57 kB         142 kB
[23:19:47.035] ├ ○ /sobre                                      3.76 kB         158 kB
[23:19:47.035] └ ○ /termos                                     372 B           111 kB
[23:19:47.035] + First Load JS shared by all                   87.4 kB
[23:19:47.035]   ├ chunks/2117-c68d5c253a3200e4.js             31.8 kB
[23:19:47.035]   ├ chunks/fd9d1056-1456069a26ad7640.js         53.6 kB
[23:19:47.035]   └ other shared chunks (total)                 1.98 kB
[23:19:47.035] 
[23:19:47.035] 
[23:19:47.036] ○  (Static)   prerendered as static content
[23:19:47.036] ƒ  (Dynamic)  server-rendered on demand
[23:19:47.036] 
[23:19:47.399] Traced Next.js server files in: 32.71ms
[23:19:47.621] Created all serverless functions in: 222.292ms
[23:19:47.647] Collected static files (public/, static/, .next/static): 12.107ms
[23:19:47.828] Build Completed in /vercel/output [48s]
[23:19:48.058] Deploying outputs...
[23:19:54.230] Deployment completed
[23:19:55.126] Creating build cache...
[23:20:11.376] Created build cache: 16.241s
[23:20:11.382] Uploading build cache [186.84 MB]
[23:20:14.137] Build cache uploaded: 2.770s