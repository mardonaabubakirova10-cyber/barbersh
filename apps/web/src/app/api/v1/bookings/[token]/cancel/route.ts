import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';
import { sendBookingCancelledNotification } from '@/lib/bot';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
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
        { success: false, error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { manageToken: token },
      data: { status: 'CANCELLED' },
      include: {
        client: true,
        barber: true,
        services: true,
      },
    });

    sendBookingCancelledNotification(updated.id).catch((e) => console.error(e));

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Запись успешно отменена',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
