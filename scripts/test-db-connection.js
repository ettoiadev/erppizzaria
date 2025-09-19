// Script para testar a conexão com o banco de dados
const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'erp_pizzaria',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '134679',
  ssl: process.env.POSTGRES_SSL === 'true' ? true : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  console.log('Testando conexão com o banco de dados...');
  
  try {
    const client = await pool.connect();
    console.log('Conexão estabelecida com sucesso!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Consulta executada com sucesso:', result.rows[0]);
    
    client.release();
    console.log('Conexão liberada.');
    
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    return false;
  } finally {
    await pool.end();
    console.log('Pool de conexões encerrado.');
  }
}

testConnection();