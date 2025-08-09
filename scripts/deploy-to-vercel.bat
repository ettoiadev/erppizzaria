@echo off
setlocal enabledelayedexpansion

:: Script para facilitar o deploy na Vercel (Windows)

:: Cores para o terminal
set RESET=[0m
set BOLD=[1m
set GREEN=[32m
set YELLOW=[33m
set RED=[31m
set CYAN=[36m

echo.
echo %BOLD%%CYAN%=== Deploy para Vercel ===%RESET%
echo.

:: Verificar se a Vercel CLI está instalada
where vercel >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%Vercel CLI não encontrada. Instalando...%RESET%
    call npm install -g vercel
)

:: Verificar se o usuário está logado na Vercel
echo %BOLD%Verificando login na Vercel...%RESET%
vercel whoami >nul 2>&1

if %ERRORLEVEL% neq 0 (
    echo %YELLOW%Você não está logado na Vercel. Iniciando login...%RESET%
    call vercel login
)

:: Verificar se o arquivo .env.production.local existe
if not exist ".env.production.local" (
    echo %RED%Arquivo .env.production.local não encontrado.%RESET%
    echo Execute o script %CYAN%prepare-production.js%RESET% para configurar as variáveis de ambiente.
    exit /b 1
)

:: Perguntar se o usuário quer executar o script de verificação
echo.
set /p run_verification=%BOLD%Deseja executar a verificação de prontidão para produção? (s/n)%RESET% 

if /i "%run_verification%"=="s" (
    echo.
    echo %BOLD%Executando verificação...%RESET%
    node scripts/verify-production-readiness.js
    
    if %ERRORLEVEL% neq 0 (
        echo.
        echo %RED%A verificação falhou. Corrija os problemas antes de continuar.%RESET%
        set /p continue_anyway=Deseja continuar mesmo assim? (s/n) 
        
        if /i not "%continue_anyway%"=="s" (
            echo %YELLOW%Deploy cancelado.%RESET%
            exit /b 1
        )
    )
)

:: Perguntar se o usuário quer fazer build local antes do deploy
echo.
set /p run_build=%BOLD%Deseja fazer o build local antes do deploy? (s/n)%RESET% 

if /i "%run_build%"=="s" (
    echo.
    echo %BOLD%Executando build...%RESET%
    call npm run build
    
    if %ERRORLEVEL% neq 0 (
        echo.
        echo %RED%O build falhou. Corrija os erros antes de continuar.%RESET%
        exit /b 1
    )
)

:: Perguntar se o usuário quer fazer deploy para produção ou preview
echo.
set /p deploy_prod=%BOLD%Deseja fazer deploy para produção? (s/n)%RESET%
echo (Responder 'n' criará um ambiente de preview)

if /i "%deploy_prod%"=="s" (
    echo.
    echo %BOLD%%YELLOW%ATENÇÃO: Você está prestes a fazer deploy para PRODUÇÃO.%RESET%
    set /p confirm_prod=%YELLOW%Isso atualizará o site em produção. Tem certeza? (s/n)%RESET% 
    
    if /i "%confirm_prod%"=="s" (
        echo.
        echo %BOLD%Iniciando deploy para produção...%RESET%
        call vercel --prod
    ) else (
        echo %YELLOW%Deploy para produção cancelado.%RESET%
        exit /b 1
    )
) else (
    echo.
    echo %BOLD%Iniciando deploy para ambiente de preview...%RESET%
    call vercel
)

echo.
echo %BOLD%%GREEN%Deploy concluído!%RESET%