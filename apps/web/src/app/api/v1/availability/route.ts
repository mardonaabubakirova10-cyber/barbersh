import { NextRequest, NextResponse } from 'next/server';
import { prisma, getAvailableSlots } from '@/lib/slots';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const barberId = searchParams.get('barberId') || undefined;
  const date = searchParams.get('date');
  const durationMin = searchParams.get('durationMin');

  if (!date || !durationMin) {
    return NextResponse.json(
      { success: false, error: 'date and durationMin are required' },
      { status: 400 }
    );
  }

  try {
    if (!barberId || barberId === 'any') {
      const allBarbers = await prisma.barber.findMany({ where: { isActive: true } });
      const slotMap: Record<string, string[]> = {};
      const allSlots = new Set<string>();

      for (const b of allBarbers) {
        const slots = await getAvailableSlots({
          barberId: b.id,
          dateStr: date,
          durationMin: Number(durationMin),
        });
        slotMap[b.id] = slots;
        slots.forEach((s) => allSlots.add(s));
      }

      return NextResponse.json({
        success: true,
        data: {
          barberId: 'any',
          date,
          slots: Array.from(allSlots).sort(),
          slotMap,
        },
      });
    }

    const slots = await getAvailableSlots({
      barberId,
      dateStr: date,
      durationMin: Number(durationMin),
    });

    return NextResponse.json({
      success: true,
      data: { barberId, date, slots },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to compute availability' },
      { status: 500 }
    );
  }
}
