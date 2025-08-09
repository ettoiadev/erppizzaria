#!/usr/bin/env node

/**
 * Script para verificar se a aplicação está pronta para produção
 * Testa a conexão com o Supabase e outras configurações importantes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.production.local') });

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Função para verificar variáveis de ambiente
async function checkEnvironmentVariables() {
  console.log(`\n${colors.bright}Verificando variáveis de ambiente...${colors.reset}`);
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'JWT_SECRET',
    'NEXT_PUBLIC_SITE_URL'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`${colors.red}Variáveis de ambiente obrigatórias não encontradas:${colors.reset}`);
    missingVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log(`\nExecute o script prepare-production.js para configurar as variáveis.`);
    return false;
  }
  
  console.log(`${colors.green}✓ Todas as variáveis de ambiente obrigatórias estão configuradas.${colors.reset}`);
  return true;
}

// Função para testar a conexão com o Supabase
async function testSupabaseConnection() {
  console.log(`\n${colors.bright}Testando conexão com o Supabase...${colors.reset}`);
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log(`${colors.red}Credenciais do Supabase não configuradas.${colors.reset}`);
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar conexão com uma query simples
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log(`${colors.green}✓ Conexão com o Supabase estabelecida com sucesso.${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Erro ao conectar com o Supabase:${colors.reset}`, error.message);
    console.log(`\nVerifique se as credenciais estão corretas e se o projeto existe.`);
    return false;
  }
}

// Função para verificar tabelas essenciais
async function checkEssentialTables() {
  console.log(`\n${colors.bright}Verificando tabelas essenciais...${colors.reset}`);
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const essentialTables = [
      'profiles',
      'categories',
      'products',
      'orders',
      'order_items',
      'admin_settings'
    ];
    
    const missingTables = [];
    
    for (const table of essentialTables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') { // Código para tabela não existente
        missingTables.push(table);
      }
    }
    
    if (missingTables.length > 0) {
      console.log(`${colors.red}Tabelas essenciais não encontradas:${colors.reset}`);
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
      console.log(`\nExecute as migrações do Supabase para criar as tabelas.`);
      return false;
    }
    
    console.log(`${colors.green}✓ Todas as tabelas essenciais estão presentes.${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Erro ao verificar tabelas:${colors.reset}`, error.message);
    return false;
  }
}

// Função para verificar o build do Next.js
async function checkNextBuild() {
  console.log(`\n${colors.bright}Verificando build do Next.js...${colors.reset}`);
  
  try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    
    if (!fs.existsSync(nextConfigPath)) {
      console.log(`${colors.red}Arquivo next.config.js não encontrado.${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}✓ Arquivo next.config.js encontrado.${colors.reset}`);
    
    // Verificar se a pasta .next existe (indicando que o build foi feito)
    const buildFolderPath = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(buildFolderPath)) {
      console.log(`${colors.yellow}Pasta .next não encontrada. O build ainda não foi realizado.${colors.reset}`);
      console.log(`Execute ${colors.cyan}npm run build${colors.reset} para criar o build.`);
      return false;
    }
    
    console.log(`${colors.green}✓ Build do Next.js encontrado.${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Erro ao verificar build:${colors.reset}`, error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log(`${colors.bright}${colors.cyan}=== Verificação de Prontidão para Produção ===${colors.reset}\n`);
  
  let allChecksPass = true;
  
  // Verificar variáveis de ambiente
  const envVarsOk = await checkEnvironmentVariables();
  allChecksPass = allChecksPass && envVarsOk;
  
  // Testar conexão com o Supabase
  const supabaseConnectionOk = await testSupabaseConnection();
  allChecksPass = allChecksPass && supabaseConnectionOk;
  
  // Se a conexão com o Supabase estiver ok, verificar tabelas
  let tablesOk = true;
  if (supabaseConnectionOk) {
    tablesOk = await checkEssentialTables();
    allChecksPass = allChecksPass && tablesOk;
  }
  
  // Verificar build do Next.js
  const buildOk = await checkNextBuild();
  allChecksPass = allChecksPass && buildOk;
  
  // Resultado final
  console.log(`\n${colors.bright}${colors.cyan}=== Resultado da Verificação ===${colors.reset}`);
  
  if (allChecksPass) {
    console.log(`\n${colors.green}${colors.bright}✓ Aplicação pronta para produção!${colors.reset}`);
    console.log(`\nPara fazer o deploy na Vercel:`);
    console.log(`1. Certifique-se de que seu código está no repositório Git`);
    console.log(`2. Conecte o repositório na Vercel`);
    console.log(`3. Configure as variáveis de ambiente na Vercel`);
    console.log(`4. Inicie o deploy`);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ A aplicação não está pronta para produção.${colors.reset}`);
    console.log(`\nResolva os problemas indicados acima antes de fazer o deploy.`);
  }
}

main().catch(error => {
  console.error(`${colors.red}Erro inesperado:${colors.reset}`, error);
  process.exit(1);
});