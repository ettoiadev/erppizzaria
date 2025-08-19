const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

console.log('=== TESTE DE CORREÇÃO DO LOGIN ===')
console.log()

// Verificar variáveis de ambiente
console.log('1. Verificando variáveis de ambiente:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'OK' : 'FALTANDO')
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'OK (anon)' : 'FALTANDO')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK (service_role)' : 'FALTANDO (usando fallback)')
console.log()

// Criar clientes Supabase
const supabaseUrl = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey

if (!supabaseUrl || !anonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

// Cliente com chave anon (limitado por RLS)
const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Cliente com chave service_role (bypassa RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testLogin() {
  try {
    console.log('2. Testando busca de usuário com chave ANON (limitada por RLS):')
    const { data: userAnon, error: errorAnon } = await supabaseAnon
      .from('profiles')
      .select('id, email, password_hash, full_name, role')
      .eq('email', 'admin@pizzaria.com')
      .maybeSingle()
    
    console.log('Resultado com chave anon:', userAnon ? 'USUÁRIO ENCONTRADO' : 'USUÁRIO NÃO ENCONTRADO')
    if (errorAnon) console.log('Erro com chave anon:', errorAnon.message)
    console.log()

    console.log('3. Testando busca de usuário com chave ADMIN (bypassa RLS):')
    const { data: userAdmin, error: errorAdmin } = await supabaseAdmin
      .from('profiles')
      .select('id, email, password_hash, full_name, role')
      .eq('email', 'admin@pizzaria.com')
      .maybeSingle()
    
    console.log('Resultado com chave admin:', userAdmin ? 'USUÁRIO ENCONTRADO ✅' : 'USUÁRIO NÃO ENCONTRADO ❌')
    if (errorAdmin) console.log('Erro com chave admin:', errorAdmin.message)
    
    if (userAdmin) {
      console.log('Dados do usuário:', {
        id: userAdmin.id,
        email: userAdmin.email,
        full_name: userAdmin.full_name,
        role: userAdmin.role,
        has_password: !!userAdmin.password_hash
      })
      
      // Testar validação de senha
      if (userAdmin.password_hash) {
        console.log()
        console.log('4. Testando validação de senha:')
        const senhaCorreta = await bcrypt.compare('admin123', userAdmin.password_hash)
        console.log('Senha "admin123" é válida:', senhaCorreta ? 'SIM ✅' : 'NÃO ❌')
      }
    }
    console.log()

    console.log('=== DIAGNÓSTICO ===')
    if (serviceRoleKey === anonKey) {
      console.log('⚠️  PROBLEMA IDENTIFICADO:')
      console.log('   A aplicação está usando a chave ANON para login, que é limitada por RLS.')
      console.log('   Para corrigir:')
      console.log('   1. Acesse o dashboard do Supabase: https://supabase.com/dashboard')
      console.log('   2. Vá em Project Settings > API')
      console.log('   3. Copie a chave "service_role"')
      console.log('   4. Adicione no .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui')
      console.log('   5. Reinicie o servidor')
    } else {
      console.log('✅ Configuração correta: usando chave service_role para login')
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

testLogin()