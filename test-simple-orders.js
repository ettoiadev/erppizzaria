const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://nrqhsjjqvnhqyqxzqpqo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycWhzampxdm5ocXlxeHpxcHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3ODIzMTEsImV4cCI6MjA1MTM1ODMxMX0.7xEhZiON1OfkjzOgqgBBzqJQPKjLEXkJhBnfJZjqfHY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOrdersAPI() {
  try {
    console.log('🔍 Testando busca de pedidos...')
    
    // Buscar pedidos simples
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error)
      return
    }

    console.log(`✅ ${orders?.length || 0} pedidos encontrados`)
    
    if (orders && orders.length > 0) {
      console.log('\n📋 Primeiro pedido:')
      console.log('ID:', orders[0].id)
      console.log('Status:', orders[0].status)
      console.log('Total:', orders[0].total)
      console.log('Cliente:', orders[0].customer_name)
      console.log('User ID:', orders[0].user_id)
      
      // Testar busca de perfil se user_id existe
      if (orders[0].user_id) {
        console.log('\n👤 Buscando dados do cliente...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', orders[0].user_id)
          .single()
        
        if (profileError) {
          console.log('⚠️  Erro ao buscar perfil:', profileError.message)
        } else {
          console.log('✅ Perfil encontrado:', profile?.full_name || 'Sem nome')
        }
      }
      
      // Testar busca de itens do pedido
      console.log('\n🛒 Buscando itens do pedido...')
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, name, unit_price, total_price, quantity')
        .eq('order_id', orders[0].id)
      
      if (itemsError) {
        console.log('⚠️  Erro ao buscar itens:', itemsError.message)
      } else {
        console.log(`✅ ${orderItems?.length || 0} itens encontrados`)
        if (orderItems && orderItems.length > 0) {
          orderItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.name} - R$ ${item.unit_price} x ${item.quantity}`)
          })
        }
      }
    }
    
    console.log('\n🎉 Teste concluído com sucesso!')
    
  } catch (error) {
    console.error('💥 Erro no teste:', error)
  }
}

testOrdersAPI() 