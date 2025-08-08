import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Variável global para manter a instância do Socket.io
let io: SocketIOServer | null = null;

// Função para inicializar o Socket.io
function initializeSocketServer() {
  if (!io) {
    console.log('🔌 Inicializando servidor Socket.io...');
    
    // Criar servidor HTTP temporário para o Socket.io
    const httpServer = new HTTPServer();
    
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Middleware de autenticação
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      console.log('👤 Cliente conectando...', {
        id: socket.id,
        hasToken: !!token
      });
      next();
    });

    // Eventos de conexão
    io.on('connection', (socket) => {
      console.log('✅ Cliente conectado:', socket.id);

      // Cliente se junta a uma sala específica
      socket.on('join-room', (room: string) => {
        socket.join(room);
        console.log(`🏠 Cliente ${socket.id} entrou na sala: ${room}`);
        socket.emit('room-joined', { room, clientId: socket.id });
      });

      // Cliente sai de uma sala
      socket.on('leave-room', (room: string) => {
        socket.leave(room);
        console.log(`🚪 Cliente ${socket.id} saiu da sala: ${room}`);
      });

      // Ping/Pong para manter conexão ativa
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Evento de desconexão
      socket.on('disconnect', (reason) => {
        console.log('❌ Cliente desconectado:', {
          id: socket.id,
          reason
        });
      });

      // Eventos específicos da pizzaria
      socket.on('new-order', (orderData) => {
        console.log('🍕 Novo pedido recebido via socket:', orderData.id);
        socket.to('kitchen').emit('order-received', orderData);
        socket.to('admin').emit('order-received', orderData);
      });

      socket.on('update-order-status', (data) => {
        console.log('📋 Status do pedido atualizado:', {
          orderId: data.orderId,
          status: data.status
        });
        
        socket.to('kitchen').emit('order-status-updated', data);
        socket.to('admin').emit('order-status-updated', data);
        socket.to(`order-${data.orderId}`).emit('order-status-updated', data);
      });

      socket.on('payment-approved', (data) => {
        console.log('💰 Pagamento aprovado:', data.orderId);
        
        socket.to('kitchen').emit('payment-approved', data);
        socket.to('admin').emit('payment-approved', data);
        socket.to(`order-${data.orderId}`).emit('payment-approved', data);
      });
    });

    // Iniciar o servidor HTTP
    const port = process.env.SOCKET_PORT || 3001;
    httpServer.listen(port, () => {
      console.log(`✅ Servidor Socket.io rodando na porta ${port}`);
    });

    console.log('✅ Servidor Socket.io inicializado com sucesso');
  }

  return io;
}

// Função para obter estatísticas de conexões
function getConnectionStats() {
  if (io) {
    return {
      connected: io.engine.clientsCount,
      rooms: Array.from(io.sockets.adapter.rooms.keys())
    };
  }
  return { connected: 0, rooms: [] };
}

// Esta rota é chamada automaticamente pelo Next.js para inicializar o Socket.io
export async function GET(request: NextRequest) {
  try {
    // Inicializar Socket.io se não estiver rodando
    const socketServer = initializeSocketServer();
    
    if (socketServer) {
      const stats = getConnectionStats();
      return NextResponse.json({
        success: true,
        message: 'Socket.io está rodando',
        stats,
        serverUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Erro ao inicializar Socket.io'
    }, { status: 500 });

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