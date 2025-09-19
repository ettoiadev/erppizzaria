import { NextRequest } from 'next/server';
import { pool } from '@/lib/postgresql';
import { broadcastMessage, addConnection, removeConnection, getConnectionStats } from '@/lib/realtime-broadcast';

// Configurar listener PostgreSQL para notificações
let pgListener: any = null;

async function setupPostgreSQLListener() {
  if (pgListener) return;
  
  try {
    pgListener = await pool.connect();
    
    // Escutar notificações de mudanças em pedidos
    await pgListener.query('LISTEN order_changes');
    
    pgListener.on('notification', (msg: any) => {
      try {
        const data = JSON.parse(msg.payload);
        broadcastMessage('orders', data.operation.toLowerCase(), data.record);
      } catch (error) {
        console.error('Erro ao processar notificação PostgreSQL:', error);
      }
    });
    
    console.log('PostgreSQL listener configurado com sucesso');
  } catch (error) {
    console.error('Erro ao configurar PostgreSQL listener:', error);
  }
}

export async function GET(request: NextRequest) {
  // Configurar listener PostgreSQL na primeira conexão
  if (!pgListener) {
    await setupPostgreSQLListener();
  }
  
  const connectionId = Math.random().toString(36).substring(7);
  
  const stream = new ReadableStream({
    start(controller) {
      // Adicionar conexão ao mapa
      addConnection(connectionId, controller);
      
      // Enviar headers SSE
      const headers = [
        'Content-Type: text/event-stream',
        'Cache-Control: no-cache',
        'Connection: keep-alive',
        'Access-Control-Allow-Origin: *',
        'Access-Control-Allow-Headers: Cache-Control',
      ].join('\n') + '\n\n';
      
      // Enviar mensagem inicial
      const initialMessage = `data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));
      
      // Configurar ping para manter conexão viva
      const pingInterval = setInterval(() => {
        try {
          const pingMessage = `data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(pingMessage));
        } catch (error) {
          console.error('Erro ao enviar ping:', error);
          clearInterval(pingInterval);
          removeConnection(connectionId);
        }
      }, 30000); // Ping a cada 30 segundos
      
      // Cleanup quando conexão for fechada
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        removeConnection(connectionId);
        console.log(`Conexão ${connectionId} desconectada`);
      });
      
      console.log(`Nova conexão SSE estabelecida: ${connectionId}`);
    },
    
    cancel() {
      removeConnection(connectionId);
      console.log(`Conexão ${connectionId} cancelada`);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Endpoint para estatísticas (opcional)
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'stats') {
      return Response.json(getConnectionStats());
    }
    
    if (action === 'broadcast') {
      const { channel, event, payload } = await request.json();
      broadcastMessage(channel, event, payload);
      return Response.json({ success: true });
    }
    
    return Response.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error) {
    console.error('Erro no endpoint POST:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Cleanup quando o processo for encerrado
process.on('SIGTERM', () => {
  if (pgListener) {
    pgListener.release();
  }
});

process.on('SIGINT', () => {
  if (pgListener) {
    pgListener.release();
  }
});