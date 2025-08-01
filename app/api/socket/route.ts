import { NextRequest, NextResponse } from 'next/server';
import { initializeSocketServer, getSocketServer, getConnectionStats } from '@/lib/socket-server';

// Esta rota é chamada automaticamente pelo Next.js para inicializar o Socket.io
export async function GET(request: NextRequest) {
  try {
    // Verificar se o Socket.io já está inicializado
    const existingServer = getSocketServer();
    
    if (existingServer) {
      const stats = getConnectionStats();
      return NextResponse.json({
        success: true,
        message: 'Socket.io já está rodando',
        stats
      });
    }

    // Note: Em Next.js 13+ com App Router, o Socket.io precisa ser inicializado
    // de forma diferente. Esta é uma implementação de fallback.
    
    return NextResponse.json({
      success: true,
      message: 'Socket.io será inicializado quando necessário',
      note: 'Use o hook useSocket no frontend para conectar'
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar Socket.io:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}

// Endpoint para obter estatísticas do Socket.io
export async function POST(request: NextRequest) {
  try {
    const stats = getConnectionStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter estatísticas do Socket.io:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}