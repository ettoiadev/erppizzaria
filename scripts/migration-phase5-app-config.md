# FASE 5: CONFIGURAÇÃO DA APLICAÇÃO

## ⚙️ Ajustar Next.js para Supabase

### 5.1 Instalar Dependências Supabase

```powershell
cd C:\williamdiskpizza

# Instalar cliente Supabase
npm install @supabase/supabase-js

# Instalar dependências adicionais 
npm install @supabase/auth-helpers-nextjs
npm install @supabase/auth-helpers-react

# Verificar instalação
npm list @supabase/supabase-js
```

### 5.2 Configurar Variáveis de Ambiente

**Crie `.env.local`:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database Configuration  
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# JWT Secret
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 5.3 Criar Cliente Supabase

**Criar `lib/supabase.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para operações do servidor (com service role)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Tipos personalizados
export type Profile = {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'customer' | 'admin' | 'kitchen' | 'delivery'
  email_verified: boolean
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  image?: string
  active: boolean
  product_number?: number
  show_image: boolean
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  user_id: string
  driver_id?: string
  status: 'RECEIVED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED'
  total: number
  subtotal: number
  delivery_fee: number
  discount: number
  payment_method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX'
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  delivery_address: string
  delivery_phone: string
  delivery_instructions?: string
  created_at: string
  updated_at: string
}
```

### 5.4 Atualizar lib/db.ts para Supabase

**Backup do arquivo atual:**

```powershell
copy lib\db.ts lib\db.ts.backup
```

**Novo `lib/db.ts`:**

```typescript
import { Pool } from 'pg'
import { supabase, supabaseAdmin } from './supabase'

// Manter compatibilidade com PostgreSQL direto
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres",
})

// Função para executar queries (mantém compatibilidade)
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Error executing query', { text: text.substring(0, 50), error })
    throw error
  }
}

// Função para obter cliente (mantém compatibilidade)
export async function getClient() {
  const client = await pool.connect()
  const queryFn = client.query.bind(client)
  const release = client.release.bind(client)

  client.release = () => {
    console.log('Cliente retornado ao pool')
    release()
  }

  return { client, query: queryFn, release }
}

// Exporta pool para compatibilidade
export { pool }

// Novas funções Supabase para facilitar migração
export { supabase, supabaseAdmin }

// Helpers para operações comuns
export const db = {
  // Usuários
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Produtos
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('active', true)
      .order('product_number')
    
    if (error) throw error
    return data
  },

  // Pedidos
  async getOrders(userId?: string) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey (
          full_name,
          email,
          phone
        ),
        drivers (
          name,
          phone
        ),
        order_items (
          *,
          products (
            name,
            price
          )
        )
      `)
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Realtime subscriptions
  subscribeToOrders(callback: (payload: any) => void) {
    return supabase
      .channel('orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        callback
      )
      .subscribe()
  },

  subscribeToOrderStatus(orderId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`order_${orderId}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        callback
      )
      .subscribe()
  }
}
```

### 5.5 Atualizar Auth Context

**Backup:**

```powershell
copy contexts\auth-context.tsx contexts\auth-context.tsx.backup
```

**Novo `contexts/auth-context.tsx`:**

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error

    // Criar perfil
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'customer'
        })
      
      if (profileError) throw profileError
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)

    if (error) throw error
    
    // Recarregar perfil
    await loadProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp, 
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
```

### 5.6 Checklist Configuração ✅

- [ ] Dependências Supabase instaladas
- [ ] Variáveis de ambiente configuradas  
- [ ] Cliente Supabase criado
- [ ] lib/db.ts atualizado
- [ ] Auth context migrado
- [ ] Tipos TypeScript definidos
- [ ] Backup dos arquivos originais

**🎯 Próximo: Teste da Aplicação** 