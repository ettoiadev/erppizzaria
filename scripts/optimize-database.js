/**
 * Script de Otimização do Banco de Dados PostgreSQL
 * Fase 3 - Otimizações Avançadas
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'erp_pizzaria',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '134679',
  ssl: false
});

// Índices otimizados para performance
const optimizedIndexes = [
  {
    name: 'idx_profiles_email_active',
    table: 'profiles',
    columns: ['email', 'active'],
    type: 'btree',
    reason: 'Otimizar login e busca de usuários ativos'
  },
  {
    name: 'idx_profiles_role_active',
    table: 'profiles',
    columns: ['role', 'active'],
    type: 'btree',
    reason: 'Otimizar busca de usuários por role'
  },
  {
    name: 'idx_products_category_active',
    table: 'products',
    columns: ['category_id', 'active'],
    type: 'btree',
    reason: 'Otimizar listagem de produtos por categoria'
  },
  {
    name: 'idx_products_name_search',
    table: 'products',
    columns: ['name'],
    type: 'gin',
    reason: 'Otimizar busca textual de produtos',
    special: true
  },
  {
    name: 'idx_products_price_active',
    table: 'products',
    columns: ['price', 'active'],
    type: 'btree',
    reason: 'Otimizar filtros por faixa de preço'
  },
  {
    name: 'idx_orders_customer_status',
    table: 'orders',
    columns: ['customer_id', 'status'],
    type: 'btree',
    reason: 'Otimizar consulta de pedidos por cliente e status'
  },
  {
    name: 'idx_orders_created_at_desc',
    table: 'orders',
    columns: ['created_at DESC'],
    type: 'btree',
    reason: 'Otimizar ordenação por data de criação (mais recentes primeiro)'
  },
  {
    name: 'idx_orders_status_created',
    table: 'orders',
    columns: ['status', 'created_at'],
    type: 'btree',
    reason: 'Otimizar dashboard admin por status e data'
  },
  {
    name: 'idx_order_items_order_id',
    table: 'order_items',
    columns: ['order_id'],
    type: 'btree',
    reason: 'Otimizar busca de itens por pedido'
  },
  {
    name: 'idx_order_items_product_stats',
    table: 'order_items',
    columns: ['product_id', 'created_at'],
    type: 'btree',
    reason: 'Otimizar relatórios de produtos mais vendidos'
  },
  {
    name: 'idx_favorites_customer_product',
    table: 'favorites',
    columns: ['customer_id', 'product_id'],
    type: 'btree',
    reason: 'Otimizar verificação de favoritos (unique constraint)'
  },
  {
    name: 'idx_customer_addresses_customer_active',
    table: 'customer_addresses',
    columns: ['customer_id', 'active'],
    type: 'btree',
    reason: 'Otimizar busca de endereços ativos por cliente'
  },
  {
    name: 'idx_refresh_tokens_token_hash',
    table: 'refresh_tokens',
    columns: ['token'],
    type: 'hash',
    reason: 'Otimizar validação de refresh tokens'
  },
  {
    name: 'idx_refresh_tokens_user_expires',
    table: 'refresh_tokens',
    columns: ['user_id', 'expires_at'],
    type: 'btree',
    reason: 'Otimizar limpeza de tokens expirados'
  },
  {
    name: 'idx_categories_active_sort',
    table: 'categories',
    columns: ['active', 'sort_order'],
    type: 'btree',
    reason: 'Otimizar listagem ordenada de categorias ativas'
  }
];

// Configurações de otimização do PostgreSQL
const postgresOptimizations = [
  {
    setting: 'work_mem',
    value: '16MB',
    description: 'Memória para operações de ordenação e hash'
  },
  {
    setting: 'shared_buffers',
    value: '256MB',
    description: 'Buffer compartilhado (25% da RAM)'
  },
  {
    setting: 'effective_cache_size',
    value: '1GB',
    description: 'Tamanho estimado do cache do SO (75% da RAM)'
  },
  {
    setting: 'random_page_cost',
    value: '1.1',
    description: 'Custo de página aleatória (otimizado para SSD)'
  },
  {
    setting: 'checkpoint_completion_target',
    value: '0.9',
    description: 'Target para conclusão de checkpoint'
  },
  {
    setting: 'wal_buffers',
    value: '16MB',
    description: 'Buffers do WAL'
  },
  {
    setting: 'default_statistics_target',
    value: '100',
    description: 'Target de estatísticas para otimizador'
  }
];

async function main() {
  console.log('🚀 Iniciando otimização do banco de dados PostgreSQL...');
  
  try {
    // Conectar ao banco
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    // 1. Analisar estado atual
    console.log('\n📊 Analisando estado atual do banco...');
    await analyzeCurrentState();
    
    // 2. Criar índices otimizados
    console.log('\n🔧 Criando índices otimizados...');
    await createOptimizedIndexes();
    
    // 3. Aplicar configurações de otimização
    console.log('\n⚙️ Aplicando configurações de otimização...');
    await applyOptimizations();
    
    // 4. Executar manutenção das tabelas
    console.log('\n🧹 Executando manutenção das tabelas...');
    await maintainTables();
    
    // 5. Analisar performance após otimizações
    console.log('\n📈 Analisando performance após otimizações...');
    await analyzePerformance();
    
    // 6. Gerar relatório
    console.log('\n📋 Gerando relatório de otimização...');
    await generateOptimizationReport();
    
    console.log('\n🎉 Otimização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante otimização:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function analyzeCurrentState() {
  try {
    // Verificar tamanho do banco
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
    `);
    console.log(`   Tamanho do banco: ${sizeResult.rows[0].database_size}`);
    
    // Verificar índices existentes
    const indexesResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes 
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 10
    `);
    
    console.log('   Índices existentes (top 10 por tamanho):');
    indexesResult.rows.forEach(row => {
      console.log(`     ${row.tablename}.${row.indexname}: ${row.size}`);
    });
    
    // Verificar estatísticas de tabelas
    const tablesResult = await pool.query(`
      SELECT 
        tablename,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_stat_user_tables 
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    
    console.log('   Estatísticas das tabelas:');
    tablesResult.rows.forEach(row => {
      console.log(`     ${row.tablename}: ${row.live_rows} linhas vivas, ${row.dead_rows} mortas, ${row.size}`);
    });
    
  } catch (error) {
    console.error('   Erro ao analisar estado atual:', error.message);
  }
}

async function createOptimizedIndexes() {
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const index of optimizedIndexes) {
    try {
      // Verificar se índice já existe
      const existsResult = await pool.query(
        'SELECT 1 FROM pg_indexes WHERE indexname = $1',
        [index.name]
      );
      
      if (existsResult.rows.length > 0) {
        console.log(`   ⏭️  Índice ${index.name} já existe`);
        skippedCount++;
        continue;
      }
      
      // Criar índice
      let createQuery = '';
      
      if (index.special && index.type === 'gin') {
        // Índice GIN para busca textual
        createQuery = `CREATE INDEX ${index.name} ON ${index.table} USING gin(to_tsvector('portuguese', ${index.columns[0]}))`;
      } else {
        const columnsStr = index.columns.join(', ');
        createQuery = `CREATE INDEX ${index.name} ON ${index.table} USING ${index.type} (${columnsStr})`;
      }
      
      await pool.query(createQuery);
      console.log(`   ✅ Criado: ${index.name} (${index.reason})`);
      createdCount++;
      
    } catch (error) {
      console.error(`   ❌ Erro ao criar ${index.name}:`, error.message);
    }
  }
  
  console.log(`   📊 Resumo: ${createdCount} criados, ${skippedCount} já existiam`);
}

async function applyOptimizations() {
  let appliedCount = 0;
  
  for (const optimization of postgresOptimizations) {
    try {
      const query = `SET ${optimization.setting} = '${optimization.value}'`;
      await pool.query(query);
      console.log(`   ✅ ${optimization.setting} = ${optimization.value} (${optimization.description})`);
      appliedCount++;
    } catch (error) {
      console.error(`   ❌ Erro ao aplicar ${optimization.setting}:`, error.message);
    }
  }
  
  console.log(`   📊 ${appliedCount}/${postgresOptimizations.length} configurações aplicadas`);
}

async function maintainTables() {
  const tables = ['profiles', 'categories', 'products', 'orders', 'order_items', 'favorites', 'customer_addresses', 'refresh_tokens'];
  
  for (const table of tables) {
    try {
      console.log(`   🧹 Mantendo tabela ${table}...`);
      
      // VACUUM para recuperar espaço
      await pool.query(`VACUUM ${table}`);
      
      // ANALYZE para atualizar estatísticas
      await pool.query(`ANALYZE ${table}`);
      
      console.log(`   ✅ ${table} mantida`);
    } catch (error) {
      console.error(`   ❌ Erro ao manter ${table}:`, error.message);
    }
  }
}

async function analyzePerformance() {
  try {
    // Cache hit ratio
    const cacheResult = await pool.query(`
      SELECT 
        sum(blks_hit) as hits,
        sum(blks_read) as reads,
        round(sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)), 2) as hit_ratio
      FROM pg_stat_database
    `);
    
    const hitRatio = cacheResult.rows[0].hit_ratio || 0;
    console.log(`   📊 Cache hit ratio: ${hitRatio}%`);
    
    // Índices mais utilizados
    const indexUsageResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read + idx_tup_fetch as total_reads
      FROM pg_stat_user_indexes 
      WHERE idx_tup_read + idx_tup_fetch > 0
      ORDER BY total_reads DESC
      LIMIT 5
    `);
    
    console.log('   🔝 Índices mais utilizados:');
    indexUsageResult.rows.forEach(row => {
      console.log(`     ${row.tablename}.${row.indexname}: ${row.total_reads} leituras`);
    });
    
    // Queries mais lentas (se disponível)
    try {
      const slowQueriesResult = await pool.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 5
      `);
      
      if (slowQueriesResult.rows.length > 0) {
        console.log('   🐌 Queries mais lentas (>100ms):');
        slowQueriesResult.rows.forEach(row => {
          console.log(`     ${row.mean_time.toFixed(2)}ms: ${row.query.substring(0, 60)}...`);
        });
      }
    } catch (error) {
      console.log('   ℹ️  pg_stat_statements não disponível para análise de queries');
    }
    
  } catch (error) {
    console.error('   ❌ Erro ao analisar performance:', error.message);
  }
}

async function generateOptimizationReport() {
  const timestamp = new Date().toISOString();
  const reportPath = path.join(__dirname, '..', 'reports', `database-optimization-${timestamp.split('T')[0]}.md`);
  
  // Criar diretório de relatórios se não existir
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const report = `# Relatório de Otimização do Banco de Dados

**Data:** ${timestamp}
**Banco:** erp_pizzaria

## Índices Criados

${optimizedIndexes.map(index => 
  `- **${index.name}** (${index.table}): ${index.reason}`
).join('\n')}

## Configurações Aplicadas

${postgresOptimizations.map(opt => 
  `- **${opt.setting}**: ${opt.value} - ${opt.description}`
).join('\n')}

## Próximos Passos

1. Monitorar performance das queries após otimizações
2. Executar VACUUM FULL se necessário (em horário de baixo uso)
3. Considerar particionamento para tabelas grandes
4. Implementar monitoramento contínuo de performance

## Comandos Úteis

\`\`\`sql
-- Verificar uso de índices
SELECT * FROM pg_stat_user_indexes ORDER BY idx_tup_read + idx_tup_fetch DESC;

-- Verificar cache hit ratio
SELECT 
  sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)) as hit_ratio
FROM pg_stat_database;

-- Verificar queries lentas (se pg_stat_statements estiver habilitado)
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
\`\`\`
`;
  
  try {
    fs.writeFileSync(reportPath, report);
    console.log(`   📄 Relatório salvo em: ${reportPath}`);
  } catch (error) {
    console.error('   ❌ Erro ao salvar relatório:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  createOptimizedIndexes,
  applyOptimizations,
  maintainTables,
  analyzePerformance
};