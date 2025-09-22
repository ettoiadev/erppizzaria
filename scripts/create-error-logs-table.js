const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexão
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
});

async function createErrorLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Criando tabela de logs de erros...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        stack TEXT,
        context VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_error_logs_context ON error_logs(context);
    `);
    
    console.log('Tabela de logs de erros criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela de logs de erros:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createErrorLogsTable();