import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Criando tabela admin_settings...');

    // Criar tabela admin_settings
    await query(`
      CREATE TABLE IF NOT EXISTS public.admin_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Criar índice
    await query('CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key)');

    // Inserir configurações padrão
    await query(`
      INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
      ('allowAdminRegistration', 'enabled', 'Permitir registro de administradores'),
      ('deliveryFee', '5.00', 'Taxa de entrega padrão'),
      ('minimumOrderValue', '20.00', 'Valor mínimo do pedido'),
      ('maxDeliveryDistance', '10', 'Distância máxima de entrega em km'),
      ('estimatedDeliveryTime', '45', 'Tempo estimado de entrega em minutos'),
      ('storeOpen', 'true', 'Loja aberta para pedidos'),
      ('storeOpenTime', '18:00', 'Horário de abertura'),
      ('storeCloseTime', '23:30', 'Horário de fechamento'),
      ('companyName', 'William Disk Pizza', 'Nome da empresa'),
      ('companyPhone', '(11) 99999-9999', 'Telefone da empresa'),
      ('companyAddress', 'Rua das Pizzas, 123 - Centro', 'Endereço da empresa')
      ON CONFLICT (setting_key) DO NOTHING
    `);

    // Verificar se foi criado
    const verification = await query('SELECT COUNT(*) as count FROM admin_settings');
    const settingsCount = parseInt(verification.rows[0].count);

    console.log('✅ Tabela admin_settings criada com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Tabela admin_settings criada com sucesso!',
      details: {
        settingsCreated: settingsCount,
        tableCreated: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar admin_settings:', error);

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