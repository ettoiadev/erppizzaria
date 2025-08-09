@echo off
echo Executando teste de conexao com Supabase...
echo.

REM Verificar se o arquivo .env.local existe
if not exist .env.local (
  echo Arquivo .env.local nao encontrado!
  echo Por favor, crie o arquivo .env.local com as variaveis de ambiente do Supabase.
  echo.
  pause
  exit /b 1
)

REM Executar o script de teste
echo Executando teste de conexao...
echo.

REM Verificar se o TypeScript está instalado globalmente
where /q ts-node
if %ERRORLEVEL% neq 0 (
  echo ts-node nao encontrado, usando versao JavaScript...
  node scripts/test-supabase-connection.js
) else (
  echo Usando ts-node para executar o teste...
  ts-node scripts/test-supabase-connection.ts
)

echo.
echo Teste concluido!
pause