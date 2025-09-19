const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'erp_pizzaria',
  user: 'postgres',
  password: '134679'
});

async function runSeeds() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Iniciando execução dos seeds de desenvolvimento...');
    
    // Ler o arquivo SQL
    const seedsPath = path.join(__dirname, 'development-seeds.sql');
    const seedsSQL = fs.readFileSync(seedsPath, 'utf8');
    
    // Executar o SQL
    await client.query(seedsSQL);
    
    console.log('✅ Seeds executados com sucesso!');
    console.log('📊 Dados de desenvolvimento inseridos:');
    console.log('   - Categorias: Pizza, Bebida, Sobremesa, Entrada');
    console.log('   - Produtos: 8 produtos de exemplo');
    console.log('   - Usuários: admin@pizzaria.com, teste@pizzaria.com');
    console.log('   - Endereços: 2 endereços de teste');
    console.log('   - Configurações: Sistema configurado');
    
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeds();