import { NextResponse } from 'next/server';
import { getRecentErrors, cleanupOldErrors } from '@/lib/error-logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Rota para obter logs de erros recentes (apenas para administradores)
export async function GET() {
  try {
    // Verificar autenticação e autorização
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Limpar erros antigos automaticamente a cada requisição
    await cleanupOldErrors();
    
    // Obter erros recentes
    const errors = await getRecentErrors(100);
    
    return NextResponse.json({ errors });
  } catch (error) {
    console.error('Erro ao buscar logs de erros:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar logs de erros' },
      { status: 500 }
    );
  }
}