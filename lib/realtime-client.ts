import { useEffect } from 'react';

type RealtimeCallback = (data: any) => void;

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private callbacks: Map<string, RealtimeCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/realtime/events');
      
      this.eventSource.onopen = () => {
        console.log('Conexão realtime estabelecida');
        this.reconnectAttempts = 0;
      };
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Ignorar mensagens de ping
          if (data.type === 'ping') return;
          
          const { channel, event: eventType, payload } = data;
          
          if (channel) {
            const channelCallbacks = this.callbacks.get(channel) || [];
            channelCallbacks.forEach(callback => {
              try {
                callback({ event: eventType, payload });
              } catch (error) {
                console.error('Erro ao executar callback realtime:', error);
              }
            });
          }
        } catch (error) {
          console.error('Erro ao processar evento realtime:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Erro na conexão realtime:', error);
        this.handleReconnect();
      };
    } catch (error) {
      console.error('Erro ao criar EventSource:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      return;
    }

    this.disconnect();
    this.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  subscribe(channel: string, callback: RealtimeCallback) {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, []);
    }
    this.callbacks.get(channel)!.push(callback);

    // Conectar se ainda não estiver conectado
    if (!this.eventSource) {
      this.connect();
    }

    // Retornar função de unsubscribe
    return () => {
      const callbacks = this.callbacks.get(channel) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // Se não há mais callbacks para este canal, remover o canal
      if (callbacks.length === 0) {
        this.callbacks.delete(channel);
      }
      
      // Se não há mais callbacks, desconectar
      if (this.callbacks.size === 0) {
        this.disconnect();
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Método para enviar notificações (via API)
  async sendNotification(channel: string, event: string, payload: any) {
    try {
      const response = await fetch('/api/notifications/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel, event, payload }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao enviar notificação: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao enviar notificação realtime:', error);
      throw error;
    }
  }

  // Método para verificar status da conexão
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // Método para obter estatísticas
  getStats() {
    return {
      connected: this.isConnected(),
      channels: Array.from(this.callbacks.keys()),
      totalCallbacks: Array.from(this.callbacks.values()).reduce((sum, callbacks) => sum + callbacks.length, 0),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Instância singleton
export const realtimeClient = new RealtimeClient();

// Hook para usar no React
export function useRealtime(channel: string, callback: RealtimeCallback) {
  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe(channel, callback);
    return unsubscribe;
  }, [channel, callback]);
}

// Hook para enviar notificações
export function useRealtimeNotification() {
  return {
    sendNotification: realtimeClient.sendNotification.bind(realtimeClient),
    isConnected: realtimeClient.isConnected.bind(realtimeClient),
    getStats: realtimeClient.getStats.bind(realtimeClient),
  };
}

// Função para subscrever a mudanças de pedidos (compatibilidade)
export function subscribeOrdersRealtime(callback: () => void) {
  return realtimeClient.subscribe('orders', callback);
}