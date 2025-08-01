import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

export interface SocketServer extends NextApiResponse {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
}

let io: SocketIOServer | null = null;

// Inicializar servidor Socket.io
export function initializeSocketServer(server: HTTPServer): SocketIOServer {
  if (!io) {
    console.log('🔌 Inicializando servidor Socket.io...');
    
    io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Middleware de autenticação
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      // Aqui você pode implementar validação de JWT se necessário
      console.log('👤 Cliente conectando...', {
        id: socket.id,
        hasToken: !!token
      });
      next();
    });

    // Eventos de conexão
    io.on('connection', (socket) => {
      console.log('✅ Cliente conectado:', socket.id);

      // Cliente se junta a uma sala específica (ex: cozinha, admin)
      socket.on('join-room', (room: string) => {
        socket.join(room);
        console.log(`🏠 Cliente ${socket.id} entrou na sala: ${room}`);
        
        // Confirmar entrada na sala
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
      
      // Notificar novo pedido
      socket.on('new-order', (orderData) => {
        console.log('🍕 Novo pedido recebido via socket:', orderData.id);
        
        // Notificar cozinha
        socket.to('kitchen').emit('order-received', orderData);
        
        // Notificar admin
        socket.to('admin').emit('order-received', orderData);
      });

      // Atualizar status do pedido
      socket.on('update-order-status', (data) => {
        console.log('📋 Status do pedido atualizado:', {
          orderId: data.orderId,
          status: data.status
        });
        
        // Notificar todas as salas relevantes
        socket.to('kitchen').emit('order-status-updated', data);
        socket.to('admin').emit('order-status-updated', data);
        socket.to(`order-${data.orderId}`).emit('order-status-updated', data);
      });

      // Notificar pagamento aprovado
      socket.on('payment-approved', (data) => {
        console.log('💰 Pagamento aprovado:', data.orderId);
        
        socket.to('kitchen').emit('payment-approved', data);
        socket.to('admin').emit('payment-approved', data);
        socket.to(`order-${data.orderId}`).emit('payment-approved', data);
      });
    });

    console.log('✅ Servidor Socket.io inicializado com sucesso');
  }

  return io;
}

// Obter instância do Socket.io
export function getSocketServer(): SocketIOServer | null {
  return io;
}

// Emitir evento para uma sala específica
export function emitToRoom(room: string, event: string, data: any) {
  if (io) {
    console.log(`📡 Emitindo evento '${event}' para sala '${room}':`, data);
    io.to(room).emit(event, data);
    return true;
  }
  console.warn('⚠️ Socket.io não inicializado');
  return false;
}

// Emitir evento para todos os clientes
export function emitToAll(event: string, data: any) {
  if (io) {
    console.log(`📡 Emitindo evento '${event}' para todos:`, data);
    io.emit(event, data);
    return true;
  }
  console.warn('⚠️ Socket.io não inicializado');
  return false;
}

// Emitir evento para cliente específico
export function emitToClient(clientId: string, event: string, data: any) {
  if (io) {
    console.log(`📡 Emitindo evento '${event}' para cliente '${clientId}':`, data);
    io.to(clientId).emit(event, data);
    return true;
  }
  console.warn('⚠️ Socket.io não inicializado');
  return false;
}

// Obter lista de clientes conectados em uma sala
export function getClientsInRoom(room: string): Promise<string[]> {
  return new Promise((resolve) => {
    if (io) {
      io.in(room).fetchSockets().then(sockets => {
        resolve(sockets.map(socket => socket.id));
      });
    } else {
      resolve([]);
    }
  });
}

// Obter estatísticas de conexões
export function getConnectionStats() {
  if (io) {
    return {
      connected: io.engine.clientsCount,
      rooms: Array.from(io.sockets.adapter.rooms.keys())
    };
  }
  return { connected: 0, rooms: [] };
}

// Notificações específicas da pizzaria

// Notificar novo pedido
export function notifyNewOrder(orderData: any) {
  emitToRoom('kitchen', 'order-received', orderData);
  emitToRoom('admin', 'order-received', orderData);
}

// Notificar mudança de status do pedido
export function notifyOrderStatusChange(orderId: string, status: string, orderData?: any) {
  const data = { orderId, status, ...orderData };
  
  emitToRoom('kitchen', 'order-status-updated', data);
  emitToRoom('admin', 'order-status-updated', data);
  emitToRoom(`order-${orderId}`, 'order-status-updated', data);
}

// Notificar pagamento aprovado
export function notifyPaymentApproved(orderId: string, paymentData?: any) {
  const data = { orderId, ...paymentData };
  
  emitToRoom('kitchen', 'payment-approved', data);
  emitToRoom('admin', 'payment-approved', data);
  emitToRoom(`order-${orderId}`, 'payment-approved', data);
}

// Notificar pedido pronto para entrega
export function notifyOrderReady(orderId: string, orderData?: any) {
  const data = { orderId, ...orderData };
  
  emitToRoom('delivery', 'order-ready', data);
  emitToRoom('admin', 'order-ready', data);
  emitToRoom(`order-${orderId}`, 'order-ready', data);
}

export default io;