export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';
import {
  ensureDefaultAdmin,
  verifyPassword,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
} from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await ensureDefaultAdmin().catch((e) => console.error('ensureDefaultAdmin error:', e));

    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `${ip}_${username}`;
    const rateCheck = checkLoginRateLimit(rateKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Слишком много неудачных попыток входа. Блокировка на ${rateCheck.remainingSec} сек.`,
        },
        { status: 429 }
      );
    }

    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      recordFailedLogin(rateKey);
      return NextResponse.json(
        { success: false, error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    clearLoginAttempts(rateKey);

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        token: `adm_${admin.id}_${Date.now()}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка авторизации' },
      { status: 500 }
    );
  }
}
