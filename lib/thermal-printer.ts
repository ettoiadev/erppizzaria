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
  private serverUrl: string;
  private isConnected: boolean = false;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Verificar se está conectado
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Imprimir pedido
   */
  async printOrder(orderData: any): Promise<PrintResult> {
    try {
      const response = await fetch(`${this.serverUrl}/print-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.isConnected = true;
      return result;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Erro na impressão:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro na impressão'
      };
    }
  }

  /**
   * Teste de impressão
   */
  async testPrint(): Promise<PrintResult> {
    try {
      const response = await fetch(`${this.serverUrl}/test-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.isConnected = true;
      return result;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Erro no teste:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro no teste'
      };
    }
  }

  /**
   * Configurar impressora
   */
  async configurePrinter(config: PrinterConfig): Promise<PrintResult> {
    try {
      const response = await fetch(`${this.serverUrl}/configure-printer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.isConnected = true;
      return result;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Erro na configuração:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro na configuração'
      };
    }
  }

  /**
   * Obter status da impressora
   */
  async getStatus(): Promise<PrinterStatus | null> {
    try {
      const response = await fetch(`${this.serverUrl}/printer-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status = await response.json();
      this.isConnected = true;
      return status;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Erro ao obter status:', error);
      return null;
    }
  }

  /**
   * Verificar se o servidor está rodando
   */
  async checkServer(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // Timeout de 2 segundos
        mode: 'cors', // Adicionar modo CORS
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      // Não logar erro para evitar spam no console quando servidor não estiver disponível
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