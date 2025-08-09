import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Inicializando admin_settings (Supabase)...');
    const supabase = getSupabaseServerClient();

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
      await supabase
        .from('admin_settings')
        .upsert({ setting_key: key, setting_value: value, description, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });
    }

    const { data: verification } = await supabase
      .from('admin_settings')
      .select('id', { count: 'exact', head: true });
    const settingsCount = (verification as any)?.length || 0;

    console.log('✅ Tabela admin_settings criada com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Tabela admin_settings criada com sucesso!',
      details: { settingsCreated: settingsCount },
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