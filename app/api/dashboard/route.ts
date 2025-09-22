import { NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { frontendLogger } from '@/lib/frontend-logger';
import { cacheData, getCachedData } from '@/lib/cache-manager';

// Tempo de cache em segundos (2 minutos)
const CACHE_TTL = 120;

// Dados padrão para fallback
const DEFAULT_DASHBOARD_DATA = {
  stats: {
    today_orders: 0,
    total_orders: 0,
    daily_sales: 0,
    avg_delivery_time: 0,
    total_products: 0,
    total_categories: 0,
    active_customers: 0,
    revenue_growth: 0
  },
  recentOrders: [],
  topProducts: []
};

export async function GET() {
  try {
    // Verificar cache primeiro
    const cachedData = await getCachedData('dashboard_stats');
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Consulta simplificada para estatísticas do dashboard com tratamento de erros
    const safeQuery = async (sql: string, defaultValue: any = []) => {
      try {
        const result = await query(sql);
        return result.rows || defaultValue;
      } catch (err) {
        frontendLogger.logError('Erro na consulta do dashboard', err);
        return defaultValue;
      }
    };

    // Consultas individuais mais simples para evitar erros complexos
    const todayOrdersQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM orders 
      WHERE DATE(created_at) = CURRENT_DATE;
    `;

    const yesterdayOrdersQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM orders 
      WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day';
    `;

    const totalOrdersQuery = `
      SELECT COUNT(*) as count
      FROM orders;
    `;

    const productsQuery = `
      SELECT COUNT(*) as count
      FROM products
      WHERE active = true;
    `;

    const categoriesQuery = `
      SELECT COUNT(*) as count
      FROM categories
      WHERE active = true;
    `;

    const customersQuery = `
      SELECT COUNT(*) as count
      FROM profiles
      WHERE role = 'customer';
    `;

    // Consulta para pedidos recentes
    const recentOrdersQuery = `
      SELECT 
        o.id, 
        o.total, 
        o.status, 
        COALESCE(p.full_name, 'Cliente') AS customer_name, 
        o.created_at
      FROM orders o
      LEFT JOIN profiles p ON o.customer_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 5;
    `;

    // Consulta para produtos mais vendidos (simplificada)
    const topProductsQuery = `
      SELECT 
        p.name,
        COUNT(oi.id) AS sales_count,
        COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.name
      ORDER BY sales_count DESC
      LIMIT 5;
    `;

    // Executar consultas em paralelo com tratamento de erros
    const [
      todayOrdersResult,
      yesterdayOrdersResult,
      totalOrdersResult,
      productsResult,
      categoriesResult,
      customersResult,
      recentOrdersResult,
      topProductsResult
    ] = await Promise.allSettled([
      safeQuery(todayOrdersQuery, [{ count: '0', total: '0' }]),
      safeQuery(yesterdayOrdersQuery, [{ count: '0', total: '0' }]),
      safeQuery(totalOrdersQuery, [{ count: '0' }]),
      safeQuery(productsQuery, [{ count: '0' }]),
      safeQuery(categoriesQuery, [{ count: '0' }]),
      safeQuery(customersQuery, [{ count: '0' }]),
      safeQuery(recentOrdersQuery, []),
      safeQuery(topProductsQuery, [])
    ]);

    // Extrair dados com fallbacks seguros
    const getSafeResult = (result: any, defaultValue: any) => 
      result.status === 'fulfilled' ? result.value : defaultValue;

    const todayOrders = getSafeResult(todayOrdersResult, [{ count: '0', total: '0' }])[0];
    const yesterdayOrders = getSafeResult(yesterdayOrdersResult, [{ count: '0', total: '0' }])[0];
    const totalOrders = getSafeResult(totalOrdersResult, [{ count: '0' }])[0];
    const products = getSafeResult(productsResult, [{ count: '0' }])[0];
    const categories = getSafeResult(categoriesResult, [{ count: '0' }])[0];
    const customers = getSafeResult(customersResult, [{ count: '0' }])[0];
    const recentOrders = getSafeResult(recentOrdersResult, []);
    const topProducts = getSafeResult(topProductsResult, []);

    // Calcular crescimento com proteção contra divisão por zero
    const todaySales = parseFloat(todayOrders.total) || 0;
    const yesterdaySales = parseFloat(yesterdayOrders.total) || 0;
    const revenueGrowth = yesterdaySales > 0 
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
      : (todaySales > 0 ? 100 : 0);

    // Montar dados do dashboard
    const dashboardData = {
      stats: {
        today_orders: parseInt(todayOrders.count) || 0,
        total_orders: parseInt(totalOrders.count) || 0,
        daily_sales: todaySales,
        avg_delivery_time: 0, // Simplificado para evitar erros
        total_products: parseInt(products.count) || 0,
        total_categories: parseInt(categories.count) || 0,
        active_customers: parseInt(customers.count) || 0,
        revenue_growth: revenueGrowth
      },
      recentOrders,
      topProducts
    };

    // Armazenar em cache
    try {
      await cacheData('dashboard_stats', dashboardData, CACHE_TTL);
    } catch (cacheError) {
      frontendLogger.logError('Erro ao armazenar cache do dashboard', cacheError);
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    frontendLogger.logError('Erro ao buscar dados do dashboard', error);
    
    // Retornar dados padrão em caso de erro para evitar quebra da UI
    return NextResponse.json(DEFAULT_DASHBOARD_DATA);
  }
}