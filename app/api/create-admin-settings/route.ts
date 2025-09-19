import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgresql';
import { frontendLogger } from '@/lib/frontend-logger';

export async function POST(request: NextRequest) {
  try {
    frontendLogger.info('Inicializando admin_settings no PostgreSQL', 'api');

    // Inserir configurações padrão (idempotente)
    const defaults = [
      ['allowAdminRegistration', 'enabled', 'Permitir registro de administradores'],
      ['deliveryFee', '5.00', 'Taxa de entrega padrão'],
      ['minimumOrderValue', '20.00', 'Valor mínimo do pedido'],
      ['maxDeliveryDistance', '10', 'Distância máxima de entrega em km'],
      ['estimatedDeliveryTime', '45', 'Tempo estimado de entrega em minutos'],
      ['storeOpen', 'true', 'Loja aberta para pedidos'],
      ['storeOpenTime', '18:00', 'Horário de abertura'],
      ['storeCloseTime', '23:30', 'Horário de fechamento'],
      ['companyName', 'William Disk Pizza', 'Nome da empresa'],
      ['companyPhone', '(11) 99999-9999', 'Telefone da empresa'],
      ['companyAddress', 'Rua das Pizzas, 123 - Centro', 'Endereço da empresa'],
    ];
    
    for (const [key, value, description] of defaults) {
      await query(`
        INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [key, value, description]);
    }

    const verification = await query('SELECT COUNT(*) as count FROM admin_settings');
    const settingsCount = parseInt(verification.rows[0].count);

    frontendLogger.info('Tabela admin_settings criada com sucesso', 'api', {
      settingsCreated: settingsCount
    });

    return NextResponse.json({
      success: true,
      message: 'Tabela admin_settings criada com sucesso!',
      details: { settingsCreated: settingsCount },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido'
    const stack = error?.stack
    
    frontendLogger.logError('Erro ao criar admin_settings', {
      errorMessage,
      stack,
      code: error?.code,
      hint: error?.hint
    }, error instanceof Error ? error : undefined, 'api')

    return NextResponse.json({
      success: false,
      error: 'Erro ao criar tabela admin_settings',
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      }
    }, { status: 500 });
  }
}