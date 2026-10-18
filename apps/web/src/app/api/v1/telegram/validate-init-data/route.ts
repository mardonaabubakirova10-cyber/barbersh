export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();
    if (!initData) {
      return NextResponse.json(
        { success: false, error: 'initData is required' },
        { status: 400 }
      );
    }

    const validation = validateTelegramInitData(initData);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid Telegram initData signature' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: validation.user,
        authDate: validation.authDate,
        isDev: validation.isDev,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to validate initData' },
      { status: 500 }
    );
  }
}
