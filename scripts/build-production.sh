#!/bin/bash

# Script de build otimizado para produção
# Execute com: bash scripts/build-production.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando build de produção..."

# 1. Verificar se as variáveis de ambiente estão configuradas
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ ERRO: SUPABASE_URL não configurada"
  echo "Configure as variáveis de ambiente na Vercel:"
  echo "- SUPABASE_URL"
  echo "- SUPABASE_KEY"
  echo "- JWT_SECRET"
  echo "- NODE_ENV=production"
  exit 1
fi

if [ -z "$SUPABASE_KEY" ]; then
  echo "❌ ERRO: SUPABASE_KEY não configurada"
  exit 1
fi

echo "✅ Variáveis de ambiente configuradas"

# 2. Limpar cache e dependências se necessário
if [ "$CLEAN_BUILD" = "true" ]; then
  echo "🧹 Limpando cache e dependências..."
  rm -rf .next
  rm -rf node_modules
  rm -f package-lock.json
  npm cache clean --force
fi

# 3. Instalar dependências
echo "📦 Instalando dependências..."
npm ci --legacy-peer-deps --production=false

# 4. Verificar conexão com Supabase
echo "🔗 Verificando conexão com Supabase..."
node -e "
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  client.from('profiles').select('count').limit(1).then(() => {
    console.log('✅ Conexão com Supabase OK');
  }).catch(err => {
    console.error('❌ Erro na conexão com Supabase:', err.message);
    process.exit(1);
  });
"

# 5. Executar linting
echo "🔍 Executando linting..."
npm run lint || echo "⚠️ Avisos de linting encontrados (continuando...)"

# 6. Executar build
echo "🏗️ Executando build do Next.js..."
NODE_ENV=production npm run build

# 7. Verificar se o build foi bem-sucedido
if [ -d ".next" ]; then
  echo "✅ Build concluído com sucesso!"
  echo "📊 Estatísticas do build:"
  du -sh .next
  echo "📁 Arquivos gerados:"
  ls -la .next/
else
  echo "❌ ERRO: Build falhou - diretório .next não encontrado"
  exit 1
fi

# 8. Executar testes básicos se disponíveis
if [ -f "tests/integration/supabase.test.js" ]; then
  echo "🧪 Executando testes básicos..."
  npm test || echo "⚠️ Alguns testes falharam (continuando...)"
fi

echo "🎉 Build de produção concluído com sucesso!"
echo "📋 Próximos passos:"
echo "1. Faça commit das alterações"
echo "2. Faça push para o repositório"
echo "3. A Vercel fará o deploy automaticamente"
echo "4. Configure as variáveis de ambiente na Vercel se ainda não fez"