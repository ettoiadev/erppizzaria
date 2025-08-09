#!/usr/bin/env node

/**
 * Script para preparar o ambiente de produção
 * Verifica e configura as variáveis de ambiente necessárias para deploy na Vercel com Supabase
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const ENV_FILE_PATH = path.join(process.cwd(), '.env.production.local');
const REQUIRED_VARS = [
  { name: 'SUPABASE_URL', description: 'URL do projeto Supabase (ex: https://xyz.supabase.co)' },
  { name: 'SUPABASE_KEY', description: 'Chave service_role ou anon do Supabase' },
  { name: 'JWT_SECRET', description: 'Chave secreta para autenticação JWT' },
  { name: 'NEXT_PUBLIC_SITE_URL', description: 'URL do site em produção' },
  { name: 'NODE_ENV', default: 'production', description: 'Ambiente (production)' },
];

const OPTIONAL_VARS = [
  { name: 'MERCADOPAGO_ACCESS_TOKEN', description: 'Token de acesso do Mercado Pago' },
  { name: 'MERCADOPAGO_WEBHOOK_SECRET', description: 'Secret para webhooks do Mercado Pago' },
  { name: 'ENABLE_QUERY_LOGS', default: 'false', description: 'Habilitar logs de queries (true/false)' },
  { name: 'ENABLE_SLOW_QUERY_LOGS', default: 'true', description: 'Habilitar logs de queries lentas (true/false)' },
  { name: 'SLOW_QUERY_THRESHOLD', default: '1000', description: 'Limite para considerar uma query lenta (ms)' },
];

// Função para ler as variáveis de ambiente existentes
function readEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const envVars = {};
      
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim();
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error(`${colors.red}Erro ao ler arquivo .env:${colors.reset}`, error.message);
  }
  
  return {};
}

// Função para salvar as variáveis de ambiente
function saveEnvFile(filePath, envVars) {
  try {
    const content = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${colors.green}Arquivo ${filePath} salvo com sucesso!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Erro ao salvar arquivo .env:${colors.reset}`, error.message);
  }
}

// Função para perguntar ao usuário
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// Função principal
async function main() {
  console.log(`\n${colors.bright}${colors.cyan}=== Preparação para Deploy em Produção ===${colors.reset}\n`);
  console.log(`Este script irá ajudar a configurar as variáveis de ambiente necessárias`);
  console.log(`para o deploy da aplicação na Vercel com banco de dados Supabase.\n`);
  
  // Ler variáveis existentes
  const existingVars = readEnvFile(ENV_FILE_PATH);
  const newVars = { ...existingVars };
  
  // Processar variáveis obrigatórias
  console.log(`${colors.bright}Variáveis de Ambiente Obrigatórias:${colors.reset}`);
  for (const variable of REQUIRED_VARS) {
    const currentValue = existingVars[variable.name] || variable.default || '';
    const question = `${colors.yellow}${variable.name}${colors.reset} (${variable.description})\n[${currentValue || 'não definido'}]: `;
    
    const answer = await askQuestion(question);
    newVars[variable.name] = answer || currentValue;
    
    if (!newVars[variable.name]) {
      console.log(`${colors.red}Atenção: ${variable.name} não foi definido. Esta variável é obrigatória.${colors.reset}`);
    }
  }
  
  // Processar variáveis opcionais
  console.log(`\n${colors.bright}Variáveis de Ambiente Opcionais:${colors.reset}`);
  for (const variable of OPTIONAL_VARS) {
    const currentValue = existingVars[variable.name] || variable.default || '';
    const question = `${colors.yellow}${variable.name}${colors.reset} (${variable.description})\n[${currentValue || 'não definido'}]: `;
    
    const answer = await askQuestion(question);
    newVars[variable.name] = answer || currentValue;
  }
  
  // Salvar as variáveis
  const shouldSave = await askQuestion(`\n${colors.bright}Deseja salvar estas configurações em ${ENV_FILE_PATH}? (s/n)${colors.reset} `);
  
  if (shouldSave.toLowerCase() === 's') {
    saveEnvFile(ENV_FILE_PATH, newVars);
    console.log(`\n${colors.green}Configuração concluída!${colors.reset}`);
    console.log(`\nPara usar estas variáveis no deploy da Vercel:`);
    console.log(`1. Acesse o dashboard da Vercel`);
    console.log(`2. Vá para as configurações do projeto`);
    console.log(`3. Na seção "Environment Variables", adicione cada uma das variáveis configuradas`);
  } else {
    console.log(`\n${colors.yellow}Configuração não salva.${colors.reset}`);
  }
  
  // Verificar se o Supabase CLI está instalado
  console.log(`\n${colors.bright}Verificando Supabase CLI...${colors.reset}`);
  try {
    execSync('npx supabase --version', { stdio: 'ignore' });
    console.log(`${colors.green}Supabase CLI está instalado.${colors.reset}`);
    
    const shouldPushDb = await askQuestion(`\n${colors.bright}Deseja enviar as migrações para o Supabase em produção? (s/n)${colors.reset} `);
    
    if (shouldPushDb.toLowerCase() === 's') {
      console.log(`\nPara enviar as migrações, execute os seguintes comandos:`);
      console.log(`\n${colors.cyan}npx supabase login${colors.reset}`);
      console.log(`${colors.cyan}npx supabase link --project-ref <project-id>${colors.reset}`);
      console.log(`${colors.cyan}npx supabase db push${colors.reset}`);
      
      console.log(`\nO project-id pode ser encontrado nas configurações do projeto no dashboard do Supabase.`);
    }
  } catch (error) {
    console.log(`${colors.yellow}Supabase CLI não está instalado. Recomendamos instalar para gerenciar migrações:${colors.reset}`);
    console.log(`npm install supabase --save-dev`);
  }
  
  rl.close();
}

main();