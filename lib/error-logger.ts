// Sistema de monitoramento de erros para a área administrativa
import { query } from './database';

// Interface para os erros
export interface ErrorLog {
  id?: number;
  message: string;
  stack?: string;
  context: string;
  user_id?: string;
  created_at?: Date;
}

// Função para registrar erros no banco de dados
export async function logError(error: Error | string, context: string, userId?: string): Promise<void> {
  try {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    // Inserir o erro no banco de dados
    await query(
      `INSERT INTO error_logs (message, stack, context, user_id) 
       VALUES ($1, $2, $3, $4)`,
      [message, stack, context, userId]
    );

    // Log no console em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERRO] ${context}: ${message}`);
      if (stack) console.error(stack);
    }
  } catch (logError) {
    // Fallback para console em caso de falha no registro
    console.error('[ERRO AO REGISTRAR ERRO]', logError);
    console.error('Erro original:', error);
  }
}

// Função para listar erros recentes
export async function getRecentErrors(limit = 50): Promise<ErrorLog[]> {
  try {
    const result = await query(
      `SELECT id, message, stack, context, user_id, created_at 
       FROM error_logs 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar logs de erros:', error);
    return [];
  }
}

// Função para limpar erros antigos (manter apenas os últimos 1000)
export async function cleanupOldErrors(): Promise<void> {
  try {
    await query(
      `DELETE FROM error_logs 
       WHERE id NOT IN (
         SELECT id FROM error_logs 
         ORDER BY created_at DESC 
         LIMIT 1000
       )`
    );
  } catch (error) {
    console.error('Erro ao limpar logs antigos:', error);
  }
}

// Middleware para capturar erros em APIs
export function withErrorLogging(handler: Function) {
  return async (req: any, res: any) => {
    try {
      return await handler(req, res);
    } catch (error) {
      const userId = req.session?.user?.id;
      const path = req.url || 'API desconhecida';
      
      await logError(
        error as Error, 
        `API: ${path}`, 
        userId
      );
      
      // Responder com erro 500
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Erro interno do servidor',
          errorId: Date.now().toString(36) // ID para rastreamento
        });
      }
    }
  };
}