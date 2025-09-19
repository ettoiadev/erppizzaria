# 🖨️ Servidor de Impressão Bematech MP-4200 TH

Servidor dedicado para impressão térmica integrado ao William Disk Pizza.

## 🚀 Instalação

### 1. Instalar dependências
```bash
cd print-server
npm install
```

### 2. Configurar impressora
Edite as configurações no arquivo `server.js`:

```javascript
let printerConfig = {
  type: PrinterTypes.EPSON,
  interface: 'tcp://192.168.1.100:9100', // Configure o IP da sua impressora
  characterSet: CharacterSet.PC860_PORTUGUESE
};
```

### 3. Tipos de conexão suportados

#### USB (Windows)
```javascript
interface: 'printer:Generic / Text Only'
```

#### Serial
```javascript
interface: 'COM3' // Configure a porta serial
```

#### TCP/IP (Ethernet)
```javascript
interface: 'tcp://192.168.1.100:9100' // IP da impressora
```

#### Compartilhamento Windows
```javascript
interface: '\\\\COMPUTERNAME\\PRINTERNAME'
```

## 🎯 Execução

### Modo desenvolvimento
```bash
npm run dev
```

### Modo produção
```bash
npm start
```

## 🔧 Configuração da Bematech MP-4200 TH

### Configuração via painel da impressora:
1. **Menu > Configuração > Interface**
2. **Selecionar: USB/Serial/Ethernet**
3. **Configurar velocidade: 9600 bps** (serial)
4. **Configurar IP fixo** (ethernet)

### Teste de conexão:
```bash
curl http://localhost:3001/test
```

## 📡 API Endpoints

### GET /status
Retorna status do servidor e impressora
```json
{
  "status": "running",
  "printer": {
    "connected": true,
    "config": {...}
  }
}
```

### POST /print
Imprime um pedido
```json
{
  "id": "pedido-id",
  "customer_name": "Cliente",
  "order_items": [...],
  "total": 45.90
}
```

### POST /test
Executa teste de impressão

## 🔌 Socket.io Events

### Cliente → Servidor
- `print-order`: Imprimir pedido
- `test-print`: Teste de impressão
- `configure-printer`: Configurar impressora
- `printer-status`: Status da impressora

### Servidor → Cliente
- `print-result`: Resultado da impressão
- `test-result`: Resultado do teste
- `configure-result`: Resultado da configuração
- `printer-status-result`: Status da impressora

## 🛠️ Troubleshooting

### Impressora não conecta
1. Verificar cabo USB/Serial
2. Instalar driver oficial Bematech
3. Verificar porta/IP configurado
4. Testar impressão via Windows

### Caracteres incorretos
1. Verificar CharacterSet (PC860_PORTUGUESE)
2. Configurar codificação da impressora
3. Testar com diferentes character sets

### Papel não corta
1. Verificar se a impressora suporta corte
2. Habilitar corte automático no painel
3. Verificar lâmina de corte

## 📋 Logs

O servidor gera logs detalhados:
- ✅ Sucessos de impressão
- ❌ Erros e falhas
- 🔌 Conexões de clientes
- ⚙️ Mudanças de configuração

## 🔒 Segurança

- Servidor local apenas (localhost)
- CORS configurado para Next.js app
- Sem autenticação (rede local confiável)
- Logs de todas as operações