/**
 * Script para corrigir a estrutura da tabela categories
 * Baseado no Plano de Correção - Fase 1.2
 * Problema identificado: coluna 'image' não existe
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'erp_pizzaria',
  user: 'postgres',
  password: '134679',
  ssl: false
});

async function fixCategoriesStructure() {
  console.log('🔧 CORREÇÃO DA ESTRUTURA DA TABELA CATEGORIES - FASE 1.2');
  console.log('='.repeat(60));
  
  try {
    // 1. Adicionar coluna image se não existir
    console.log('\n1. Adicionando coluna image...');
    const addColumnQuery = `
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS image TEXT;
    `;
    
    await pool.query(addColumnQuery);
    console.log('✅ Coluna image adicionada com sucesso');
    
    // 2. Verificar estrutura atualizada
    console.log('\n2. Verificando estrutura atualizada...');
    const structureQuery = `
      SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('\nEstrutura atualizada da tabela:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 3. Testar query da API
    console.log('\n3. Testando query da API após correção...');
    const apiQuery = `
      SELECT 
          id, 
          name, 
          description, 
          image, 
          sort_order, 
          active 
      FROM categories 
      ORDER BY sort_order ASC, name ASC;
    `;
    
    const apiResult = await pool.query(apiQuery);
    console.log(`✅ Query da API executada com sucesso: ${apiResult.rows.length} registros`);
    
    // 4. Mostrar dados das categorias
    console.log('\n4. Dados das categorias após correção:');
    apiResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}`);
      console.log(`    Nome: ${row.name}`);
      console.log(`    Descrição: ${row.description || 'N/A'}`);
      console.log(`    Imagem: ${row.image || 'N/A'}`);
      console.log(`    Ordem: ${row.sort_order || 0}`);
      console.log(`    Ativo: ${row.active}`);
      console.log('');
    });
    
    // 5. Verificar categorias ativas
    console.log('5. Verificando categorias ativas...');
    const activeQuery = `
      SELECT COUNT(*) as total_ativas
      FROM categories
      WHERE active = true;
    `;
    
    const activeResult = await pool.query(activeQuery);
    const totalAtivas = activeResult.rows[0].total_ativas;
    console.log(`📈 Total de categorias ativas: ${totalAtivas}`);
    
    // Resumo da correção
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMO DA CORREÇÃO:');
    console.log(`✅ Coluna image: ADICIONADA`);
    console.log(`✅ Estrutura da tabela: CORRIGIDA`);
    console.log(`✅ Query da API: FUNCIONAL`);
    console.log(`📊 Total de categorias: ${apiResult.rows.length}`);
    console.log(`📈 Categorias ativas: ${totalAtivas}`);
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO durante a correção:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar correção
fixCategoriesStructure().catch(console.error);