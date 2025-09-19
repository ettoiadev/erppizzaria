const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Configuração da impressora Bematech MP-4200 TH
let printer = null;
let printerConfig = {
  type: PrinterTypes.EPSON,  // Bematech usa protocolo compatível com EPSON
  interface: 'tcp://192.168.1.100:9100', // IP da impressora (configurável)
  characterSet: CharacterSet.PC860_PORTUGUESE,
  removeSpecialCharacters: true,
  lineCharacter: "-",
  breakLine: BreakLine.WORD,
  options: {
    timeout: 5000
  }
};

// Configurações alternativas para diferentes tipos de conexão
const connectionTypes = {
  // USB (Windows COM Port)
  usb: 'printer:Generic / Text Only',
  // Serial
  serial: 'COM3', // Porta serial configurável
  // TCP/IP (Ethernet)
  tcp: 'tcp://192.168.1.100:9100',
  // Compartilhamento Windows
  shared: '\\\\COMPUTERNAME\\PRINTERNAME'
};

// Inicializar impressora
function initializePrinter(config = printerConfig) {
  try {
    printer = new ThermalPrinter(config);
    console.log('✅ Impressora Bematech MP-4200 TH inicializada');
    console.log('📍 Tipo de conexão:', config.interface);
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar impressora:', error.message);
    printer = null;
    return false;
  }
}

// Função para imprimir pedido formatado para Bematech
async function printOrder(orderData) {
  if (!printer) {
    throw new Error('Impressora não inicializada');
  }

  try {
    // Limpar buffer da impressora
    printer.clear();

    // Cabeçalho
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println('WILLIAM DISK PIZZA');
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.println('PEDIDO PARA COZINHA');
    printer.drawLine();

    // Número do pedido e status
    printer.bold(true);
    printer.setTextSize(1, 0);
    printer.println(`PEDIDO #${orderData.id.slice(-8)}`);
    printer.bold(false);
    printer.setTextSize(0, 0);
    
    // Status do pedido
    const statusMap = {
      'RECEIVED': 'AGUARDANDO PREPARO',
      'PREPARING': 'EM PREPARO',
      'READY': 'PRONTO',
      'OUT_FOR_DELIVERY': 'SAIU PARA ENTREGA',
      'DELIVERED': 'ENTREGUE'
    };
    printer.println(`Status: ${statusMap[orderData.status] || orderData.status}`);
    printer.newLine();

    // Data e hora
    const now = new Date();
    printer.println(`Data: ${now.toLocaleDateString('pt-BR')}`);
    printer.println(`Hora: ${now.toLocaleTimeString('pt-BR')}`);
    printer.drawLine();

    // Informações do cliente
    printer.bold(true);
    printer.println('CLIENTE:');
    printer.bold(false);
    printer.println(`Cliente: ${orderData.customer_code ? `[${orderData.customer_code}] ` : ""}${orderData.customer_name || 'Cliente'}`);
    printer.println(`Telefone: ${orderData.customer_phone || 'N/A'}`);
    
    if (orderData.delivery_address) {
      printer.println('ENDERECO:');
      printer.println(orderData.delivery_address);
    }
    printer.drawLine();

    // Itens do pedido
    printer.bold(true);
    printer.println('ITENS DO PEDIDO:');
    printer.bold(false);
    printer.newLine();

    if (orderData.order_items && orderData.order_items.length > 0) {
      orderData.order_items.forEach((item, index) => {
        printer.bold(true);
        printer.println(`${item.quantity}x ${item.products?.name || item.name || 'Produto'}`);
        printer.bold(false);
        
        // Tamanho
        if (item.size) {
          printer.println(`   Tamanho: ${item.size}`);
        }

        // Pizza meio a meio
        if (item.half_and_half) {
          printer.println('   PIZZA MEIO A MEIO:');
          printer.println(`   1a metade: ${item.half_and_half.firstHalf?.productName || ''}`);
          if (item.half_and_half.firstHalf?.toppings?.length > 0) {
            printer.println(`   + ${item.half_and_half.firstHalf.toppings.join(', ')}`);
          }
          printer.println(`   2a metade: ${item.half_and_half.secondHalf?.productName || ''}`);
          if (item.half_and_half.secondHalf?.toppings?.length > 0) {
            printer.println(`   + ${item.half_and_half.secondHalf.toppings.join(', ')}`);
          }
        }

        // Adicionais normais
        if (!item.half_and_half && item.toppings && item.toppings.length > 0) {
          printer.println(`   Adicionais: ${item.toppings.join(', ')}`);
        }

        // Observações do item
        if (item.special_instructions) {
          printer.println('   OBSERVACOES:');
          printer.println(`   ${item.special_instructions}`);
        }

        printer.newLine();
      });
    }

    printer.drawLine();

    // Informações de pagamento
    printer.bold(true);
    printer.println('PAGAMENTO:');
    printer.bold(false);
    
    const paymentMap = {
      'CASH': 'Dinheiro',
      'CREDIT_CARD': 'Cartao de Credito',
      'DEBIT_CARD': 'Cartao de Debito',
      'PIX': 'PIX',
      'MERCADO_PAGO': 'Mercado Pago'
    };
    
    printer.println(`Forma: ${paymentMap[orderData.payment_method] || orderData.payment_method}`);
    printer.bold(true);
    printer.println(`TOTAL: R$ ${orderData.total?.toFixed(2) || '0,00'}`);
    printer.bold(false);

    // Observações gerais
    if (orderData.delivery_instructions) {
      printer.newLine();
      printer.bold(true);
      printer.println('OBSERVACOES GERAIS:');
      printer.bold(false);
      printer.println(orderData.delivery_instructions);
    }

    printer.drawLine();
    
    // Rodapé
    printer.alignCenter();
    printer.println(`Impresso em: ${now.toLocaleString('pt-BR')}`);
    printer.newLine();
    
    // Status visual
    if (orderData.status === 'RECEIVED') {
      printer.bold(true);
      printer.println('>>> AGUARDANDO PREPARO <<<');
      printer.bold(false);
    } else if (orderData.status === 'PREPARING') {
      printer.bold(true);
      printer.println('>>> EM PREPARO <<<');
      printer.bold(false);
    }

    printer.newLine();
    printer.newLine();
    printer.cut();

    // Executar impressão
    const success = await printer.execute();
    
    if (success) {
      console.log(`✅ Pedido #${orderData.id.slice(-8)} impresso com sucesso`);
      return { success: true, message: 'Pedido impresso com sucesso' };
    } else {
      console.log(`❌ Falha na impressão do pedido #${orderData.id.slice(-8)}`);
      return { success: false, message: 'Falha na impressão' };
    }

  } catch (error) {
    console.error('❌ Erro durante impressão:', error);
    return { success: false, message: error.message };
  }
}

// Função para testar impressora
async function testPrint() {
  if (!printer) {
    throw new Error('Impressora não inicializada');
  }

  try {
    printer.clear();
    printer.alignCenter();
    printer.bold(true);
    printer.println('WILLIAM DISK PIZZA');
    printer.bold(false);
    printer.println('Teste de Impressora');
    printer.drawLine();
    printer.println('Bematech MP-4200 TH');
    printer.println('Conexao: OK');
    printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`);
    printer.drawLine();
    printer.println('Teste realizado com sucesso!');
    printer.newLine();
    printer.cut();

    const success = await printer.execute();
    return { success, message: success ? 'Teste realizado com sucesso' : 'Falha no teste' };
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, message: error.message };
  }
}

// Socket.io eventos
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Receber pedido para impressão
  socket.on('print-order', async (orderData) => {
    console.log('📄 Recebido pedido para impressão:', orderData.id);
    
    try {
      const result = await printOrder(orderData);
      socket.emit('print-result', result);
    } catch (error) {
      console.error('❌ Erro na impressão:', error);
      socket.emit('print-result', { success: false, message: error.message });
    }
  });

  // Teste de impressão
  socket.on('test-print', async () => {
    console.log('🧪 Executando teste de impressão');
    
    try {
      const result = await testPrint();
      socket.emit('test-result', result);
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      socket.emit('test-result', { success: false, message: error.message });
    }
  });

  // Configurar impressora
  socket.on('configure-printer', (config) => {
    console.log('⚙️ Reconfigurando impressora:', config);
    
    printerConfig = { ...printerConfig, ...config };
    const success = initializePrinter(printerConfig);
    
    socket.emit('configure-result', { 
      success, 
      message: success ? 'Impressora configurada com sucesso' : 'Falha na configuração' 
    });
  });

  // Status da impressora
  socket.on('printer-status', () => {
    socket.emit('printer-status-result', {
      connected: printer !== null,
      config: printerConfig,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Rotas REST
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    printer: {
      connected: printer !== null,
      config: printerConfig
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/print', async (req, res) => {
  try {
    const result = await printOrder(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/test', async (req, res) => {
  try {
    const result = await testPrint();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inicialização
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('\n🖨️  SERVIDOR DE IMPRESSÃO BEMATECH MP-4200 TH');
  console.log('=' .repeat(50));
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('📡 Socket.io: Ativo');
  
  // Tentar inicializar impressora
  console.log('\n⚙️  Inicializando impressora...');
  const success = initializePrinter();
  
  if (success) {
    console.log('✅ Sistema pronto para impressão!');
  } else {
    console.log('⚠️  Impressora não conectada - configure via admin panel');
  }
  
  console.log('=' .repeat(50));
  console.log('💡 Use Ctrl+C para parar o servidor\n');
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});