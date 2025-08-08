@echo off
echo ========================================
echo    VERIFICACAO DE SERVIDORES
echo ========================================
echo.

echo Verificando servidores...
echo.

echo [1] Next.js (Porta 3000):
netstat -an | findstr :3000
echo.

echo [2] Socket.io (Porta 3001):
netstat -an | findstr :3001
echo.

echo [3] Print Server (Porta 3002):
netstat -an | findstr :3002
echo.

echo ========================================
echo Verificacao concluida!
echo ========================================

pause 