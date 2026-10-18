export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, getAvailableDays } from '@/lib/slots';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const barberId = searchParams.get('barberId') || undefined;
  const fromDate = searchParams.get('fromDate');
  const durationMin = searchParams.get('durationMin');
  const days = searchParams.get('days');

  if (!fromDate || !durationMin) {
    return NextResponse.json(
      { success: false, error: 'fromDate and durationMin are required' },
      { status: 400 }
    );
  }

  try {
    const numDays = Number(days ?? 14);
    const dur = Number(durationMin);

    if (!barberId || barberId === 'any') {
      const allBarbers = await prisma.barber.findMany({ where: { isActive: true } });
      const dayMap: Record<string, boolean> = {};

      for (const b of allBarbers) {
        const result = await getAvailableDays({
          barberId: b.id,
          durationMin: dur,
          fromDate,
          days: numDays,
        });
        for (const d of result) {
          dayMap[d.date] = dayMap[d.date] || d.hasSlots;
        }
      }

      return NextResponse.json({
        success: true,
        data: Object.entries(dayMap)
          .map(([date, hasSlots]) => ({ date, hasSlots }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      });
    }

    const result = await getAvailableDays({
      barberId,
      durationMin: dur,
      fromDate,
      days: numDays,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to compute available days' },
      { status: 500 }
    );
  }
}
