import { Pool } from 'pg';

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'erp_pizzaria',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '134679',
  ssl: process.env.POSTGRES_SSL === 'true' ? true : false, // Desabilitar SSL para desenvolvimento local
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Função para executar queries
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para executar transações
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para obter um cliente do pool (para operações mais complexas)
export async function getClient(): Promise<any> {
  return await pool.connect();
}

// Função para fechar o pool (útil para testes)
export async function closePool(): Promise<void> {
  await pool.end();
}

// Função para verificar a conexão com o banco
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Função helper para formatação de queries
export function buildWhereClause(conditions: Record<string, any>): { whereClause: string; values: any[] } {
  const keys = Object.keys(conditions).filter(key => conditions[key] !== undefined);
  if (keys.length === 0) {
    return { whereClause: '', values: [] };
  }
  
  const whereClause = 'WHERE ' + keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
  const values = keys.map(key => conditions[key]);
  
  return { whereClause, values };
}

// Função helper para inserção
export function buildInsertQuery(table: string, data: Record<string, any>): { query: string; values: any[] } {
  const keys = Object.keys(data);
  const columns = keys.join(', ');
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const values = keys.map(key => data[key]);
  
  const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
  
  return { query, values };
}

// Função helper para atualização
export function buildUpdateQuery(table: string, data: Record<string, any>, whereConditions: Record<string, any>): { query: string; values: any[] } {
  const dataKeys = Object.keys(data);
  const whereKeys = Object.keys(whereConditions);
  
  const setClause = dataKeys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const whereClause = whereKeys.map((key, index) => `${key} = $${dataKeys.length + index + 1}`).join(' AND ');
  
  const values = [...dataKeys.map(key => data[key]), ...whereKeys.map(key => whereConditions[key])];
  
  const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
  
  return { query, values };
}

// Função para testar conexão
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { success: true, message: 'Conexão com PostgreSQL estabelecida com sucesso' };
  } catch (error) {
    return { success: false, message: `Erro na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
  }
}

export default pool;