/**
 * Script para inserir dados de teste na tabela de pedidos
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'erp_pizzaria',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '134679',
  ssl: process.env.POSTGRES_SSL === 'true' ? true : false,
});

// Função para executar queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function seedOrders() {
  console.log('Iniciando inserção de dados de teste na tabela de pedidos...');
  
  try {
    // Verificar se já existem pedidos
    const existingOrders = await query('SELECT COUNT(*) FROM orders');
    if (existingOrders.rows[0].count > 0) {
      console.log(`Já existem ${existingOrders.rows[0].count} pedidos na tabela.`);
    }
    
    // Buscar alguns clientes para associar aos pedidos
    const customers = await query('SELECT id FROM profiles LIMIT 5');
    if (customers.rows.length === 0) {
      console.log('Nenhum cliente encontrado. Criando cliente padrão...');
      const clientId = uuidv4();
      await query(`
        INSERT INTO profiles (id, full_name, email, phone, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [clientId, 'Cliente Teste', 'cliente@teste.com', '11999999999']);
      
      // Buscar o cliente recém-criado
      const newCustomers = await query('SELECT id FROM profiles WHERE full_name = $1', ['Cliente Teste']);
      customers.rows = newCustomers.rows;
    }
    
    // Buscar alguns produtos para associar aos pedidos
    const products = await query('SELECT id, name, price FROM products LIMIT 10');
    if (products.rows.length === 0) {
      console.log('Nenhum produto encontrado. Por favor, adicione produtos antes de criar pedidos de teste.');
      return;
    }
    
    // Status possíveis para os pedidos
    const statuses = ['pending', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'];
    
    // Métodos de pagamento possíveis
    const paymentMethods = ['credit_card', 'debit_card', 'cash', 'pix'];
    
    // Criar 20 pedidos de teste
    for (let i = 0; i < 20; i++) {
      const orderId = uuidv4();
      const customerId = customers.rows[Math.floor(Math.random() * customers.rows.length)].id;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Gerar data aleatória nos últimos 30 dias
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      // Calcular valores do pedido
      const itemsCount = Math.floor(Math.random() * 5) + 1; // 1 a 5 itens por pedido
      let subtotal = 0;
      let items = [];
      
      // Criar itens do pedido
      for (let j = 0; j < itemsCount; j++) {
        const product = products.rows[Math.floor(Math.random() * products.rows.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1 a 3 unidades
        const itemTotal = product.price * quantity;
        subtotal += itemTotal;
        
        items.push({
          product_id: product.id,
          name: product.name,
          quantity,
          unit_price: product.price,
          total_price: itemTotal
        });
      }
      
      // Aplicar taxa de entrega
      const deliveryFee = 10.0;
      const total = subtotal + deliveryFee;
      
      // Inserir o pedido
      await query(`
        INSERT INTO orders (
          id, user_id, status, payment_method, subtotal, delivery_fee, 
          total, items, address, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        orderId,
        customerId,
        status,
        paymentMethod,
        subtotal,
        deliveryFee,
        total,
        JSON.stringify(items),
        JSON.stringify({
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01001-000',
          complement: 'Apto 42'
        }),
        date.toISOString(),
        date.toISOString()
      ]);
      
      console.log(`Pedido ${i+1}/20 criado com ID: ${orderId}`);
    }
    
    console.log('Dados de teste inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir dados de teste:', error);
  } finally {
    // Fechar o pool de conexões
    pool.end();
  }
}

// Executar a função principal
seedOrders().then(() => {
  console.log('Script finalizado.');
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});