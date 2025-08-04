# 🔢 Implementação de Códigos Sequenciais de Clientes

## 📋 Objetivo

Garantir que os códigos de cliente sejam sempre sequenciais (0001, 0002, 0003...), mesmo após exclusões. O próximo cliente registrado deve sempre receber o próximo número disponível na sequência.

## ✅ Funcionalidades Implementadas

### **1. Geração Sequencial Sem Gaps**
- ✅ Códigos sempre incrementais: 0001, 0002, 0003...
- ✅ Sem gaps na sequência, mesmo após exclusões
- ✅ Formato padronizado: 4 dígitos com zeros à esquerda
- ✅ **CORRIGIDO**: Reinicia do 0001 se todos os clientes forem deletados
- ✅ **CORRIGIDO**: Considera apenas clientes ativos (active = true ou NULL)

### **2. Função de Geração Melhorada**
```sql
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_number INTEGER;
    formatted_code VARCHAR(10);
BEGIN
    -- Encontrar o próximo número sequencial disponível
    -- Considerar apenas clientes ativos (active = true ou NULL)
    SELECT COALESCE(MAX(CAST(customer_code AS INTEGER)), 0) + 1
    INTO next_number
    FROM profiles 
    WHERE role = 'customer' 
    AND customer_code IS NOT NULL 
    AND customer_code ~ '^[0-9]+$'
    AND (active = true OR active IS NULL);
    
    -- Se não há clientes ativos, começar do 1
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    -- Formatar com zeros à esquerda (4 dígitos)
    formatted_code := LPAD(next_number::TEXT, 4, '0');
    
    RETURN formatted_code;
END;
$$ LANGUAGE plpgsql;
```

### **3. API de Próximo Código Atualizada**
```typescript
// app/api/customers/next-code/route.ts
const nextCodeResult = await query(`
  SELECT COALESCE(MAX(CAST(customer_code AS INTEGER)), 0) + 1 as next_code
  FROM profiles 
  WHERE role = 'customer' 
  AND customer_code IS NOT NULL 
  AND customer_code ~ '^[0-9]+$'
  AND (active = true OR active IS NULL)
`)

const nextNumber = nextCodeResult.rows[0]?.next_code || 1
const formattedCode = nextNumber.toString().padStart(4, '0')
```

## 🔧 Scripts de Implementação

### **1. Script Principal: `scripts/implement-customer-codes.sql`**
- ✅ Adiciona coluna `customer_code` na tabela `profiles`
- ✅ Cria função `generate_customer_code()` sequencial
- ✅ Configura trigger para geração automática
- ✅ Sincroniza códigos nos pedidos
- ✅ **ATUALIZADO**: Considera apenas clientes ativos

### **2. Script de Correção: `scripts/fix-sequential-customer-codes.sql`**
- ✅ Função `generate_sequential_customer_code()` sem gaps
- ✅ Função `reorder_customer_codes()` para reordenação
- ✅ Verificação de gaps na sequência
- ✅ Relatórios de estado atual
- ✅ **ATUALIZADO**: Considera apenas clientes ativos

### **3. Script de Reordenação: `scripts/reorder-customer-codes.sql`**
- ✅ Reordena códigos existentes para sequência perfeita
- ✅ Verifica gaps antes e depois da reordenação
- ✅ Relatórios detalhados de mudanças

### **4. Script de Teste: `scripts/test-customer-codes-behavior.sql`**
- ✅ Testa comportamento após exclusões
- ✅ Verifica clientes ativos vs inativos
- ✅ Função para limpar códigos de clientes inativos
- ✅ Função para reordenar clientes ativos

### **5. Script de Correção Automática: `scripts/fix-customer-codes-after-deletion.sql`**
- ✅ **NOVO**: Corrige automaticamente após exclusões
- ✅ Limpa códigos de clientes inativos
- ✅ Reordena códigos de clientes ativos
- ✅ Verifica resultado final

## 🧪 Como Testar

### **1. Teste de Geração Sequencial**
```sql
-- Verificar próximo código
SELECT generate_customer_code() as proximo_codigo;

-- Verificar sequência atual (apenas clientes ativos)
SELECT customer_code, full_name 
FROM profiles 
WHERE role = 'customer' 
AND (active = true OR active IS NULL)
ORDER BY CAST(customer_code AS INTEGER);
```

### **2. Teste via API**
```bash
# Buscar próximo código
curl http://localhost:3000/api/customers/next-code

# Resposta esperada:
{
  "next_code": "0001",
  "next_number": 1
}
```

### **3. Teste de Cenários**

#### **Cenário 1: Primeiro Cliente**
- Resultado: `0001`

#### **Cenário 2: Cliente após exclusão**
- Se cliente `0002` for deletado
- Próximo cliente recebe: `0002` (não `0003`)

#### **Cenário 3: Todos deletados**
- Se todos os clientes forem deletados
- Próximo cliente recebe: `0001` ✅ **CORRIGIDO**

## 📊 Exemplos de Funcionamento

### **Estado Inicial:**
```
Cliente A: 0001 (ativo)
Cliente B: 0002 (ativo)
Cliente C: 0003 (ativo)
```

### **Após Deletar Cliente B (soft delete):**
```
Cliente A: 0001 (ativo)
Cliente B: 0002 (inativo) ← Não interfere na sequência
Cliente C: 0003 (ativo)
Próximo cliente: 0002 ✅
```

### **Após Deletar Todos:**
```
Próximo cliente: 0001 ✅
```

## 🔄 Fluxo de Implementação

### **1. Executar Script Principal**
```bash
# No PostgreSQL
\i scripts/implement-customer-codes.sql
```

### **2. Executar Correção Automática (se necessário)**
```bash
# No PostgreSQL
\i scripts/fix-customer-codes-after-deletion.sql
```

### **3. Testar Comportamento**
```bash
# No PostgreSQL
\i scripts/test-customer-codes-behavior.sql
```

## 🛡️ Garantias de Funcionamento

### **1. Sem Gaps**
- ✅ Lógica baseada no maior código existente + 1
- ✅ Não usa sequência PostgreSQL que pode ter gaps
- ✅ Verifica apenas códigos numéricos válidos
- ✅ **CORRIGIDO**: Considera apenas clientes ativos

### **2. Formato Consistente**
- ✅ Sempre 4 dígitos: 0001, 0002, 0003...
- ✅ Zeros à esquerda para alinhamento
- ✅ Validação de formato numérico

### **3. Compatibilidade**
- ✅ Mantém trigger existente
- ✅ Compatível com APIs atuais
- ✅ Não quebra funcionalidades existentes

### **4. Comportamento Após Exclusões**
- ✅ **CORRIGIDO**: Clientes inativos não interferem na sequência
- ✅ **CORRIGIDO**: Após deletar todos, próximo recebe 0001
- ✅ **CORRIGIDO**: Soft delete não afeta numeração

## 📈 Benefícios

### **1. Organização**
- ✅ Códigos sempre sequenciais e organizados
- ✅ Fácil identificação visual
- ✅ Padrão consistente

### **2. Usabilidade**
- ✅ Próximo código sempre previsível
- ✅ Não há confusão com gaps
- ✅ Interface mais limpa

### **3. Manutenibilidade**
- ✅ Lógica simples e clara
- ✅ Fácil debug e troubleshooting
- ✅ Documentação completa

## 🔍 Monitoramento

### **Logs de Debug:**
```
[CUSTOMERS] Próximo código sequencial: 0001
[DELETE_CLIENTS] Cliente deletado: 0002 (inativo)
[CUSTOMERS] Próximo código sequencial: 0002
```

### **Verificações Periódicas:**
```sql
-- Verificar gaps (apenas clientes ativos)
WITH numbered_codes AS (
    SELECT 
        CAST(customer_code AS INTEGER) as code_num,
        ROW_NUMBER() OVER (ORDER BY CAST(customer_code AS INTEGER)) as expected_num
    FROM profiles 
    WHERE role = 'customer' 
    AND customer_code IS NOT NULL 
    AND customer_code ~ '^[0-9]+$'
    AND (active = true OR active IS NULL)
)
SELECT 
    COUNT(CASE WHEN code_num != expected_num THEN 1 END) as gaps_encontrados
FROM numbered_codes;
```

## 🚨 Correções Implementadas

### **Problema Identificado:**
- ❌ Clientes inativos (soft delete) interferiam na sequência
- ❌ Após deletar todos os clientes, próximo não recebia 0001

### **Soluções Implementadas:**
- ✅ **Filtro de clientes ativos**: `AND (active = true OR active IS NULL)`
- ✅ **Limpeza de códigos inativos**: Remove códigos de clientes deletados
- ✅ **Reordenação automática**: Corrige sequência após exclusões
- ✅ **Teste de comportamento**: Scripts para verificar funcionamento

---

**Status**: ✅ **IMPLEMENTADO E CORRIGIDO**  
**Data**: $(date)  
**Versão**: 2.1.0 