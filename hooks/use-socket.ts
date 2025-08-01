'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  room?: string;
  autoConnect?: boolean;
  token?: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  emit: (event: string, data?: any) => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { room, autoConnect = true, token } = options;
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      console.log('Socket já está conectado');
      return;
    }

    try {
      console.log('🔌 Conectando ao Socket.io...');
      
      const socketUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      socketRef.current = io(socketUrl, {
        path: '/api/socket',
        addTrailingSlash: false,
        auth: {
          token: token || localStorage.getItem('auth_token')
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        retries: 3
      });

      // Event listeners
      socketRef.current.on('connect', () => {
        console.log('✅ Socket conectado:', socketRef.current?.id);
        setConnected(true);
        setError(null);

        // Entrar na sala automaticamente se especificada
        if (room) {
          joinRoom(room);
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Socket desconectado:', reason);
        setConnected(false);
        
        if (reason === 'io server disconnect') {
          // Reconectar se o servidor desconectou
          setTimeout(() => {
            socketRef.current?.connect();
          }, 1000);
        }
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('❌ Erro de conexão Socket:', err);
        setError(err.message);
        setConnected(false);
      });

      socketRef.current.on('room-joined', (data) => {
        console.log('🏠 Entrou na sala:', data);
      });

      // Manter conexão ativa com ping/pong
      const pingInterval = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('ping');
        }
      }, 30000); // 30 segundos

      socketRef.current.on('pong', () => {
        // Conexão está ativa
      });

      // Cleanup do interval
      socketRef.current.on('disconnect', () => {
        clearInterval(pingInterval);
      });

    } catch (err: any) {
      console.error('❌ Erro ao criar socket:', err);
      setError(err.message);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log('🔌 Desconectando socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  };

  const joinRoom = (roomName: string) => {
    if (socketRef.current?.connected) {
      console.log('🏠 Entrando na sala:', roomName);
      socketRef.current.emit('join-room', roomName);
    } else {
      console.warn('⚠️ Socket não conectado, não foi possível entrar na sala:', roomName);
    }
  };

  const leaveRoom = (roomName: string) => {
    if (socketRef.current?.connected) {
      console.log('🚪 Saindo da sala:', roomName);
      socketRef.current.emit('leave-room', roomName);
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ Socket não conectado, não foi possível emitir evento:', event);
    }
  };

  // Auto-conectar se habilitado
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Mudar de sala se a prop room mudar
  useEffect(() => {
    if (connected && room) {
      joinRoom(room);
    }
  }, [connected, room]);

  return {
    socket: socketRef.current,
    connected,
    error,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    emit
  };
}

// Hook específico para a cozinha
export function useKitchenSocket() {
  return useSocket({ 
    room: 'kitchen',
    autoConnect: true 
  });
}

// Hook específico para admin
export function useAdminSocket() {
  return useSocket({ 
    room: 'admin',
    autoConnect: true 
  });
}

// Hook específico para acompanhar um pedido
export function useOrderSocket(orderId: string) {
  return useSocket({ 
    room: `order-${orderId}`,
    autoConnect: true 
  });
}

// Hook para delivery
export function useDeliverySocket() {
  return useSocket({ 
    room: 'delivery',
    autoConnect: true 
  });
}