# Testes de Contrato da API Print-Server

Este diretório contém testes automatizados que validam os contratos de API entre o frontend e o serviço `print-server`.

## Estrutura dos Testes

### Arquivos de Teste
- `rest-api.test.js` - Testes para endpoints REST
- `socket-events.test.js` - Testes para eventos Socket.io
- `schemas.js` - Esquemas de validação e dados de teste
- `setup.js` - Configuração global dos testes
- `env.js` - Configuração de variáveis de ambiente
- `run-tests.js` - Script de execução com opções avançadas
- `jest.config.js` - Configuração do Jest
- `package.json` - Dependências e scripts

### Endpoints REST
- `GET /status` - Verificar status do servidor
- `POST /print` - Imprimir pedido
- `POST /test` - Teste de impressão

### Eventos Socket.io

#### Cliente → Servidor
- `print-order` - Solicitar impressão de pedido
- `test-print` - Solicitar teste de impressão
- `configure-printer` - Configurar impressora
- `printer-status` - Solicitar status da impressora

#### Servidor → Cliente
- `print-result` - Resultado da impressão
- `test-result` - Resultado do teste
- `configure-result` - Resultado da configuração
- `printer-status-result` - Status da impressora

## Executando os Testes

### Instalação
```bash
# Navegar para o diretório de testes
cd tests/contracts

# Instalar dependências
npm install
```

### Métodos de Execução

#### 1. Script Personalizado (Recomendado)
```bash
# Executar todos os testes
node run-tests.js

# Apenas testes REST
node run-tests.js --rest-only

# Apenas testes Socket.io
node run-tests.js --socket-only

# Com cobertura
node run-tests.js --coverage

# Modo watch (desenvolvimento)
node run-tests.js --watch

# Modo debug
node run-tests.js --debug

# Ajuda
node run-tests.js --help
```

#### 2. NPM Scripts
```bash
# Todos os testes
npm test

# Apenas testes REST
npm run test:rest

# Apenas testes Socket.io
npm run test:socket

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# Para CI/CD
npm run test:ci
```

#### 3. Jest Direto
```bash
# Executar com Jest
npx jest --config=jest.config.js

# Com verbose
npx jest --config=jest.config.js --verbose
```

## Configuração

### Variáveis de Ambiente

#### Principais
- `PRINT_SERVER_URL` - URL do print-server (padrão: http://localhost:3001)
- `PRINT_SERVER_HOST` - Host do print-server (padrão: localhost)
- `PRINT_SERVER_PORT` - Porta do print-server (padrão: 3001)

#### Timeouts
- `TEST_TIMEOUT` - Timeout global dos testes em ms (padrão: 30000)
- `CONNECTION_TIMEOUT` - Timeout de conexão em ms (padrão: 5000)
- `RESPONSE_TIMEOUT` - Timeout de resposta em ms (padrão: 15000)

#### Retry e Robustez
- `TEST_RETRY_ATTEMPTS` - Número de tentativas (padrão: 3)
- `TEST_RETRY_DELAY` - Delay entre tentativas em ms (padrão: 1000)

#### Modo Mock
- `ENABLE_MOCK_MODE` - Habilitar modo mock quando servidor indisponível (padrão: true)
- `MOCK_SUCCESS_RATE` - Taxa de sucesso dos mocks (padrão: 0.8)

#### Debug e Log
- `TEST_VERBOSE` - Log verboso (true/false, padrão: false)
- `TEST_LOG_LEVEL` - Nível de log (info, debug, error)
- `CI` - Modo CI/CD (true/false)

### Exemplos de Configuração

#### Desenvolvimento Local
```bash
export PRINT_SERVER_URL=http://localhost:3001
export TEST_VERBOSE=true
export TEST_TIMEOUT=30000
```

#### CI/CD
```bash
export CI=true
export TEST_TIMEOUT=45000
export CONNECTION_TIMEOUT=10000
export ENABLE_MOCK_MODE=true
```

#### Servidor Remoto
```bash
export PRINT_SERVER_URL=http://192.168.1.100:3001
export CONNECTION_TIMEOUT=10000
export RESPONSE_TIMEOUT=20000
```

### Pré-requisitos
1. Node.js versão 16 ou superior
2. NPM versão 8 ou superior
3. Print-server rodando (opcional - modo mock disponível)
4. Dependências instaladas automaticamente via `npm install`

## Compatibilidade

Todos os testes garantem compatibilidade retroativa com a implementação atual do `print-server`.