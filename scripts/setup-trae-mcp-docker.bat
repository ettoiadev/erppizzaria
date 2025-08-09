@echo off
echo ===================================================
echo Configuracao do Docker MCP para Trae AI
echo ===================================================
echo.

REM Verificar se o Docker esta instalado
docker --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Docker nao encontrado. Por favor, instale o Docker Desktop.
    echo Visite: https://www.docker.com/products/docker-desktop/
    exit /b 1
)

echo [OK] Docker encontrado.
echo.

REM Verificar se o diretorio .trae existe
if not exist "%~dp0\../.trae" (
    echo Criando diretorio .trae...
    mkdir "%~dp0\../.trae"
)

REM Verificar se o arquivo de configuracao existe
if not exist "%~dp0\../.trae/mcp-docker-config.json" (
    echo Criando arquivo de configuracao MCP...
    echo {
    echo   "mcp_servers": [
    echo     {
    echo       "server_name": "mcp.config.usrlocalmcp.supabase",
    echo       "description": "Supabase MCP Server para integracao com banco de dados",
    echo       "docker": {
    echo         "image": "supabase/mcp-server:latest",
    echo         "container_name": "supabase-mcp-server",
    echo         "ports": ["3000:3000"],
    echo         "environment": [
    echo           "SUPABASE_URL=${SUPABASE_URL}",
    echo           "SUPABASE_KEY=${SUPABASE_KEY}"
    echo         ],
    echo         "volumes": [
    echo           "${PWD}/supabase:/app/supabase"
    echo         ]
    echo       }
    echo     }
    echo   ],
    echo   "mcp_gateway": {
    echo     "enabled": true,
    echo     "host": "localhost",
    echo     "port": 8080,
    echo     "log_level": "info"
    echo   }
    echo } > "%~dp0\../.trae/mcp-docker-config.json"
)

echo [OK] Arquivo de configuracao MCP verificado.
echo.

REM Verificar se o container MCP Gateway ja existe
docker ps -a | findstr mcp-gateway > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo O container MCP Gateway ja existe.
    
    REM Verificar se o container esta rodando
    docker ps | findstr mcp-gateway > nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MCP Gateway ja esta em execucao.
    ) else (
        echo Iniciando MCP Gateway...
        docker start mcp-gateway
        if %ERRORLEVEL% EQU 0 (
            echo [OK] MCP Gateway iniciado com sucesso.
        ) else (
            echo [ERRO] Falha ao iniciar o MCP Gateway.
            exit /b 1
        )
    )
) else (
    echo Criando e iniciando o container MCP Gateway...
    docker run -d --name mcp-gateway ^  
        -p 8080:8080 ^  
        -v /var/run/docker.sock:/var/run/docker.sock ^  
        -v "%~dp0\../.trae":/config ^  
        docker/mcp-gateway:latest
    
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MCP Gateway criado e iniciado com sucesso.
    ) else (
        echo [ERRO] Falha ao criar o container MCP Gateway.
        exit /b 1
    )
)

echo.
echo ===================================================
echo Configuracao concluida com sucesso!
echo ===================================================
echo.
echo O Docker MCP Gateway esta rodando em: http://localhost:8080
echo.
echo No Trae AI, va para Configuracoes > Desenvolvedor > MCP
echo e adicione o endpoint: http://localhost:8080
echo.
echo Para mais informacoes, consulte o arquivo:
echo %~dp0\../.trae/README-MCP-DOCKER.md
echo.

pause