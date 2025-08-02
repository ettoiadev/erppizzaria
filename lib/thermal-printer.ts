import { io, Socket } from 'socket.io-client';

export interface PrinterConfig {
  interface: string;
  type?: string;
  characterSet?: string;
  timeout?: number;
}

export interface PrintResult {
  success: boolean;
  message: string;
}

export interface PrinterStatus {
  connected: boolean;
  config: PrinterConfig;
  timestamp: string;
}

export class BematechPrinter {
  private socket: Socket | null = null;
  private serverUrl: string;
  private isConnected: boolean = false;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Conectar ao servidor de impressão
   */
  async connect(): Promise<boolean> {
    try {
      if (this.socket?.connected) {
        return true;
      }

      this.socket = io(this.serverUrl, {
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          resolve(false);
          return;
        }

        this.socket.on('connect', () => {
          console.log('✅ Conectado ao servidor de impressão');
          this.isConnected = true;
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Erro ao conectar servidor de impressão:', error);
          this.isConnected = false;
          resolve(false);
        });

        this.socket.on('disconnect', () => {
          console.log('🔌 Desconectado do servidor de impressão');
          this.isConnected = false;
        });

        // Timeout de conexão
        setTimeout(() => {
          if (!this.isConnected) {
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
  }

  /**
   * Desconectar do servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Verificar se está conectado
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Imprimir pedido
   */
  async printOrder(orderData: any): Promise<PrintResult> {
    if (!this.connected) {
      const connected = await this.connect();
      if (!connected) {
        return {
          success: false,
          message: 'Não foi possível conectar ao servidor de impressão'
        };
      }
    }

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, message: 'Socket não inicializado' });
        return;
      }

      // Timeout para a operação
      const timeout = setTimeout(() => {
        resolve({ success: false, message: 'Timeout na impressão' });
      }, 10000);

      this.socket.once('print-result', (result: PrintResult) => {
        clearTimeout(timeout);
        resolve(result);
      });

      this.socket.emit('print-order', orderData);
    });
  }

  /**
   * Teste de impressão
   */
  async testPrint(): Promise<PrintResult> {
    if (!this.connected) {
      const connected = await this.connect();
      if (!connected) {
        return {
          success: false,
          message: 'Não foi possível conectar ao servidor de impressão'
        };
      }
    }

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, message: 'Socket não inicializado' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, message: 'Timeout no teste' });
      }, 10000);

      this.socket.once('test-result', (result: PrintResult) => {
        clearTimeout(timeout);
        resolve(result);
      });

      this.socket.emit('test-print');
    });
  }

  /**
   * Configurar impressora
   */
  async configurePrinter(config: PrinterConfig): Promise<PrintResult> {
    if (!this.connected) {
      const connected = await this.connect();
      if (!connected) {
        return {
          success: false,
          message: 'Não foi possível conectar ao servidor de impressão'
        };
      }
    }

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, message: 'Socket não inicializado' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, message: 'Timeout na configuração' });
      }, 5000);

      this.socket.once('configure-result', (result: PrintResult) => {
        clearTimeout(timeout);
        resolve(result);
      });

      this.socket.emit('configure-printer', config);
    });
  }

  /**
   * Obter status da impressora
   */
  async getStatus(): Promise<PrinterStatus | null> {
    if (!this.connected) {
      const connected = await this.connect();
      if (!connected) {
        return null;
      }
    }

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(null);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      this.socket.once('printer-status-result', (status: PrinterStatus) => {
        clearTimeout(timeout);
        resolve(status);
      });

      this.socket.emit('printer-status');
    });
  }

  /**
   * Verificar se o servidor está rodando
   */
  async checkServer(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/status`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Instância singleton
let printerInstance: BematechPrinter | null = null;

/**
 * Obter instância da impressora
 */
export function getBematechPrinter(): BematechPrinter {
  if (!printerInstance) {
    printerInstance = new BematechPrinter();
  }
  return printerInstance;
}

/**
 * Hook para usar a impressora térmica
 */
export function useThermalPrinter() {
  const printer = getBematechPrinter();

  const printOrder = async (orderData: any): Promise<PrintResult> => {
    try {
      return await printer.printOrder(orderData);
    } catch (error) {
      console.error('❌ Erro na impressão:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const testPrint = async (): Promise<PrintResult> => {
    try {
      return await printer.testPrint();
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const configurePrinter = async (config: PrinterConfig): Promise<PrintResult> => {
    try {
      return await printer.configurePrinter(config);
    } catch (error) {
      console.error('❌ Erro na configuração:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const getStatus = async (): Promise<PrinterStatus | null> => {
    try {
      return await printer.getStatus();
    } catch (error) {
      console.error('❌ Erro ao obter status:', error);
      return null;
    }
  };

  const checkServer = async (): Promise<boolean> => {
    try {
      return await printer.checkServer();
    } catch (error) {
      console.error('❌ Erro ao verificar servidor:', error);
      return false;
    }
  };

  return {
    printOrder,
    testPrint,
    configurePrinter,
    getStatus,
    checkServer,
    connected: printer.connected
  };
}