const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ewoihxpitbbypqylhdkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2loeHBpdGJieXBxeWxoZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDM1OTQsImV4cCI6MjA2NzA3OTU5NH0.1Fpv-oQogUez8ySm-W3nRiEt0g7KsncMBDVIWEqiAwQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOrdersAPI() {
  console.log('🔍 Testando API de pedidos...');
  
  try {
    // 1. Testar busca simples de pedidos
    console.log('1. Buscando pedidos...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Erro ao buscar pedidos:', ordersError);
      return;
    }
    
    console.log('✅ Pedidos encontrados:', orders?.length || 0);
    
    // 2. Testar busca com relacionamentos
    console.log('2. Buscando pedidos com relacionamentos...');
    
    const { data: ordersWithRelations, error: relationsError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(full_name, email, phone),
        order_items(
          id, name, unit_price, total_price, quantity, size, toppings, special_instructions,
          products(name, image)
        )
      `)
      .limit(3);
    
    if (relationsError) {
      console.error('❌ Erro ao buscar pedidos com relacionamentos:', relationsError);
      return;
    }
    
    console.log('✅ Pedidos com relacionamentos:', ordersWithRelations?.length || 0);
    
    if (ordersWithRelations && ordersWithRelations.length > 0) {
      console.log('📋 Exemplo de pedido:', {
        id: ordersWithRelations[0].id,
        status: ordersWithRelations[0].status,
        total: ordersWithRelations[0].total,
        customer: ordersWithRelations[0].profiles?.full_name || ordersWithRelations[0].customer_name,
        items_count: ordersWithRelations[0].order_items?.length || 0
      });
    }
    
    // 3. Testar estrutura da tabela orders
    console.log('3. Verificando estrutura da tabela orders...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'orders' });
    
    if (tableError) {
      console.log('⚠️ Não foi possível obter info da tabela (função não disponível)');
    } else {
      console.log('📊 Estrutura da tabela:', tableInfo);
    }
    
    // 4. Verificar se há dados de teste
    console.log('4. Verificando dados existentes...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
    } else {
      console.log('👥 Profiles encontrados:', profiles?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testOrdersAPI(); 