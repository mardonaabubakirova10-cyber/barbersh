import { NextResponse } from 'next/server';



export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET() {
  const hasToken = Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'MOCK_BOT_TOKEN'
  );
  return NextResponse.json({
    ok: true,
    status: 'ok',
    service: 'barbershop-api',
    telegramBot: hasToken ? 'configured' : 'missing_token',
    timestamp: new Date().toISOString(),
  });
}


