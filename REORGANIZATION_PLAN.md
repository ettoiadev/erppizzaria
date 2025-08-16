# Plano de Reorganização - William Disk Pizza

## Estrutura Simplificada Proposta

```
williamdiskpizza/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Grupo de rotas de autenticação
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (customer)/        # Rotas do cliente
│   │   │   ├── menu/
│   │   │   ├── cart/
│   │   │   └── orders/
│   │   ├── (admin)/           # Rotas administrativas
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   └── orders/
│   │   ├── api/               # API Routes simplificadas
│   │   └── globals.css
│   ├── components/            # Componentes organizados por funcionalidade
│   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   ├── auth/             # Componentes de autenticação
│   │   ├── menu/             # Componentes do cardápio
│   │   ├── cart/             # Componentes do carrinho
│   │   └── admin/            # Componentes administrativos
│   ├── lib/                  # Utilitários essenciais
│   │   ├── supabase.ts       # Cliente Supabase único
│   │   ├── auth.ts           # Autenticação simplificada
│   │   ├── utils.ts          # Utilitários gerais
│   │   └── validations.ts    # Schemas de validação
│   └── types/                # Definições TypeScript
├── public/                   # Arquivos estáticos
├── .env.example             # Variáveis de ambiente simplificadas
├── package.json             # Dependências essenciais
└── README.md               # Documentação simplificada
```

## Simplificações Propostas

### 1. Banco de Dados
- **Remover**: db.ts, db-supabase-optimized.ts, múltiplos loggers
- **Manter**: Apenas um arquivo supabase.ts com cliente oficial

### 2. Autenticação
- **Simplificar**: auth.ts com apenas funções essenciais
- **Remover**: Middlewares complexos de rate limiting

### 3. Componentes
- **Reorganizar**: Por funcionalidade ao invés de tipo
- **Remover**: Componentes duplicados ou desnecessários

### 4. API Routes
- **Simplificar**: Estrutura de pastas mais direta
- **Remover**: APIs de debug e teste desnecessárias

### 5. Dependências
- **Remover**: Pacotes duplicados e desnecessários
- **Manter**: Apenas essenciais para funcionamento

### 6. Configurações
- **Simplificar**: .env com apenas variáveis necessárias
- **Remover**: Múltiplos arquivos de configuração

## Benefícios da Reorganização

1. **Código mais limpo e legível**
2. **Menor complexidade de manutenção**
3. **Melhor performance** (menos dependências)
4. **Estrutura mais intuitiva**
5. **Facilita onboarding de novos desenvolvedores**
6. **Reduz bugs por complexidade desnecessária**