# Guia: Configurar Sistema de Entregadores

## 📋 Instrução para executar no pgAdmin4

### 1️⃣ **SETUP - Configurar Sistema**

1. **Abra o pgAdmin4**
2. **Conecte ao banco williamdiskpizza**
3. **Abra o Query Tool** (botão com ícone SQL)
4. **Copie e cole o conteúdo do arquivo `setup-drivers-system.sql`**
5. **Execute o script** (F5 ou botão Execute)

### 2️⃣ **VERIFICAÇÃO - Confirmar Configuração**

1. **No mesmo Query Tool**
2. **Limpe a área de texto** (Ctrl+A, Delete)
3. **Copie e cole o conteúdo do arquivo `verify-drivers-setup.sql`**
4. **Execute o script** (F5 ou botão Execute)

## ✅ Resultado esperado

### **Setup deve criar:**
- ✅ Tabela `drivers` 
- ✅ Campo `driver_id` na tabela `orders`
- ✅ 3 índices para performance
- ✅ Trigger de atualização automática
- ✅ 4 entregadores de exemplo

### **Verificação deve mostrar:**
- ✅ "Tabela drivers existe: SIM ✅"
- ✅ "Campo driver_id na tabela orders: SIM ✅"
- ✅ "Entregadores cadastrados: 4 entregadores ✅"
- ✅ "Índices criados: 3 índices ✅"
- ✅ "Trigger de atualização: SIM ✅"
- ✅ Lista dos 4 entregadores cadastrados

## 🚨 Correção aplicada

❌ **Problema anterior:**
```
ERROR: erro de sintaxe em ou próximo a "RAISE"
```

✅ **Solução:**
- Removidos comandos `RAISE NOTICE` problemáticos
- Script agora executa sem erros
- Criado script separado de verificação

## 🧪 Teste manual após setup

1. **Verificar tabela:**
   ```sql
   SELECT * FROM drivers;
   ```

2. **Verificar campo orders:**
   ```sql
   \d orders
   ```

3. **Testar inserção:**
   ```sql
   SELECT COUNT(*) FROM drivers WHERE status = 'available';
   ```

## 🔄 Próximos passos

Após confirmar que tudo foi configurado:
1. Reinicie a aplicação Next.js
2. Acesse `http://localhost:3000/admin/entregadores`
3. Teste criar/editar entregadores
4. Teste atribuir entregadores aos pedidos em `/admin/pedidos` 