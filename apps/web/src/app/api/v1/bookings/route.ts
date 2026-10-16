import { NextRequest, NextResponse } from 'next/server';
import { prisma, getAvailableSlots } from '@/lib/slots';
import { sendBookingCreatedNotification } from '@/lib/bot';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barberId, date, time, clientName, clientPhone, comment, source = 'WEB', telegramId } = body;
    const serviceIds: string[] = body.serviceIds || (body.serviceId ? [body.serviceId] : []);

    if (!date || !time || !clientName || !clientPhone || serviceIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: date, time, clientName, clientPhone, and serviceId(s)',
        },
        { status: 400 }
      );
    }

    // 1. Fetch services
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });

    if (services.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Services not found' },
        { status: 404 }
      );
    }

    const totalDurationMin = services.reduce((sum, s) => sum + s.durationMin, 0);
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // 2. Resolve barber
    let resolvedBarberId = barberId;
    if (!resolvedBarberId || resolvedBarberId === 'any') {
      const allBarbers = await prisma.barber.findMany({ where: { isActive: true } });
      let foundBarberId: string | null = null;

      for (const b of allBarbers) {
        const slots = await getAvailableSlots({
          barberId: b.id,
          dateStr: date,
          durationMin: totalDurationMin,
        });
        if (slots.includes(time)) {
          foundBarberId = b.id;
          break;
        }
      }

      if (!foundBarberId) {
        return NextResponse.json(
          {
            success: false,
            code: 'SLOT_TAKEN',
            error: 'No barber available for this time slot',
          },
          { status: 409 }
        );
      }
      resolvedBarberId = foundBarberId;
    }

    // 3. Verify slot availability
    const slots = await getAvailableSlots({
      barberId: resolvedBarberId,
      dateStr: date,
      durationMin: totalDurationMin,
    });

    if (!slots.includes(time)) {
      return NextResponse.json(
        {
          success: false,
          code: 'SLOT_TAKEN',
          error: 'The requested time slot is no longer available',
        },
        { status: 409 }
      );
    }

    // 4. Calculate startsAt & endsAt (in UTC)
    const [h, m] = time.split(':').map(Number);
    const startsAt = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
    const endsAt = new Date(startsAt.getTime() + totalDurationMin * 60 * 1000);

    // 5. Upsert client
    const tgId = telegramId ? String(telegramId) : undefined;
    const client = await prisma.client.upsert({
      where: { phone: clientPhone.trim() },
      update: {
        name: clientName.trim(),
        ...(tgId ? { telegramId: tgId, telegramChatId: tgId } : {}),
      },
      create: {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        ...(tgId ? { telegramId: tgId, telegramChatId: tgId } : {}),
      },
    });

    // 6. Create booking & booking services in transaction
    const booking = await prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data: {
          clientId: client.id,
          barberId: resolvedBarberId,
          startsAt,
          endsAt,
          totalPrice,
          totalDurationMin,
          status: 'CONFIRMED',
          source,
          services: {
            create: services.map((s) => ({
              serviceId: s.id,
              name: s.name,
              durationMin: s.durationMin,
              price: s.price,
            })),
          },
        },
        include: {
          barber: true,
          client: true,
          services: true,
        },
      });
    });

    // Background notification
    sendBookingCreatedNotification(booking.id).catch((e) => console.error(e));

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (err: any) {
    if (err.code === '23P01' || err.message?.includes('bookings_no_overlap')) {
      return NextResponse.json(
        {
          success: false,
          code: 'SLOT_TAKEN',
          error: 'Выбранный слот уже занят другим клиентом. Пожалуйста, выберите другое время.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking: ' + (err.message || 'Internal server error'),
      },
      { status: 500 }
    );
  }
}
