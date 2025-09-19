# Guia de Configuração do pgAdmin 4 - PostgreSQL Local

## 1. Verificar Instalação do PostgreSQL

Antes de configurar o pgAdmin 4, verifique se o PostgreSQL está rodando:

```powershell
# Verificar se o serviço está ativo
Get-Service postgresql*

# Ou verificar a porta 5432
netstat -an | findstr :5432
```

## 2. Abrir o pgAdmin 4

1. **Localizar o pgAdmin 4:**
   - Menu Iniciar → Procurar "pgAdmin 4"
   - Ou acessar via navegador: `http://localhost:5050` (se instalado como servidor web)

2. **Primeira execução:**
   - Definir uma senha mestra para o pgAdmin (anote esta senha!)
   - Esta senha protege suas conexões salvas

## 3. Criar Nova Conexão com o Servidor PostgreSQL

### Passo 1: Adicionar Novo Servidor
1. Clique com botão direito em "Servers" no painel esquerdo
2. Selecione "Register" → "Server..."

### Passo 2: Aba "General"
- **Name:** `PostgreSQL Local - ERP Pizzaria`
- **Server group:** `Servers` (padrão)
- **Comments:** `Servidor local para desenvolvimento do ERP Pizzaria`

### Passo 3: Aba "Connection"
- **Host name/address:** `localhost`
- **Port:** `5432`
- **Maintenance database:** `postgres`
- **Username:** `postgres`
- **Password:** `postgres123`
- **Save password:** ✅ (marcar para não precisar digitar sempre)

### Passo 4: Aba "Advanced" (opcional)
- **DB restriction:** deixar vazio (para ver todos os bancos)

### Passo 5: Salvar
- Clique em "Save"
- Se a conexão for bem-sucedida, você verá o servidor na árvore

## 4. Criar o Banco de Dados "erp_pizzaria"

### Opção A: Via Interface Gráfica
1. Expandir o servidor "PostgreSQL Local - ERP Pizzaria"
2. Clicar com botão direito em "Databases"
3. Selecionar "Create" → "Database..."
4. **Database:** `erp_pizzaria`
5. **Owner:** `postgres`
6. **Encoding:** `UTF8`
7. **Template:** `template1`
8. Clicar "Save"

### Opção B: Via SQL
1. Clicar com botão direito no servidor
2. Selecionar "Query Tool"
3. Executar:
```sql
CREATE DATABASE erp_pizzaria
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
```

## 5. Executar Scripts de Inicialização

### Passo 1: Conectar ao Banco erp_pizzaria
1. Expandir "Databases" → "erp_pizzaria"
2. Clicar com botão direito em "erp_pizzaria"
3. Selecionar "Query Tool"

### Passo 2: Executar init.sql
1. No Query Tool, clicar no ícone "Open File" (📁)
2. Navegar até: `C:\Users\ettop\Desktop\aplicacoes\erppizzaria\init.sql`
3. Clicar "Execute" (▶️) ou pressionar F5
4. Verificar se todas as tabelas foram criadas sem erros

### Passo 3: Executar seed.sql
1. Limpar o Query Tool (Ctrl+A, Delete)
2. Abrir o arquivo `seed.sql`
3. Executar o script
4. Verificar se os dados foram inseridos

## 6. Verificar Estrutura Criada

### Tabelas que devem existir:
- `profiles` (usuários do sistema)
- `categories` (categorias de produtos)
- `products` (produtos/pizzas)
- `customers` (clientes)
- `customer_addresses` (endereços)
- `orders` (pedidos)
- `order_items` (itens do pedido)
- `admin_settings` (configurações)

### Verificar dados inseridos:
```sql
-- Verificar categorias
SELECT * FROM categories;

-- Verificar produtos
SELECT * FROM products;

-- Verificar usuário admin
SELECT email, full_name, role FROM profiles;
```

## 7. Configurações Importantes

### Configurar Timezone (recomendado)
```sql
-- Verificar timezone atual
SHOW timezone;

-- Configurar para horário do Brasil (se necessário)
SET timezone = 'America/Sao_Paulo';
```

### Verificar Extensões
```sql
-- Verificar extensões instaladas
SELECT * FROM pg_extension;
```

## 8. Troubleshooting

### Erro de Conexão
- Verificar se o PostgreSQL está rodando
- Confirmar porta 5432 está aberta
- Verificar credenciais (postgres/postgres123)

### Erro de Permissão
```sql
-- Dar permissões ao usuário postgres (se necessário)
GRANT ALL PRIVILEGES ON DATABASE erp_pizzaria TO postgres;
```

### Erro de Encoding
- Certificar que o banco foi criado com UTF8
- Verificar configurações regionais do Windows

## 9. Próximos Passos

Após configurar o pgAdmin 4:
1. ✅ Testar conexão da aplicação Next.js
2. ✅ Verificar se as queries da aplicação funcionam
3. ✅ Confirmar autenticação e operações CRUD

---

**Credenciais de Acesso:**
- **Host:** localhost
- **Porta:** 5432
- **Banco:** erp_pizzaria
- **Usuário:** postgres
- **Senha:** postgres123

**Usuário Admin da Aplicação:**
- **Email:** admin@erppizzaria.com
- **Senha:** admin123