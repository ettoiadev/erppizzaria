# 🚚 TESTE DE ATRIBUIÇÃO DE ENTREGADORES

## 🎯 Objetivo
Verificar se o sistema de atribuição de entregadores está funcionando corretamente e se os pedidos são movidos para o card "Saiu para Entrega" no Kanban.

## 📋 Pré-requisitos

### 1. **Verificar Servidores**
```bash
# Verificar se os servidores estão rodando
check-servers.bat

# Ou manualmente:
netstat -an | findstr :3000  # Next.js
netstat -an | findstr :3001  # Socket.io
```

### 2. **Verificar Banco de Dados**
```sql
-- Verificar pedidos disponíveis
SELECT id, customer_name, status, total 
FROM orders 
WHERE status IN ('RECEIVED', 'PREPARING')
ORDER BY created_at DESC;

-- Verificar entregadores disponíveis
SELECT id, name, status, vehicle_type 
FROM drivers 
WHERE status = 'available';
```

## 🧪 Passos do Teste

### **Passo 1: Acessar Admin**
1. Abrir: `http://localhost:3000/admin`
2. Fazer login com: `admin@pizzaria.com` / `admin123`
3. Navegar para: **Pedidos**

### **Passo 2: Verificar Kanban**
1. Verificar se há pedidos nos cards:
   - **Recebidos** (RECEIVED)
   - **Preparando** (PREPARING)
2. Anotar o ID de um pedido em **Preparando**

### **Passo 3: Atribuir Entregador**
1. Encontrar um pedido com status **Preparando**
2. Clicar no botão **"Atribuir Pedido"** (ícone de caminhão)
3. Selecionar um entregador disponível
4. Clicar em **"Atribuir Entregador"**

### **Passo 4: Verificar Resultado**
1. **✅ Esperado**: Pedido deve aparecer no card **"Saiu para Entrega"**
2. **✅ Esperado**: Entregador deve ficar com status **"busy"**
3. **✅ Esperado**: Notificação de sucesso deve aparecer

## 🔍 Verificações Técnicas

### **1. Verificar API de Atribuição**
```bash
# Testar API diretamente
curl -X PATCH http://localhost:3000/api/orders/[ORDER_ID]/assign-driver \
  -H "Content-Type: application/json" \
  -d '{"driverId": "[DRIVER_ID]"}'
```

### **2. Verificar Banco de Dados**
```sql
-- Verificar se o status foi atualizado
SELECT id, status, driver_id, updated_at 
FROM orders 
WHERE id = '[ORDER_ID]';

-- Verificar se o entregador foi atualizado
SELECT id, name, status, updated_at 
FROM drivers 
WHERE id = '[DRIVER_ID]';
```

### **3. Verificar Logs**
```bash
# Logs do servidor Next.js
# Procurar por: "Entregador atribuído com sucesso"

# Logs do Socket.io
# Procurar por: "Status do pedido atualizado"
```

## 🚨 Problemas Comuns

### **Problema 1: Pedido não aparece no card "Saiu para Entrega"**
**Causa**: Incompatibilidade de status entre backend e frontend
**Solução**: 
- Verificar se o banco usa `ON_THE_WAY` (não `OUT_FOR_DELIVERY`)
- Verificar se a API retorna o status correto

### **Problema 2: Erro ao atribuir entregador**
**Causa**: Entregador não disponível ou pedido em status inválido
**Solução**:
- Verificar se há entregadores com status `available`
- Verificar se o pedido está em `PREPARING` ou `READY`

### **Problema 3: Kanban não atualiza**
**Causa**: Problema com Socket.io ou cache
**Solução**:
- Verificar se Socket.io está conectado
- Recarregar a página (F5)
- Verificar console do navegador

## 📊 Dados de Teste

### **Criar Pedidos de Teste**
```sql
-- Executar no pgAdmin
INSERT INTO orders (
    id, user_id, customer_name, customer_phone, customer_address,
    status, total, subtotal, delivery_fee, discount,
    payment_method, payment_status, delivery_type,
    created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
    'Teste Cliente',
    '(11) 99999-9999',
    'Rua Teste, 123 - Centro, São Paulo - SP',
    'PREPARING',
    35.90,
    30.90,
    5.00,
    0.00,
    'PIX',
    'PENDING',
    'delivery',
    NOW(),
    NOW()
);
```

### **Criar Entregador de Teste**
```sql
-- Executar no pgAdmin
INSERT INTO drivers (
    id, profile_id, name, email, phone, vehicle_type, status
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE role = 'delivery' LIMIT 1),
    'Entregador Teste',
    'entregador@teste.com',
    '(11) 77777-7777',
    'motorcycle',
    'available'
);
```

## ✅ Checklist de Verificação

- [ ] Servidores rodando (Next.js + Socket.io)
- [ ] Pedidos disponíveis para teste
- [ ] Entregadores disponíveis
- [ ] API de atribuição funcionando
- [ ] Status atualizado no banco
- [ ] Pedido aparece no card correto
- [ ] Notificações funcionando
- [ ] Socket.io atualizando em tempo real

## 📞 Suporte

Se o teste falhar:
1. Verificar logs do servidor
2. Verificar console do navegador
3. Verificar status no banco de dados
4. Consultar: `md/SOCKET-IO-TROUBLESHOOTING.md`

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0 