# Row Level Security (RLS) - Políticas de Segurança

Este documento descreve as políticas de Row Level Security (RLS) implementadas no banco de dados Supabase para garantir que os dados sejam acessados apenas por usuários autorizados.

## 📋 Resumo das Políticas

### 🔐 Tabela `profiles`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Users can view own profile** (SELECT)
   - Permite que usuários vejam apenas seu próprio perfil
   - Condição: `id = auth.uid()`

2. **Users can update own profile** (UPDATE)
   - Permite que usuários atualizem apenas seu próprio perfil
   - Condição: `id = auth.uid()`

3. **Users can insert own profile** (INSERT)
   - Permite que usuários criem seu próprio perfil durante o registro
   - Condição: `id = auth.uid()`

4. **Admin can view all profiles** (SELECT)
   - Permite que administradores vejam todos os perfis
   - Condição: Usuário autenticado tem role 'admin'

5. **Admin can update all profiles** (UPDATE)
   - Permite que administradores atualizem qualquer perfil
   - Condição: Usuário autenticado tem role 'admin'

6. **Admin can insert profiles** (INSERT)
   - Permite que administradores criem novos perfis
   - Condição: Usuário autenticado tem role 'admin'

### 🛍️ Tabela `orders`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Users can view own orders** (SELECT)
   - Usuários podem ver apenas seus próprios pedidos
   - Condição: `user_id = auth.uid()`

2. **Users can create own orders** (INSERT)
   - Usuários podem criar pedidos para si mesmos
   - Condição: `user_id = auth.uid()`

3. **Staff can manage orders** (ALL)
   - Staff e admins podem gerenciar todos os pedidos
   - Condição: Usuário é dono do pedido OU tem role 'admin'/'staff'

### 📦 Tabela `order_items`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Users can view own order items** (SELECT)
   - Usuários podem ver itens de seus próprios pedidos
   - Condição: Pedido pertence ao usuário autenticado

2. **Staff can manage order items** (ALL)
   - Staff e admins podem gerenciar todos os itens de pedidos
   - Condição: Usuário é dono do pedido OU tem role 'admin'/'staff'

### 🏠 Tabela `addresses`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Users can manage own addresses** (ALL)
   - Usuários podem gerenciar apenas seus próprios endereços
   - Condição: `user_id = auth.uid()`

### 🎫 Tabela `coupons`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Public read access** (SELECT)
   - Acesso público para leitura de cupons ativos
   - Condição: `active = true`

2. **Admin only access** (ALL)
   - Apenas administradores podem gerenciar cupons
   - Condição: Usuário autenticado tem role 'admin'

### 🏷️ Tabelas `categories` e `products`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Public read access** (SELECT)
   - Acesso público para leitura de categorias e produtos
   - Condição: `true` (sempre permitido)

2. **Admin write access** (ALL)
   - Apenas administradores podem gerenciar categorias e produtos
   - Condição: Usuário autenticado tem role 'admin'

### 🔔 Tabela `notifications`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Users can view own notifications** (SELECT)
   - Usuários podem ver apenas suas próprias notificações
   - Condição: `user_id = auth.uid()`

2. **Staff can manage notifications** (ALL)
   - Staff e admins podem gerenciar notificações
   - Condição: Usuário é dono da notificação OU tem role 'admin'/'staff'

### 🚚 Tabela `drivers`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Admin only access** (ALL)
   - Apenas administradores podem gerenciar motoristas
   - Condição: Usuário autenticado tem role 'admin'

2. **Drivers can view own profile by email** (SELECT)
   - Motoristas podem ver seu próprio perfil
   - Condição: Email do motorista corresponde ao email do usuário autenticado

3. **Drivers can update own profile by email** (UPDATE)
   - Motoristas podem atualizar seu próprio perfil
   - Condição: Email do motorista corresponde ao email do usuário autenticado

### 📍 Tabela `delivery_zones`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Admin only access** (ALL)
   - Apenas administradores podem gerenciar zonas de entrega
   - Condição: Usuário autenticado tem role 'admin'

2. **Public can view active delivery zones** (SELECT)
   - Acesso público para consultar zonas de entrega ativas
   - Condição: `active = true`

### ⚙️ Tabelas Administrativas

**Tabelas:** `admin_settings`, `about_content`, `order_status_history`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Admin only access** (ALL)
   - Apenas administradores podem acessar dados administrativos
   - Condição: Usuário autenticado tem role 'admin'

2. **Users can view own order status history** (SELECT) - apenas para `order_status_history`
   - Usuários podem ver o histórico de status de seus próprios pedidos
   - Condição: Pedido pertence ao usuário autenticado

### 📧 Tabela `contact_messages`

**Status RLS:** ✅ Habilitado

**Políticas Implementadas:**

1. **Public insert contact messages** (INSERT)
   - Qualquer pessoa pode enviar mensagens de contato
   - Condição: `true` (sempre permitido)

2. **Admin read contact messages** (SELECT)
   - Apenas administradores podem ler mensagens de contato
   - Condição: Usuário autenticado tem role 'admin'

## 🛡️ Princípios de Segurança Implementados

### 1. **Princípio do Menor Privilégio**
- Usuários têm acesso apenas aos dados que precisam
- Dados administrativos são restritos a administradores
- Dados pessoais são restritos ao próprio usuário

### 2. **Separação de Responsabilidades**
- **Usuários comuns:** Podem gerenciar apenas seus próprios dados
- **Staff:** Podem gerenciar pedidos e notificações
- **Administradores:** Têm acesso completo a dados administrativos

### 3. **Transparência Pública Controlada**
- Produtos, categorias e cupons ativos são públicos
- Zonas de entrega ativas são consultáveis publicamente
- Mensagens de contato podem ser enviadas por qualquer pessoa

### 4. **Proteção de Dados Sensíveis**
- Perfis de usuários são privados
- Pedidos e endereços são restritos ao proprietário
- Dados administrativos são protegidos

## 🧪 Testes de Segurança

Para validar as políticas RLS, execute o script de teste:

```bash
node scripts/test-rls-policies.js
```

Este script verifica:
- ✅ Acesso negado a dados protegidos sem autenticação
- ✅ Acesso permitido a dados públicos
- ✅ Funcionamento correto das políticas de usuário
- ✅ Proteção de dados administrativos

## 🔧 Manutenção

### Adicionando Novas Políticas

1. **Identifique o tipo de acesso necessário:**
   - Público (todos podem ler)
   - Privado (apenas o proprietário)
   - Administrativo (apenas admins)
   - Staff (admins + staff)

2. **Crie a política usando SQL:**
```sql
CREATE POLICY "policy_name" ON table_name
  FOR operation
  TO public
  USING (condition)
  WITH CHECK (condition_for_insert_update);
```

3. **Teste a política:**
   - Execute o script de teste
   - Verifique no frontend se o acesso está correto
   - Teste com diferentes tipos de usuário

### Monitoramento

- **Logs do Supabase:** Monitore tentativas de acesso negado
- **Testes automatizados:** Execute regularmente o script de teste
- **Auditoria:** Revise periodicamente as políticas implementadas

## 🚨 Alertas de Segurança

### ❌ Políticas Removidas por Segurança

1. **"Allow service role access" na tabela `profiles`**
   - **Motivo:** Permitia acesso irrestrito a todos os perfis
   - **Substituída por:** Políticas específicas para usuários e admins

2. **"Admin write access" duplicada na tabela `coupons`**
   - **Motivo:** Política duplicada com "Admin only access"
   - **Ação:** Removida para evitar conflitos

### ⚠️ Pontos de Atenção

1. **Tabela `drivers`:** Usa correspondência por email em vez de user_id
2. **Tabela `geocoded_addresses`:** Permite leitura pública para verificação de entrega
3. **Service Role:** Deve ser usado apenas em funções server-side

## 📚 Recursos Adicionais

- [Documentação oficial do Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Guia de boas práticas de segurança](./environment-security.md)
- [Configuração de deploy seguro](./vercel-deployment.md)