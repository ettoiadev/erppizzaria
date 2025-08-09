# Documentação Vercel

## Índice

- [Introdução](#introdução)
- [Implantação (Deployment)](#implantação-deployment)
  - [Implantação Automática](#implantação-automática)
  - [Implantação via CLI](#implantação-via-cli)
  - [Previews](#previews)
- [Configuração](#configuração)
  - [Arquivo vercel.json](#arquivo-verceljson)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Domínios e HTTPS](#domínios-e-https)
- [Serverless Functions](#serverless-functions)
- [Edge Functions](#edge-functions)
- [Middleware](#middleware)
- [Integração com Next.js](#integração-com-nextjs)
- [Monitoramento e Analytics](#monitoramento-e-analytics)
- [Otimizações de Performance](#otimizações-de-performance)

## Introdução

A Vercel é uma plataforma de hospedagem e implantação para aplicações web, especializada em frameworks JavaScript como Next.js, React, Vue, Angular, Svelte e outros. Ela oferece uma experiência de desenvolvimento simplificada com foco em performance, escalabilidade e experiência do desenvolvedor.

## Implantação (Deployment)

### Implantação Automática

A Vercel se integra com repositórios Git (GitHub, GitLab, Bitbucket) para implantação automática:

1. Conecte seu repositório na interface da Vercel
2. Configure as opções de build
3. A cada push para a branch principal, a Vercel implanta automaticamente

### Implantação via CLI

A Vercel CLI permite implantar diretamente do seu ambiente local:

```bash
# Instalar a CLI globalmente
npm i -g vercel

# Login na sua conta Vercel
vercel login

# Implantar o projeto atual
vercel

# Implantar para produção
vercel --prod
```

### Previews

A Vercel cria automaticamente previews para cada pull request, permitindo visualizar as mudanças antes de mesclar com a branch principal.

- Cada preview recebe uma URL única
- Comentários são adicionados automaticamente aos PRs com links para os previews
- Facilita a revisão de código e testes

## Configuração

### Arquivo vercel.json

O arquivo `vercel.json` permite configurar diversos aspectos da sua implantação:

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/" }
  ],
  "env": {
    "CUSTOM_ENV_VAR": "value"
  },
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

### Variáveis de Ambiente

A Vercel permite configurar variáveis de ambiente para diferentes ambientes (produção, preview, desenvolvimento):

- Configuração via dashboard da Vercel
- Configuração via CLI: `vercel env add`
- Arquivos `.env`, `.env.local`, `.env.production`, etc.
- Variáveis de ambiente encriptadas para segredos

## Domínios e HTTPS

A Vercel oferece gerenciamento simplificado de domínios:

- Domínios personalizados com configuração automática de DNS
- Certificados SSL/TLS automáticos via Let's Encrypt
- Renovação automática de certificados
- Redirecionamentos de domínio configuráveis
- Suporte a domínios apex e subdomínios

```bash
# Adicionar um domínio personalizado via CLI
vercel domains add meuapp.com
```

## Serverless Functions

A Vercel permite criar APIs serverless facilmente:

### API Routes no Next.js

```javascript
// pages/api/hello.js
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello World' })
}
```

### Funções Serverless Standalone

```javascript
// api/date.js
module.exports = (req, res) => {
  const date = new Date().toString()
  res.status(200).send(date)
}
```

Características:

- Escalam automaticamente
- Sem servidor para gerenciar
- Baixa latência global através da rede de borda
- Suporte a diversos runtimes (Node.js, Python, Go, Ruby)

## Edge Functions

Edge Functions são executadas na rede de borda da Vercel, mais próximas dos usuários:

```javascript
// pages/api/edge.js
export const config = {
  runtime: 'edge'
}

export default async function handler(req) {
  return new Response(
    JSON.stringify({ message: 'Hello from the Edge!' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}
```

Vantagens:

- Latência extremamente baixa
- Inicialização rápida (cold starts mínimos)
- Acesso a APIs da Web modernas
- Ideal para personalização baseada em localização, A/B testing, etc.

## Middleware

O Middleware permite interceptar e modificar requisições antes que elas alcancem suas rotas finais:

```javascript
// middleware.js
export function middleware(request) {
  const url = request.nextUrl.clone()
  
  // Verificar autenticação
  if (url.pathname.startsWith('/dashboard') && !isAuthenticated(request)) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // Adicionar headers
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'custom-value')
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

Casos de uso:

- Autenticação e autorização
- Redirecionamentos e reescritas
- Manipulação de headers
- Geolocalização e personalização
- A/B testing

## Integração com Next.js

A Vercel é a plataforma ideal para aplicações Next.js, oferecendo suporte nativo a todos os recursos:

- Renderização Híbrida (SSR, SSG, ISR)
- API Routes
- Middleware
- Image Optimization
- Edge Functions
- Internacionalização (i18n)

Configurações específicas para Next.js:

```json
// next.config.js
module.exports = {
  images: {
    domains: ['exemplo.com'],
  },
  i18n: {
    locales: ['pt-BR', 'en-US'],
    defaultLocale: 'pt-BR',
  },
  experimental: {
    serverActions: true,
  },
}
```

## Monitoramento e Analytics

A Vercel oferece ferramentas integradas para monitoramento:

- **Analytics**: Métricas de performance do lado do cliente (Web Vitals)
- **Logs**: Visualização de logs de funções serverless e edge
- **Status**: Monitoramento de status de implantações
- **Integração com ferramentas externas**: Sentry, Datadog, LogDNA

## Otimizações de Performance

A Vercel implementa automaticamente várias otimizações:

- **Edge Network**: CDN global para servir conteúdo estático
- **Compressão Brotli**: Compressão avançada para arquivos
- **Otimização de Imagens**: Redimensionamento, formatação e compressão automáticos
- **Minificação**: Redução automática do tamanho de arquivos JS, CSS e HTML
- **Cache Inteligente**: Estratégias de cache otimizadas

### Exemplo de Otimização de Imagens

```jsx
import Image from 'next/image'

export default function MeuComponente() {
  return (
    <Image
      src="/imagem.jpg"
      alt="Descrição da imagem"
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      priority={true}
    />
  )
}
```

### Headers de Cache Personalizados

```json
// vercel.json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```