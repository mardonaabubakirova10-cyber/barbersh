export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';
import { getAdminBookings } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const bookings = await getAdminBookings(searchParams);
    return NextResponse.json({ success: true, data: bookings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barberId, date, time, clientName, clientPhone, comment, serviceIds = [] } = body;

    if (!date || !time || !clientName || !clientPhone || serviceIds.length === 0 || !barberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields for admin booking',
        },
        { status: 400 }
      );
    }

    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
    const totalDurationMin = services.reduce((sum, s) => sum + s.durationMin, 0);
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    const [h, m] = time.split(':').map(Number);
    const startsAt = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
    const endsAt = new Date(startsAt.getTime() + totalDurationMin * 60 * 1000);

    const client = await prisma.client.upsert({
      where: { phone: clientPhone.trim() },
      update: { name: clientName.trim() },
      create: { name: clientName.trim(), phone: clientPhone.trim() },
    });

    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        barberId,
        startsAt,
        endsAt,
        totalPrice,
        totalDurationMin,
        status: 'CONFIRMED',
        source: 'ADMIN',
        services: {
          create: services.map((s) => ({
            serviceId: s.id,
            name: s.name,
            durationMin: s.durationMin,
            price: s.price,
          })),
        },
      },
      include: { barber: true, client: true, services: true },
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
