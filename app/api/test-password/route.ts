import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando geração e comparação de senhas...');

    // 1. Gerar hash correto para "admin123"
    const password = 'admin123';
    const saltRounds = 10;
    const correctHash = await bcrypt.hash(password, saltRounds);
    
    console.log('Hash gerado:', correctHash);

    // 2. Testar comparação com hash atual
    const currentHash = '$2b$10$rOzJqQZ8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVuO8kYyVKVjKZyVKVu';
    const currentHashWorks = await bcrypt.compare(password, currentHash);
    
    // 3. Testar comparação com hash novo
    const newHashWorks = await bcrypt.compare(password, correctHash);

    // 4. Buscar usuário atual
    const supabase = getSupabaseServerClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, password_hash')
      .eq('email', 'admin@pizzaria.com')
      .maybeSingle();
    if (error) throw error;
    const userHashWorks = user ? await bcrypt.compare(password, user.password_hash || '') : false;

    return NextResponse.json({
      success: true,
      tests: {
        password: password,
        currentHash: {
          hash: currentHash,
          works: currentHashWorks
        },
        newHash: {
          hash: correctHash,
          works: newHashWorks
        },
        userFromDB: {
          exists: !!user,
          email: user?.email,
          hashWorks: userHashWorks,
          storedHash: user?.password_hash?.substring(0, 20) + '...'
        }
      },
      recommendation: currentHashWorks ? 'Hash atual está OK' : 'Precisa atualizar hash no banco'
    });

  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Atualizando hash da senha no banco...');

    // 1. Gerar hash correto
    const password = 'admin123';
    const saltRounds = 10;
    const correctHash = await bcrypt.hash(password, saltRounds);

    // 2. Atualizar no banco
    const supabase = getSupabaseServerClient();
    await supabase
      .from('profiles')
      .update({ password_hash: correctHash, updated_at: new Date().toISOString() })
      .eq('email', 'admin@pizzaria.com');
    await supabase
      .from('profiles')
      .update({ password_hash: correctHash, updated_at: new Date().toISOString() })
      .eq('email', 'admin@williamdiskpizza.com');

    // 3. Verificar se funcionou
    const { data: user, error } = await supabase
      .from('profiles')
      .select('email, password_hash')
      .eq('email', 'admin@pizzaria.com')
      .maybeSingle();
    if (error) throw error;
    const hashWorks = await bcrypt.compare(password, user?.password_hash || '');

    return NextResponse.json({
      success: true,
      message: 'Hash atualizado com sucesso!',
      details: {
        newHash: correctHash,
        testPassed: hashWorks,
        updatedUsers: ['admin@pizzaria.com', 'admin@williamdiskpizza.com']
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar hash:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}