# FASE 2: CONFIGURAÇÃO SUPABASE LOCAL

## 🐳 Instalação e Configuração

### 2.1 Instalar Supabase CLI (Método Correto)

**NÃO use npm install -g supabase** (causa o erro que você viu)

**Instale via Chocolatey (Windows):**

```powershell
# 1. Instalar Chocolatey se não tiver
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Instalar Supabase CLI
choco install supabase

# 3. Verificar instalação
supabase --version
```

**Alternativa - Download direto:**
1. Acesse: https://github.com/supabase/cli/releases
2. Baixe `supabase_windows_amd64.zip`
3. Extraia para `C:\supabase\`
4. Adicione ao PATH do sistema

### 2.2 Instalar Docker Desktop

```powershell
# Download e instale Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Verificar instalação
docker --version
docker-compose --version
```

### 2.3 Inicializar Projeto Supabase

```powershell
cd C:\williamdiskpizza

# Inicializar Supabase
supabase init

# Verificar estrutura criada
ls supabase/
```

### 2.4 Configurar Supabase Local

```powershell
# Iniciar serviços locais (PostgreSQL, Auth, API, etc.)
supabase start

# Aguardar todos os serviços iniciarem...
# Isso criará:
# - PostgreSQL na porta 54322
# - API Gateway na porta 54321
# - Studio (Interface Web) na porta 54323
```

### 2.5 Verificar Serviços

```powershell
# Verificar status
supabase status

# Deve mostrar algo como:
#         API URL: http://localhost:54321
#          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#      Studio URL: http://localhost:54323
#    Inbucket URL: http://localhost:54324
#        JWT secret: your-jwt-secret
#           anon key: your-anon-key
# service_role key: your-service-role-key
```

### 2.6 Acessar Supabase Studio

1. Abra: `http://localhost:54323`
2. Use as credenciais mostradas no `supabase status`
3. Acesse o **SQL Editor**

### 2.7 Testar Conexão PostgreSQL

```sql
-- No Supabase Studio SQL Editor, execute:
SELECT 
    'Supabase Local OK' as status,
    current_database() as database,
    version() as postgres_version,
    now() as timestamp;
```

## 🔧 Configuração de Ambiente

### 2.8 Backup Configuração Atual

```powershell
# Backup da configuração atual
copy lib\db.ts lib\db.ts.backup
```

### 2.9 Preparar Novas Variáveis

Crie arquivo `.env.local.supabase`:

```env
# Supabase Local Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-status
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-status
```

### 2.10 Checklist Supabase Setup ✅

- [ ] Supabase CLI instalado
- [ ] Docker Desktop funcionando
- [ ] `supabase init` executado
- [ ] `supabase start` funcionando
- [ ] Todos os serviços online
- [ ] Studio acessível
- [ ] PostgreSQL conectando
- [ ] Variáveis de ambiente prontas

**🎯 Próximo: Migração do Schema** 