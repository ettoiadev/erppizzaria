#!/bin/bash

echo "Executando teste de conexão com Supabase..."
echo ""

# Verificar se o arquivo .env.local existe
if [ ! -f .env.local ]; then
  echo "Arquivo .env.local não encontrado!"
  echo "Por favor, crie o arquivo .env.local com as variáveis de ambiente do Supabase."
  echo ""
  exit 1
fi

# Executar o script de teste
echo "Executando teste de conexão..."
echo ""

# Verificar se o TypeScript está instalado globalmente
if command -v ts-node &> /dev/null; then
  echo "Usando ts-node para executar o teste..."
  ts-node scripts/test-supabase-connection.ts
else
  echo "ts-node não encontrado, usando versão JavaScript..."
  node scripts/test-supabase-connection.js
fi

echo ""
echo "Teste concluído!"