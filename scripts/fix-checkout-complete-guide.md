# Guia Completo para Corrigir o Fluxo de Checkout

## 🚨 Problemas Identificados

1. **Erro "handleOrderSubmit is not defined"**
   - Possível problema de hot reload do Next.js
   - Pode ser cache do navegador

2. **Possíveis problemas no banco de dados**
   - Colunas faltando
   - Enums incorretos
   - Constraints inválidas

## 🔧 Soluções Passo a Passo

### 1. Limpar Cache e Reiniciar

```bash
# No terminal (PowerShell)
# Parar o servidor (Ctrl+C)
# Limpar cache do Next.js
Remove-Item -Recurse -Force .next
npm run dev
```

### 2. Executar Script de Correção no pgAdmin4

1. Abra o pgAdmin4
2. Conecte ao banco `williamdiskpizza`
3. Abra Query Tool
4. Execute o script `scripts/fix-complete-checkout-flow.sql`
5. Verifique os resultados nas abas Messages e Data Output

### 3. Testar Checkout Simplificado

Para testar se o problema é no componente complexo:

1. Acesse: `http://localhost:3002/checkout-simple`
2. Preencha os dados básicos
3. Tente finalizar o pedido

### 4. Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Limpe o console
4. Recarregue a página (Ctrl+F5 para forçar)
5. Tente finalizar o pedido
6. Copie qualquer erro que aparecer

### 5. Verificar Aba Network

1. No DevTools, vá para aba Network
2. Filtre por "Fetch/XHR"
3. Tente finalizar o pedido
4. Veja se a requisição para `/api/orders` é enviada
5. Clique na requisição e veja:
   - Headers (payload enviado)
   - Response (resposta do servidor)

## 🔍 Diagnóstico Rápido

### Se o erro persiste após limpar cache:

1. **Teste o endpoint diretamente**:
   ```javascript
   // Cole isso no console do navegador
   fetch('/api/orders', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       user_id: 'SEU_USER_ID_AQUI',
       items: [{ product_id: 'ID_PRODUTO', quantity: 1, unit_price: 10 }],
       total: 10,
       subtotal: 10,
       delivery_fee: 0,
       delivery_address: 'Teste',
       delivery_phone: '11999999999',
       payment_method: 'PIX'
     })
   }).then(r => r.json()).then(console.log).catch(console.error)
   ```

2. **Verifique se o usuário está logado**:
   ```javascript
   // No console
   localStorage.getItem('auth-token')
   ```

## 🆘 Solução de Emergência

Se nada funcionar, use a versão simplificada temporariamente:

1. Edite `app/checkout/page.tsx`
2. Na linha 1, adicione:
   ```typescript
   import { useEffect } from "react"
   ```
3. Após a linha 17, adicione:
   ```typescript
   useEffect(() => {
     if (typeof window !== 'undefined') {
       window.location.href = '/checkout-simple'
     }
   }, [])
   ```

Isso redirecionará temporariamente para a versão simplificada.

## 📊 Verificar se Pedidos Aparecem no Admin

1. Acesse: `http://localhost:3002/admin/pedidos`
2. Faça login como admin
3. Verifique se os pedidos aparecem
4. Se não aparecerem, execute no pgAdmin:
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
   ```

## 🔄 Próximos Passos

1. **Se o checkout simplificado funcionar**: O problema está no componente complexo
2. **Se nenhum checkout funcionar**: O problema está no backend/banco
3. **Se aparecer erro de CORS/Network**: Problema de configuração do servidor

## 📝 Informações para Suporte

Se precisar de mais ajuda, forneça:
1. Screenshot do erro no console
2. Resposta da aba Network para `/api/orders`
3. Resultado do script SQL de diagnóstico
4. Versão do Node.js: `node --version`
5. Se o checkout simplificado funcionou ou não 