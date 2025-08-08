# 🔌 SOCKET.IO - GUIA DE SOLUÇÃO DE PROBLEMAS

## 🚨 Problemas Comuns

### 1. **Erro: "WebSocket connection failed"**

**Sintomas:**
```
WebSocket connection to 'ws://localhost:3001/socket.io/?EIO=4&transport=websocket' failed
```

**Causas:**
- Servidor Socket.io não está rodando
- Porta 3001 bloqueada
- Firewall bloqueando conexão

**Soluções:**

#### ✅ **Verificar se o servidor está rodando:**
```bash
# Verificar porta 3001
netstat -an | findstr :3001

# Se não estiver rodando, iniciar:
node socket-server.js
```

#### ✅ **Iniciar servidor Socket.io:**
```bash
# Opção 1: Comando direto
node socket-server.js

# Opção 2: Script batch
start-socket-server.bat

# Opção 3: NPM script
npm run dev:socket
```

#### ✅ **Verificar todos os servidores:**
```bash
check-servers.bat
```

### 2. **Tentativas de reconexão excessivas**

**Sintomas:**
```
❌ Erro de conexão Socket: TransportError: websocket error
```

**Causas:**
- Hook use-socket tentando reconectar em loop
- Configurações de retry inadequadas

**Soluções:**

#### ✅ **Hook otimizado implementado:**
- Máximo de 3 tentativas de reconexão
- Backoff exponencial (2s, 4s, 6s)
- Limpeza automática de timeouts

#### ✅ **Verificar configurações:**
```javascript
// .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
```

### 3. **Problemas de CORS**

**Sintomas:**
```
CORS error: Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000'
```

**Soluções:**

#### ✅ **Configuração CORS no servidor:**
```javascript
// socket-server.js
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### 4. **Problemas de Autenticação**

**Sintomas:**
```
Socket não autenticado
```

**Soluções:**

#### ✅ **Verificar token JWT:**
```javascript
// Hook use-socket.ts
const socket = io(socketUrl, {
  auth: {
    token: token || localStorage.getItem('auth_token')
  }
});
```

## 🔧 COMANDOS ÚTEIS

### **Verificar Status dos Servidores:**
```bash
# Verificar todas as portas
netstat -an | findstr :300

# Verificar apenas Socket.io
netstat -an | findstr :3001
```

### **Iniciar Servidores:**
```bash
# Apenas Socket.io
node socket-server.js

# Ambos simultaneamente
npm run dev:all

# Scripts batch
start-socket-server.bat
start-dev.bat
```

### **Testar Conexão:**
```javascript
// Teste manual no console do navegador
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Conectado!'));
```

## 📋 CHECKLIST DE VERIFICAÇÃO

### **Antes de reportar problema:**

- [ ] Servidor Socket.io está rodando na porta 3001
- [ ] Next.js está rodando na porta 3000
- [ ] Variáveis de ambiente configuradas
- [ ] Firewall não está bloqueando
- [ ] Console do navegador limpo
- [ ] Cache do navegador limpo

### **Logs importantes:**

```bash
# Logs do servidor Socket.io
✅ Cliente conectado: [socket-id]
🏠 Cliente [socket-id] entrou na sala: admin
❌ Cliente desconectado: [socket-id]

# Logs do cliente
🔌 Conectando ao Socket.io...
✅ Socket conectado: [socket-id]
❌ Erro de conexão Socket: [erro]
```

## 🚀 CONFIGURAÇÃO IDEAL

### **Arquivo .env.local:**
```env
# Socket.io
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_IO_SECRET=sua_chave_secreta_aqui
```

### **Scripts package.json:**
```json
{
  "scripts": {
    "dev:socket": "node socket-server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:socket\""
  }
}
```

## 📞 SUPORTE

Se o problema persistir:

1. **Verificar logs do servidor Socket.io**
2. **Verificar console do navegador**
3. **Testar conexão manual**
4. **Reiniciar todos os servidores**
5. **Limpar cache do navegador**

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0 