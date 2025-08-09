# Solução de Problemas com Deploy na Vercel

Este documento contém soluções para problemas comuns encontrados durante o deploy de aplicações Next.js na Vercel.

## Erro: Incompatibilidade entre `routes` e `headers`

### Problema

Ao tentar fazer o deploy na Vercel, você pode encontrar o seguinte erro:

```
If `rewrites`, `redirects`, `headers`, `cleanUrls` or `trailingSlash` are used, then `routes` cannot be present.
```

### Causa

A Vercel não permite o uso simultâneo de `routes` com outras configurações de roteamento como `headers`, `rewrites`, `redirects`, `cleanUrls` ou `trailingSlash` no arquivo `vercel.json`. Isso ocorre porque essas configurações podem entrar em conflito entre si.

### Solução

Substitua a configuração `routes` por `rewrites` no seu arquivo `vercel.json`. Veja o exemplo abaixo:

#### Antes (com erro):

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/api/socket/(.*)", "dest": "/api/socket/$1" },
    { "src": "/(.*)", "dest": "/$1" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

#### Depois (corrigido):

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/next" }
  ],
  "rewrites": [
    { "source": "/api/socket/:path*", "destination": "/api/socket/:path*" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### Diferenças entre `routes` e `rewrites`

- **routes**: Formato mais antigo de configuração de rotas na Vercel, usando `src` e `dest`.
- **rewrites**: Formato mais novo, usando `source` e `destination`, que é compatível com outras configurações como `headers`.

### Sintaxe de Padrões

- Em `routes`, os padrões são definidos como `/api/socket/(.*)` (estilo regex).
- Em `rewrites`, os padrões são definidos como `/api/socket/:path*` (estilo de parâmetros nomeados).

## Outros Problemas Comuns

### Erro de Build

Se o build falhar durante o deploy, verifique:

1. Se todas as dependências estão corretamente listadas no `package.json`
2. Se o script de build está configurado corretamente
3. Se há erros de sintaxe ou importação no código

### Variáveis de Ambiente Faltando

Se a aplicação falhar após o deploy devido a variáveis de ambiente:

1. Verifique se todas as variáveis necessárias estão configuradas no dashboard da Vercel
2. Certifique-se de que as variáveis que começam com `NEXT_PUBLIC_` estão corretamente prefixadas

### Problemas com API Routes

Se as rotas de API não estiverem funcionando:

1. Verifique se o caminho está correto no arquivo `vercel.json`
2. Certifique-se de que as funções serverless estão retornando respostas válidas
3. Verifique os logs na dashboard da Vercel para identificar erros específicos

## Recursos Adicionais

- [Documentação oficial da Vercel sobre configuração](https://vercel.com/docs/projects/project-configuration)
- [Guia de migração de `routes` para `rewrites`](https://vercel.com/guides/upgrade-to-vercel-config-2-0)
- [Exemplos de configuração do Next.js na Vercel](https://github.com/vercel/next.js/tree/canary/examples)