// Mapa para armazenar conexões ativas
const activeConnections = new Map<string, ReadableStreamDefaultController>();

// Função para broadcast de mensagens
export function broadcastMessage(channel: string, event: string, payload: any) {
  const message = `data: ${JSON.stringify({ channel, event, payload })}\n\n`;
  
  activeConnections.forEach((controller, connectionId) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error(`Erro ao enviar mensagem para conexão ${connectionId}:`, error);
      activeConnections.delete(connectionId);
    }
  });
}

// Função para adicionar conexão
export function addConnection(connectionId: string, controller: ReadableStreamDefaultController) {
  activeConnections.set(connectionId, controller);
}

// Função para remover conexão
export function removeConnection(connectionId: string) {
  activeConnections.delete(connectionId);
}

// Função para obter estatísticas
export function getConnectionStats() {
  return {
    activeConnections: activeConnections.size,
    connectionIds: Array.from(activeConnections.keys()),
  };
}

// Cleanup quando o processo for encerrado
process.on('SIGTERM', () => {
  activeConnections.clear();
});

process.on('SIGINT', () => {
  activeConnections.clear();
});