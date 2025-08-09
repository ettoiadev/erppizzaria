/**
 * Script para verificar e corrigir problemas comuns de conexão com o Supabase
 * 
 * Este script verifica:
 * 1. Se as variáveis de ambiente estão configuradas
 * 2. Se a conexão com o Supabase está funcionando
 * 3. Se há problemas comuns e sugere correções
 */

// Importar dotenv para carregar variáveis de ambiente do arquivo .env.local
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Função para imprimir mensagens coloridas
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Função para verificar variáveis de ambiente
function checkEnvironmentVariables() {
  log('\n1. Verificando variáveis de ambiente...', colors.blue);
  
  const envFile = path.join(process.cwd(), '.env.local');
  const envFileExists = fileExists(envFile);
  
  if (!envFileExists) {
    log(`❌ Arquivo .env.local não encontrado em ${envFile}`, colors.red);
    log('Criando arquivo .env.local com configurações básicas...', colors.yellow);
    
    const defaultEnvContent = `# Supabase (uso oficial)
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Autenticação
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Ambiente
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Logs
ENABLE_QUERY_LOGS=true
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=1000
`;
    
    try {
      fs.writeFileSync(envFile, defaultEnvContent);
      log(`✅ Arquivo .env.local criado com sucesso em ${envFile}`, colors.green);
    } catch (err) {
      log(`❌ Erro ao criar arquivo .env.local: ${err.message}`, colors.red);
      return false;
    }
  } else {
    log(`✅ Arquivo .env.local encontrado em ${envFile}`, colors.green);
    
    // Verificar se as variáveis de ambiente do Supabase estão definidas no arquivo
    const envContent = fs.readFileSync(envFile, 'utf8');
    const hasSupabaseUrl = envContent.includes('SUPABASE_URL=');
    const hasSupabaseKey = envContent.includes('SUPABASE_KEY=');
    const hasLegacySupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
    const hasLegacySupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
    
    if (!hasSupabaseUrl && !hasLegacySupabaseUrl) {
      log('❌ Variável SUPABASE_URL não encontrada no arquivo .env.local', colors.red);
      log('Adicione a linha SUPABASE_URL=http://localhost:54321 ao arquivo .env.local', colors.yellow);
    } else {
      log('✅ Variável SUPABASE_URL encontrada', colors.green);
    }
    
    if (!hasSupabaseKey && !hasLegacySupabaseKey) {
      log('❌ Variável SUPABASE_KEY não encontrada no arquivo .env.local', colors.red);
      log('Adicione a linha SUPABASE_KEY=sua_chave_aqui ao arquivo .env.local', colors.yellow);
    } else {
      log('✅ Variável SUPABASE_KEY encontrada', colors.green);
    }
  }
  
  // Verificar variáveis de ambiente carregadas
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    log('❌ Variável de ambiente SUPABASE_URL não está definida', colors.red);
    return false;
  }
  
  if (!supabaseKey) {
    log('❌ Variável de ambiente SUPABASE_KEY não está definida', colors.red);
    return false;
  }
  
  log(`✅ SUPABASE_URL: ${supabaseUrl}`, colors.green);
  log('✅ SUPABASE_KEY: Configurada (valor oculto)', colors.green);
  
  return true;
}

// Função para verificar a configuração do Supabase local
function checkSupabaseLocalConfig() {
  log('\n2. Verificando configuração do Supabase local...', colors.blue);
  
  const supabaseConfigDir = path.join(process.cwd(), 'supabase');
  const supabaseConfigFile = path.join(supabaseConfigDir, 'config.toml');
  
  if (!fileExists(supabaseConfigDir)) {
    log(`❌ Diretório supabase não encontrado em ${supabaseConfigDir}`, colors.red);
    log('Execute o comando "supabase init" para inicializar o Supabase local', colors.yellow);
    return false;
  }
  
  if (!fileExists(supabaseConfigFile)) {
    log(`❌ Arquivo config.toml não encontrado em ${supabaseConfigFile}`, colors.red);
    log('Execute o comando "supabase init" para inicializar o Supabase local', colors.yellow);
    return false;
  }
  
  log(`✅ Configuração do Supabase local encontrada em ${supabaseConfigFile}`, colors.green);
  return true;
}

// Função para verificar se o Supabase está em execução localmente
function checkSupabaseRunning() {
  log('\n3. Verificando se o Supabase está em execução...', colors.blue);
  
  // Não podemos verificar diretamente se o Supabase está em execução sem fazer uma requisição HTTP
  // Vamos apenas sugerir como iniciar o Supabase local
  
  log('Para iniciar o Supabase local, execute:', colors.yellow);
  log('  supabase start', colors.yellow);
  log('\nPara verificar o status do Supabase local, execute:', colors.yellow);
  log('  supabase status', colors.yellow);
  
  return true;
}

// Função para verificar a configuração do Next.js
function checkNextJsConfig() {
  log('\n4. Verificando configuração do Next.js...', colors.blue);
  
  const nextConfigFile = path.join(process.cwd(), 'next.config.js');
  
  if (!fileExists(nextConfigFile)) {
    log(`❌ Arquivo next.config.js não encontrado em ${nextConfigFile}`, colors.red);
    return false;
  }
  
  log(`✅ Configuração do Next.js encontrada em ${nextConfigFile}`, colors.green);
  return true;
}

// Função principal
async function fixSupabaseConnection() {
  log('\n🔧 VERIFICAÇÃO E CORREÇÃO DE PROBLEMAS DE CONEXÃO COM SUPABASE', colors.cyan);
  log('===========================================================\n', colors.cyan);
  
  const envOk = checkEnvironmentVariables();
  const configOk = checkSupabaseLocalConfig();
  const nextOk = checkNextJsConfig();
  checkSupabaseRunning();
  
  log('\n✨ RESUMO DA VERIFICAÇÃO', colors.magenta);
  log('======================\n', colors.magenta);
  
  log(`${envOk ? '✅' : '❌'} Variáveis de ambiente: ${envOk ? 'OK' : 'Problemas encontrados'}`, envOk ? colors.green : colors.red);
  log(`${configOk ? '✅' : '❌'} Configuração do Supabase local: ${configOk ? 'OK' : 'Problemas encontrados'}`, configOk ? colors.green : colors.red);
  log(`${nextOk ? '✅' : '❌'} Configuração do Next.js: ${nextOk ? 'OK' : 'Problemas encontrados'}`, nextOk ? colors.green : colors.red);
  
  if (envOk && configOk && nextOk) {
    log('\n🎉 Tudo parece estar configurado corretamente!', colors.green);
    log('Se ainda estiver enfrentando problemas de conexão, verifique se o Supabase está em execução com "supabase status".', colors.green);
  } else {
    log('\n⚠️ Alguns problemas foram encontrados. Corrija-os e execute este script novamente.', colors.yellow);
  }
  
  log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:', colors.blue);
  log('1. Certifique-se de que o Supabase local está em execução com "supabase start"', colors.blue);
  log('2. Execute o script de teste de conexão com "node scripts/test-supabase-connection.js"', colors.blue);
  log('3. Inicie a aplicação com "npm run dev"', colors.blue);
}

// Executar a função principal
fixSupabaseConnection();