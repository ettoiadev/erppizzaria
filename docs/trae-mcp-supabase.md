# Usando Supabase com Docker MCP no Trae AI

Este guia explica como utilizar o Supabase através do Docker MCP (Model Context Protocol) no Trae AI para interagir com seu banco de dados de forma eficiente.

## O que é MCP?

O Model Context Protocol (MCP) é um protocolo que permite que modelos de IA como o Trae AI interajam com ferramentas externas de forma segura e eficiente. Com o Docker MCP, você pode executar servidores MCP em contêineres Docker isolados.

## Configuração

A configuração já foi realizada através dos seguintes arquivos:

1. `.trae/mcp-docker-config.json` - Configuração do servidor MCP para Supabase
2. `scripts/setup-trae-mcp-docker.bat` (Windows) - Script de configuração automática
3. `scripts/setup-trae-mcp-docker.sh` (Linux/Mac) - Script de configuração automática

## Comandos Disponíveis

Com o Supabase MCP configurado, o Trae AI pode executar os seguintes comandos:

### Listar Tabelas

```
list_tables
```

Este comando lista todas as tabelas em um ou mais schemas do seu banco de dados Supabase.

### Listar Extensões

```
list_extensions
```

Este comando lista todas as extensões instaladas no banco de dados.

### Listar Migrações

```
list_migrations
```

Este comando lista todas as migrações aplicadas ao banco de dados.

### Aplicar Migração

```
apply_migration
```

Este comando permite aplicar uma nova migração ao banco de dados. Útil para alterações de esquema.

### Executar SQL

```
execute_sql
```

Este comando permite executar consultas SQL diretamente no banco de dados PostgreSQL.

## Exemplos de Uso

### Exemplo 1: Listar Tabelas

Para listar todas as tabelas no schema public:

```json
{
  "server_name": "mcp.config.usrlocalmcp.supabase",
  "tool_name": "list_tables",
  "args": {
    "schemas": ["public"]
  }
}
```

### Exemplo 2: Executar Consulta SQL

Para buscar os últimos 5 pedidos:

```json
{
  "server_name": "mcp.config.usrlocalmcp.supabase",
  "tool_name": "execute_sql",
  "args": {
    "query": "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"
  }
}
```

## Solução de Problemas

### Erro de Conexão

Se o Trae AI não conseguir se conectar ao MCP Gateway:

1. Verifique se o container Docker está em execução:
   ```
   docker ps | findstr mcp-gateway
   ```

2. Verifique os logs do container:
   ```
   docker logs mcp-gateway
   ```

3. Reinicie o container:
   ```
   docker restart mcp-gateway
   ```

### Erro de Autenticação Supabase

Se ocorrerem erros de autenticação com o Supabase:

1. Verifique se as variáveis de ambiente `SUPABASE_URL` e `SUPABASE_KEY` estão configuradas corretamente
2. Verifique se o container tem acesso a essas variáveis

## Referências

- [Documentação do Supabase](https://supabase.com/docs)
- [Docker MCP Toolkit](https://www.docker.com/products/mcp-catalog-and-toolkit/)
- [Trae AI Documentation](https://docs.trae.ai)