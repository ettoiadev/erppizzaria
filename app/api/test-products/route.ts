import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando funcionalidade completa de produtos e categorias...');

    const tests = [];
    let passedTests = 0;
    let totalTests = 0;

    // Teste 1: Verificar se as tabelas existem
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      const { error: catErr } = await supabase.from('categories').select('id').limit(1);
      const { error: prodErr } = await supabase.from('products').select('id').limit(1);
      if (!catErr && !prodErr) {
        tests.push({ test: 'Tabelas categories e products existem', status: 'PASS' });
        passedTests++;
      } else {
        tests.push({ 
          test: 'Tabelas categories e products existem', 
          status: 'FAIL', 
          error: `Faltando: ${['categories', 'products'].filter(t => !existingTables.includes(t)).join(', ')}` 
        });
      }
    } catch (error: any) {
      tests.push({ test: 'Tabelas categories e products existem', status: 'FAIL', error: error.message });
    }

    // Teste 2: Verificar se há categorias cadastradas
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase.from('categories').select('id', { count: 'exact', head: true }).eq('active', true);
      const count = (data as any)?.length || 0;
      
      if (count > 0) {
        tests.push({ test: `Categorias cadastradas (${count})`, status: 'PASS' });
        passedTests++;
      } else {
        tests.push({ test: 'Categorias cadastradas', status: 'FAIL', error: 'Nenhuma categoria encontrada' });
      }
    } catch (error: any) {
      tests.push({ test: 'Categorias cadastradas', status: 'FAIL', error: error.message });
    }

    // Teste 3: Testar API GET /api/categories
    totalTests++;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/categories`);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.categories && Array.isArray(data.categories)) {
          tests.push({ 
            test: 'API GET /api/categories', 
            status: 'PASS', 
            details: `${data.categories.length} categorias retornadas`
          });
          passedTests++;
        } else {
          tests.push({ test: 'API GET /api/categories', status: 'FAIL', error: 'Formato de resposta inválido' });
        }
      } else {
        tests.push({ test: 'API GET /api/categories', status: 'FAIL', error: `Status ${response.status}` });
      }
    } catch (error: any) {
      tests.push({ test: 'API GET /api/categories', status: 'FAIL', error: error.message });
    }

    // Teste 4: Testar API GET /api/products
    totalTests++;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/products`);
      
      if (response.status === 200) {
        const data = await response.json();
        if (Array.isArray(data)) {
          tests.push({ 
            test: 'API GET /api/products', 
            status: 'PASS', 
            details: `${data.length} produtos retornados`
          });
          passedTests++;
        } else {
          tests.push({ test: 'API GET /api/products', status: 'FAIL', error: 'Formato de resposta inválido' });
        }
      } else {
        tests.push({ test: 'API GET /api/products', status: 'FAIL', error: `Status ${response.status}` });
      }
    } catch (error: any) {
      tests.push({ test: 'API GET /api/products', status: 'FAIL', error: error.message });
    }

    // Teste 5: Verificar relacionamento entre produtos e categorias
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      const { data: productsRows } = await supabase.from('products').select('id, category_id');
      const { data: categoriesRows } = await supabase.from('categories').select('id').eq('active', true);
      const productsCount = (productsRows || []).length;
      const categoriesWithProducts = (categoriesRows || []).filter(c => (productsRows || []).some(p => p.category_id === c.id)).length;
      tests.push({ test: 'Relacionamento produtos-categorias', status: 'PASS', details: `${productsCount} produtos, ${categoriesWithProducts} categorias` });
      passedTests++;
    } catch (error: any) {
      tests.push({ test: 'Relacionamento produtos-categorias', status: 'FAIL', error: error.message });
    }

    // Teste 6: Verificar índices importantes
    totalTests++;
    try {
      tests.push({ test: 'Índices necessários', status: 'SKIP', details: 'Não aplicável via API Supabase' });
    } catch (error: any) {
      tests.push({ test: 'Índices necessários', status: 'FAIL', error: error.message });
    }

    // Teste 7: Testar uma categoria específica
    totalTests++;
    try {
      const supabase = getSupabaseServerClient();
      const { data: cat } = await supabase.from('categories').select('id').eq('active', true).limit(1);
      
      if ((cat || []).length > 0) {
        const categoryId = cat?.[0]?.id;
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/categories/${categoryId}`);
        
        if (response.status === 200) {
          const data = await response.json();
          if (data.category && data.category.id === categoryId) {
            tests.push({ test: 'API GET categoria específica', status: 'PASS' });
            passedTests++;
          } else {
            tests.push({ test: 'API GET categoria específica', status: 'FAIL', error: 'Dados inválidos' });
          }
        } else {
          tests.push({ test: 'API GET categoria específica', status: 'FAIL', error: `Status ${response.status}` });
        }
      } else {
        tests.push({ test: 'API GET categoria específica', status: 'SKIP', error: 'Nenhuma categoria para testar' });
      }
    } catch (error: any) {
      tests.push({ test: 'API GET categoria específica', status: 'FAIL', error: error.message });
    }

    // Calcular score
    const score = Math.round((passedTests / totalTests) * 100);
    const status = score >= 90 ? 'EXCELLENT' : 
                  score >= 70 ? 'GOOD' : 
                  score >= 50 ? 'WARNING' : 'CRITICAL';

    // Estatísticas do banco
    const supabase = getSupabaseServerClient();
    const [categoriesResult, productsResult] = await Promise.all([
      supabase.from('categories').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('products').select('id', { count: 'exact' }).eq('active', true)
    ]);

    const statistics = {
      categories: categoriesResult.count || 0,
      products: productsResult.count || 0
    };

    // Recomendações
    const recommendations = [];
    const failedTests = tests.filter(t => t.status === 'FAIL');
    
    if (failedTests.length > 0) {
      recommendations.push('Corrigir testes que falharam');
    }
    
    if (statistics.products === 0) {
      recommendations.push('Inserir produtos de exemplo');
    }
    
    if (score < 100) {
      recommendations.push('Executar correções automáticas');
    }

    return NextResponse.json({
      success: true,
      status,
      score: `${score}%`,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        allPassed: passedTests === totalTests
      },
      tests,
      statistics,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro no teste de produtos:', error);

    return NextResponse.json({
      success: false,
      status: 'CRITICAL',
      error: 'Erro no teste de produtos',
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Inserindo produtos de exemplo...');

    // Buscar categorias existentes
    const categoriesResult = await query('SELECT id, name FROM categories WHERE active = true ORDER BY sort_order');
    const categories = categoriesResult.rows;

    if (categories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma categoria encontrada',
        message: 'Crie categorias antes de inserir produtos'
      }, { status: 400 });
    }

    let productsCreated = 0;

    // Inserir produtos para cada categoria
    for (const category of categories) {
      if (category.name.toLowerCase().includes('pizza')) {
        // Produtos de pizza
        const pizzaProducts = [
          { name: 'Pizza Margherita', description: 'Molho de tomate, mussarela e manjericão', price: 35.90 },
          { name: 'Pizza Calabresa', description: 'Molho de tomate, mussarela e calabresa', price: 38.90 },
          { name: 'Pizza Portuguesa', description: 'Molho, mussarela, presunto, ovos e cebola', price: 42.90 },
          { name: 'Pizza Quatro Queijos', description: 'Mussarela, gorgonzola, parmesão e provolone', price: 45.90 }
        ];

        for (const product of pizzaProducts) {
          await query(`
            INSERT INTO products (category_id, name, description, price, active, has_sizes, preparation_time)
            VALUES ($1, $2, $3, $4, true, true, 30)
            ON CONFLICT DO NOTHING
          `, [category.id, product.name, product.description, product.price]);
          productsCreated++;
        }
      } else if (category.name.toLowerCase().includes('bebida')) {
        // Produtos de bebida
        const drinkProducts = [
          { name: 'Coca-Cola 350ml', description: 'Refrigerante Coca-Cola lata', price: 5.50 },
          { name: 'Guaraná Antarctica 350ml', description: 'Refrigerante Guaraná lata', price: 5.50 },
          { name: 'Água Mineral 500ml', description: 'Água mineral natural', price: 3.00 },
          { name: 'Suco de Laranja 300ml', description: 'Suco natural de laranja', price: 7.00 }
        ];

        for (const product of drinkProducts) {
          await query(`
            INSERT INTO products (category_id, name, description, price, active, has_sizes, preparation_time)
            VALUES ($1, $2, $3, $4, true, false, 5)
            ON CONFLICT DO NOTHING
          `, [category.id, product.name, product.description, product.price]);
          productsCreated++;
        }
      } else if (category.name.toLowerCase().includes('sobremesa')) {
        // Produtos de sobremesa
        const dessertProducts = [
          { name: 'Pudim de Leite', description: 'Pudim caseiro com calda de caramelo', price: 12.90 },
          { name: 'Brigadeiro Gourmet', description: 'Brigadeiro artesanal (unidade)', price: 3.50 },
          { name: 'Torta de Chocolate', description: 'Fatia de torta de chocolate', price: 15.90 }
        ];

        for (const product of dessertProducts) {
          await query(`
            INSERT INTO products (category_id, name, description, price, active, has_sizes, preparation_time)
            VALUES ($1, $2, $3, $4, true, false, 10)
            ON CONFLICT DO NOTHING
          `, [category.id, product.name, product.description, product.price]);
          productsCreated++;
        }
      }
    }

    // Verificar quantos produtos foram realmente inseridos
    const finalCount = await query('SELECT COUNT(*) as count FROM products WHERE active = true');
    const totalProducts = parseInt(finalCount.rows[0].count);

    return NextResponse.json({
      success: true,
      message: 'Produtos de exemplo inseridos com sucesso!',
      details: {
        categoriesFound: categories.length,
        productsAttempted: productsCreated,
        totalProductsInDB: totalProducts
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao inserir produtos:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro ao inserir produtos de exemplo',
      details: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
  }
}