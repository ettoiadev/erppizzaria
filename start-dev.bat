@echo off
echo 🚀 Iniciando William Disk Pizza - Modo Desenvolvimento
echo.

echo 📦 Instalando dependências...
npm install

echo.
echo 🌐 Iniciando servidor Next.js na porta 3000...
start "Next.js Server" cmd /k "npm run dev"

echo.
echo ✅ Servidor iniciado!
echo 📍 Next.js: http://localhost:3000
echo.
echo 💡 Para parar o servidor, feche a janela do terminal
pause 