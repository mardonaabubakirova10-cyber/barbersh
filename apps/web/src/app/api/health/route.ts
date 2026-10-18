import { NextResponse } from 'next/server';
import { getBot } from '@/lib/bot';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET() {
  const telegramBot = getBot() ? 'configured' : 'missing_token';
  return NextResponse.json({
    ok: true,
    status: 'ok',
    service: 'barbershop-api',
    telegramBot,
    timestamp: new Date().toISOString(),
  });
}

