import { NextRequest, NextResponse } from 'next/server';
import { getBot } from '@/lib/bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const bot = getBot();
  if (!bot) {

    return NextResponse.json(
      { success: false, error: 'Telegram Bot is not configured' },
      { status: 400 }
    );
  }

  try {
    const update = await request.json();
    await bot.handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
