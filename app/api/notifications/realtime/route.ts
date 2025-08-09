import { NextRequest, NextResponse } from 'next/server';
import { emitRealtimeEvent } from '@/lib/realtime';
import { REALTIME_CHANNEL } from '@/lib/realtime';

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();
    
    // Emitir evento via Supabase Realtime
    await emitRealtimeEvent('notification', {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data,
      room: notification.room,
      timestamp: notification.timestamp,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao enviar notificação realtime:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}