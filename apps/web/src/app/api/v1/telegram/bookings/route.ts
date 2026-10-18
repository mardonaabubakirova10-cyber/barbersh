export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const telegramId = searchParams.get('telegramId');
  const phone = searchParams.get('phone');

  if (!telegramId && !phone) {
    return NextResponse.json(
      {
        success: false,
        error: 'telegramId or phone query parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    const conditions = [];
    if (telegramId) conditions.push({ telegramId: String(telegramId) });
    if (phone) conditions.push({ phone: phone.trim() });

    const client = await prisma.client.findFirst({
      where: {
        OR: conditions,
      },
      include: {
        bookings: {
          include: {
            barber: true,
            services: true,
            review: true,
          },
          orderBy: { startsAt: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: client.bookings, client });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch telegram bookings' },
      { status: 500 }
    );
  }
}
