import { NextResponse } from 'next/server';
import { bot } from '@/lib/bot';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'ok',
    service: 'barbershop-api',
    telegramBot: bot ? 'configured' : 'missing_token',
    timestamp: new Date().toISOString(),
  });
}
