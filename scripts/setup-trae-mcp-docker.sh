#!/bin/bash

echo "==================================================="
echo "Configuracao do Docker MCP para Trae AI"
echo "==================================================="
echo 

# Verificar se o Docker esta instalado
if ! command -v docker &> /dev/null; then
    echo "[ERRO] Docker nao encontrado. Por favor, instale o Docker."
    echo "Visite: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

echo "[OK] Docker encontrado."
echo

# Verificar se o diretorio .trae existe
if [ ! -d "$(dirname "$0")/../.trae" ]; then
    echo "Criando diretorio .trae..."
    mkdir -p "$(dirname "$0")/../.trae"
fi

# Verificar se o arquivo de configuracao existe
if [ ! -f "$(dirname "$0")/../.trae/mcp-docker-config.json" ]; then
    echo "Criando arquivo de configuracao MCP..."
    cat > "$(dirname "$0")/../.trae/mcp-docker-config.json" << EOL
{
  "mcp_servers": [
    {
      "server_name": "mcp.config.usrlocalmcp.supabase",
      "description": "Supabase MCP Server para integracao com banco de dados",
      "docker": {
        "image": "supabase/mcp-server:latest",
        "container_name": "supabase-mcp-server",
        "ports": ["3000:3000"],
        "environment": [
          "SUPABASE_URL=\${SUPABASE_URL}",
          "SUPABASE_KEY=\${SUPABASE_KEY}"
        ],
        "volumes": [
          "\${PWD}/supabase:/app/supabase"
        ]
      }
    }
  ],
  "mcp_gateway": {
    "enabled": true,
    "host": "localhost",
    "port": 8080,
    "log_level": "info"
  }
}
EOL
fi

echo "[OK] Arquivo de configuracao MCP verificado."
echo

# Verificar se o container MCP Gateway ja existe
if docker ps -a | grep -q mcp-gateway; then
    echo "O container MCP Gateway ja existe."
    
    # Verificar se o container esta rodando
    if docker ps | grep -q mcp-gateway; then
        echo "[OK] MCP Gateway ja esta em execucao."
    else
        echo "Iniciando MCP Gateway..."
        if docker start mcp-gateway; then
            echo "[OK] MCP Gateway iniciado com sucesso."
        else
            echo "[ERRO] Falha ao iniciar o MCP Gateway."
            exit 1
        fi
    fi
else
    echo "Criando e iniciando o container MCP Gateway..."
    if docker run -d --name mcp-gateway \
        -p 8080:8080 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$(dirname "$0")/../.trae":/config \
        docker/mcp-gateway:latest; then
        echo "[OK] MCP Gateway criado e iniciado com sucesso."
    else
        echo "[ERRO] Falha ao criar o container MCP Gateway."
        exit 1
    fi
fi

echo
echo "==================================================="
echo "Configuracao concluida com sucesso!"
echo "==================================================="
echo
echo "O Docker MCP Gateway esta rodando em: http://localhost:8080"
echo
echo "No Trae AI, va para Configuracoes > Desenvolvedor > MCP"
echo "e adicione o endpoint: http://localhost:8080"
echo
echo "Para mais informacoes, consulte o arquivo:"
echo "$(dirname "$0")/../.trae/README-MCP-DOCKER.md"
echo

read -p "Pressione Enter para continuar..."