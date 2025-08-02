@echo off
title Servidor de Impressao Bematech MP-4200 TH
color 0A

echo.
echo ========================================
echo  WILLIAM DISK PIZZA - SERVIDOR IMPRESSAO
echo  Bematech MP-4200 TH
echo ========================================
echo.

cd /d "%~dp0"

echo Iniciando servidor de impressao...
echo.

node server.js

pause