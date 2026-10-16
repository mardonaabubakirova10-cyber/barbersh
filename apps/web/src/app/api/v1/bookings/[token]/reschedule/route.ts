import { NextRequest, NextResponse } from 'next/server';
import { prisma, getAvailableSlots } from '@/lib/slots';
import { sendBookingRescheduledNotification } from '@/lib/bot';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    const body = await request.json();
    const { date, time, barberId } = body;

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'Date and time are required' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { manageToken: token },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Cannot reschedule a cancelled booking' },
        { status: 400 }
      );
    }

    const targetBarberId = barberId || booking.barberId;

    const slots = await getAvailableSlots({
      barberId: targetBarberId,
      dateStr: date,
      durationMin: booking.totalDurationMin,
    });

    if (!slots.includes(time)) {
      return NextResponse.json(
        {
          success: false,
          code: 'SLOT_TAKEN',
          error: 'Выбранный слот недоступен для переноса',
        },
        { status: 409 }
      );
    }

    const [h, m] = time.split(':').map(Number);
    const startsAt = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
    const endsAt = new Date(startsAt.getTime() + booking.totalDurationMin * 60 * 1000);

    const updated = await prisma.booking.update({
      where: { manageToken: token },
      data: {
        barberId: targetBarberId,
        startsAt,
        endsAt,
        status: 'CONFIRMED',
      },
      include: {
        client: true,
        barber: true,
        services: true,
      },
    });

    sendBookingRescheduledNotification(updated.id).catch((e) => console.error(e));

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Запись успешно перенесена',
    });
  } catch (err: any) {
    if (err.code === '23P01' || err.message?.includes('bookings_no_overlap')) {
      return NextResponse.json(
        {
          success: false,
          code: 'SLOT_TAKEN',
          error: 'Выбранный слот уже занят другим клиентом',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
