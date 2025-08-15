# Configuração do Docker MCP para Trae AI

Este guia explica como configurar o Docker MCP (Model Context Protocol) para uso com o Trae AI no Windows.

## Pré-requisitos

- Docker Desktop instalado e funcionando no Windows
- Trae AI instalado
- Supabase CLI instalado (opcional, para desenvolvimento local)

## Configuração

### 1. Verificar instalação do Docker

Certifique-se de que o Docker Desktop está instalado e funcionando corretamente:

```powershell
docker --version
docker-compose --version
```

### 2. Configuração do MCP

O arquivo `mcp-docker-config.json` já foi criado na pasta `.trae` com a configuração necessária para o Supabase MCP Server.

### 3. Iniciar o Docker MCP Gateway

Para iniciar o Docker MCP Gateway, execute o seguinte comando no PowerShell:

```powershell
docker run -d --name mcp-gateway \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ${PWD}/.trae:/config \
  docker/mcp-gateway:latest
```

### 4. Configurar o Trae AI para usar o MCP Gateway

No Trae AI, vá para Configurações > Desenvolvedor > MCP e adicione o seguinte endpoint:

```
http://localhost:8080
```

## Uso com Supabase

O MCP Server do Supabase permite que o Trae AI interaja diretamente com seu banco de dados Supabase. Você pode usar os seguintes comandos:

- `list_tables`: Listar todas as tabelas em um ou mais schemas
- `list_extensions`: Listar todas as extensões no banco de dados
- `list_migrations`: Listar todas as migrações no banco de dados
- `apply_migration`: Aplicar uma migração ao banco de dados
- `execute_sql`: Executar SQL bruto no banco de dados PostgreSQL

## Solução de Problemas

### Verificar status do container

```powershell
docker ps -a | findstr mcp
```

### Verificar logs do container

```powershell
docker logs mcp-gateway
```

### Reiniciar o MCP Gateway

```powershell
docker restart mcp-gateway
```

## Referências

- [Docker MCP Catalog e Toolkit](https://www.docker.com/products/mcp-catalog-and-toolkit/)
- [Documentação do Docker MCP Gateway](https://docs.docker.com/ai/mcp-gateway/)