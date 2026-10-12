import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables FIRST before other imports
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { prisma } from '@barbershop/db';
import { getAvailableSlots, getAvailableDays } from './slots';
import { validateTelegramInitData } from './telegram';
import {
  bot,
  sendBookingCreatedNotification,
  sendBookingCancelledNotification,
  sendBookingRescheduledNotification,
} from './bot';
import { runRemindersCycle } from './reminders';
import {
  ensureDefaultAdmin,
  verifyPassword,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  getAdminBookings,
  getAnalyticsSummary,
} from './admin';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function main() {
  // 1. CORS
  await fastify.register(cors, {
    origin: true, // allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // 2. Health check (root + /health — браузер на localhost:4000 не должен видеть 404)
  const healthPayload = () => ({
    status: 'ok',
    service: 'barbershop-api',
    telegramBot: bot ? 'configured' : 'missing_token',
    timestamp: new Date().toISOString(),
  });

  fastify.get('/', async () => healthPayload());
  fastify.get('/health', async () => healthPayload());

  // 3. GET /api/v1/services
  fastify.get('/api/v1/services', async (request, reply) => {
    try {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return { success: true, data: services };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch services' });
    }
  });

  // 4. GET /api/v1/barbers
  fastify.get('/api/v1/barbers', async (request, reply) => {
    try {
      const barbers = await prisma.barber.findMany({
        where: { isActive: true },
        include: {
          services: {
            where: { isEnabled: true },
            include: { service: true },
          },
          workingHours: true,
          reviews: {
            where: { isPublic: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      // Format response with calculated rating
      const formatted = barbers.map((b) => {
        const rating =
          b.reviews.length > 0
            ? Number((b.reviews.reduce((acc, r) => acc + r.rating, 0) / b.reviews.length).toFixed(2))
            : 5.0;

        return {
          id: b.id,
          name: b.name,
          role: b.role,
          bio: b.bio,
          photoUrl: b.photoUrl,
          experienceYears: b.experienceYears,
          rating,
          reviewsCount: b.reviews.length,
          services: b.services.map((bs) => ({
            id: bs.service.id,
            name: bs.service.name,
            durationMin: bs.durationMin ?? bs.service.durationMin,
            price: bs.price ?? bs.service.price,
          })),
        };
      });

      return { success: true, data: formatted };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch barbers' });
    }
  });

  // 5. GET /api/v1/barbers/:id
  fastify.get('/api/v1/barbers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const barber = await prisma.barber.findUnique({
        where: { id },
        include: {
          services: {
            where: { isEnabled: true },
            include: { service: true },
          },
          workingHours: true,
          breaks: true,
          reviews: {
            where: { isPublic: true },
            include: { client: true },
          },
        },
      });

      if (!barber) {
        return reply.status(404).send({ success: false, error: 'Barber not found' });
      }

      const rating =
        barber.reviews.length > 0
          ? Number((barber.reviews.reduce((acc, r) => acc + r.rating, 0) / barber.reviews.length).toFixed(2))
          : 5.0;

      return {
        success: true,
        data: {
          ...barber,
          rating,
          reviewsCount: barber.reviews.length,
        },
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch barber' });
    }
  });

  // 6. GET /api/v1/availability?barberId=&date=&durationMin=
  fastify.get('/api/v1/availability', async (request, reply) => {
    const { barberId, date, durationMin } = request.query as {
      barberId?: string;
      date?: string;
      durationMin?: string;
    };

    if (!date || !durationMin) {
      return reply.status(400).send({ success: false, error: 'date and durationMin are required' });
    }

    try {
      // If barberId=any — find first barber with free slots and return the union
      if (!barberId || barberId === 'any') {
        const allBarbers = await prisma.barber.findMany({ where: { isActive: true } });
        const slotMap: Record<string, string[]> = {};
        const allSlots = new Set<string>();

        for (const b of allBarbers) {
          const slots = await getAvailableSlots({ barberId: b.id, dateStr: date, durationMin: Number(durationMin) });
          slotMap[b.id] = slots;
          slots.forEach(s => allSlots.add(s));
        }

        return {
          success: true,
          data: {
            barberId: 'any',
            date,
            slots: Array.from(allSlots).sort(),
            slotMap, // which barber is free at which time
          },
        };
      }

      const slots = await getAvailableSlots({
        barberId,
        dateStr: date,
        durationMin: Number(durationMin),
      });

      return { success: true, data: { barberId, date, slots } };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to compute availability' });
    }
  });

  // 7. GET /api/v1/availability/days?barberId=&fromDate=&durationMin=&days=
  fastify.get('/api/v1/availability/days', async (request, reply) => {
    const { barberId, fromDate, durationMin, days } = request.query as {
      barberId?: string;
      fromDate?: string;
      durationMin?: string;
      days?: string;
    };

    if (!fromDate || !durationMin) {
      return reply.status(400).send({ success: false, error: 'fromDate and durationMin are required' });
    }

    try {
      const numDays = Number(days ?? 14);
      const dur = Number(durationMin);

      if (!barberId || barberId === 'any') {
        // Union of all barbers' available days
        const allBarbers = await prisma.barber.findMany({ where: { isActive: true } });
        const dayMap: Record<string, boolean> = {};

        for (const b of allBarbers) {
          const result = await getAvailableDays({ barberId: b.id, durationMin: dur, fromDate, days: numDays });
          for (const d of result) {
            dayMap[d.date] = dayMap[d.date] || d.hasSlots;
          }
        }

        return {
          success: true,
          data: Object.entries(dayMap).map(([date, hasSlots]) => ({ date, hasSlots })).sort((a, b) => a.date.localeCompare(b.date)),
        };
      }

      const result = await getAvailableDays({ barberId, durationMin: dur, fromDate, days: numDays });
      return { success: true, data: result };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to compute available days' });
    }
  });

  // 8. POST /api/v1/bookings
  fastify.post('/api/v1/bookings', async (request, reply) => {
    const body = request.body as {
      serviceId: string;
      serviceIds?: string[];
      barberId: string;
      date: string; // "YYYY-MM-DD"
      time: string; // "HH:MM"
      clientName: string;
      clientPhone: string;
      comment?: string;
      source?: 'WEB' | 'TELEGRAM' | 'ADMIN';
      telegramId?: string;
    };

    const { barberId, date, time, clientName, clientPhone, comment, source = 'WEB', telegramId } = body;
    const serviceIds = body.serviceIds || (body.serviceId ? [body.serviceId] : []);

    if (!date || !time || !clientName || !clientPhone || serviceIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: date, time, clientName, clientPhone, and serviceId(s)',
      });
    }

    try {
      // 1. Fetch services
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds }, isActive: true },
      });

      if (services.length === 0) {
        return reply.status(404).send({ success: false, error: 'Services not found' });
      }

      const totalDurationMin = services.reduce((sum, s) => sum + s.durationMin, 0);
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

      // 2. Resolve barber (if 'any' or empty, pick the first available barber for this slot)
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
          return reply.status(409).send({
            success: false,
            code: 'SLOT_TAKEN',
            error: 'No barber available for this time slot',
          });
        }
        resolvedBarberId = foundBarberId;
      }

      // 3. Verify slot availability for chosen barber
      const slots = await getAvailableSlots({
        barberId: resolvedBarberId,
        dateStr: date,
        durationMin: totalDurationMin,
      });

      if (!slots.includes(time)) {
        return reply.status(409).send({
          success: false,
          code: 'SLOT_TAKEN',
          error: 'The requested time slot is no longer available',
        });
      }

      // 4. Calculate startsAt & endsAt (in UTC)
      const [h, m] = time.split(':').map(Number);
      const startsAt = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
      const endsAt = new Date(startsAt.getTime() + totalDurationMin * 60 * 1000);

      // 5. Upsert client (private chat id == telegram user id)
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
        const bk = await tx.booking.create({
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
        return bk;
      });

      // Send telegram notification in background
      sendBookingCreatedNotification(booking.id).catch((e) => fastify.log.error(e));

      return reply.status(201).send({
        success: true,
        data: booking,
      });
    } catch (err: any) {
      // Postgres exclusion constraint violation error code is 23P01
      if (err.code === '23P01' || err.message?.includes('bookings_no_overlap')) {
        return reply.status(409).send({
          success: false,
          code: 'SLOT_TAKEN',
          error: 'Выбранный слот уже занят другим клиентом. Пожалуйста, выберите другое время.',
        });
      }

      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create booking: ' + (err.message || 'Internal server error'),
      });
    }
  });

  // 9. GET /api/v1/bookings/:token (View booking by manageToken)
  fastify.get('/api/v1/bookings/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    try {
      const booking = await prisma.booking.findUnique({
        where: { manageToken: token },
        include: {
          client: true,
          barber: true,
          services: true,
          review: true,
        },
      });

      if (!booking) {
        return reply.status(404).send({ success: false, error: 'Booking not found' });
      }

      return { success: true, data: booking };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to retrieve booking' });
    }
  });

  // 10. POST /api/v1/bookings/:token/cancel (Cancel booking)
  fastify.post('/api/v1/bookings/:token/cancel', async (request, reply) => {
    const { token } = request.params as { token: string };

    try {
      const booking = await prisma.booking.findUnique({
        where: { manageToken: token },
      });

      if (!booking) {
        return reply.status(404).send({ success: false, error: 'Booking not found' });
      }

      if (booking.status === 'CANCELLED') {
        return reply.status(400).send({ success: false, error: 'Booking is already cancelled' });
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

      // Send telegram cancellation notification
      sendBookingCancelledNotification(updated.id).catch((e) => fastify.log.error(e));

      return { success: true, data: updated, message: 'Запись успешно отменена' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to cancel booking' });
    }
  });

  // 11. POST /api/v1/bookings/:token/reschedule (Reschedule booking)
  fastify.post('/api/v1/bookings/:token/reschedule', async (request, reply) => {
    const { token } = request.params as { token: string };
    const { date, time, barberId } = request.body as {
      date: string; // "YYYY-MM-DD"
      time: string; // "HH:MM"
      barberId?: string;
    };

    if (!date || !time) {
      return reply.status(400).send({ success: false, error: 'Date and time are required' });
    }

    try {
      const booking = await prisma.booking.findUnique({
        where: { manageToken: token },
      });

      if (!booking) {
        return reply.status(404).send({ success: false, error: 'Booking not found' });
      }

      if (booking.status === 'CANCELLED') {
        return reply.status(400).send({ success: false, error: 'Cannot reschedule a cancelled booking' });
      }

      const targetBarberId = barberId || booking.barberId;

      // Check slot availability
      const slots = await getAvailableSlots({
        barberId: targetBarberId,
        dateStr: date,
        durationMin: booking.totalDurationMin,
      });

      if (!slots.includes(time)) {
        return reply.status(409).send({
          success: false,
          code: 'SLOT_TAKEN',
          error: 'Выбранный слот недоступен для переноса',
        });
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

      // Send telegram reschedule notification
      sendBookingRescheduledNotification(updated.id).catch((e) => fastify.log.error(e));

      return { success: true, data: updated, message: 'Запись успешно перенесена' };
    } catch (err: any) {
      if (err.code === '23P01' || err.message?.includes('bookings_no_overlap')) {
        return reply.status(409).send({
          success: false,
          code: 'SLOT_TAKEN',
          error: 'Выбранный слот уже занят другим клиентом',
        });
      }

      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to reschedule booking' });
    }
  });

  // 12. POST /api/v1/telegram/validate-init-data
  fastify.post('/api/v1/telegram/validate-init-data', async (request, reply) => {
    const { initData } = request.body as { initData: string };
    if (!initData) {
      return reply.status(400).send({ success: false, error: 'initData is required' });
    }

    const validation = validateTelegramInitData(initData);
    if (!validation.valid) {
      return reply.status(401).send({ success: false, error: 'Invalid Telegram initData signature' });
    }

    return {
      success: true,
      data: {
        user: validation.user,
        authDate: validation.authDate,
        isDev: validation.isDev,
      },
    };
  });

  // 13. GET /api/v1/telegram/bookings (Get bookings for telegram user or phone)
  fastify.get('/api/v1/telegram/bookings', async (request, reply) => {
    const { telegramId, phone } = request.query as {
      telegramId?: string;
      phone?: string;
    };

    if (!telegramId && !phone) {
      return reply.status(400).send({
        success: false,
        error: 'telegramId or phone query parameter is required',
      });
    }

    try {
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            telegramId ? { telegramId: String(telegramId) } : undefined,
            phone ? { phone: phone.trim() } : undefined,
          ].filter(Boolean) as any[],
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
        return { success: true, data: [] };
      }

      return { success: true, data: client.bookings, client };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch telegram bookings' });
    }
  });

  // 14. POST /telegram/webhook
  fastify.post('/telegram/webhook', async (request, reply) => {
    if (!bot) {
      return reply.status(400).send({ success: false, error: 'Telegram Bot is not configured' });
    }
    try {
      await bot.handleUpdate(request.body as any);
      return reply.status(200).send({ ok: true });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // 15. POST /api/v1/cron/notifications (Supabase Cron / External trigger)
  fastify.post('/api/v1/cron/notifications', async (request, reply) => {
    try {
      const result = await runRemindersCycle();
      return { success: true, data: result };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // --- ADMIN ROUTES ---

  // 16. POST /api/v1/admin/login (with rate limiting)
  fastify.post('/api/v1/admin/login', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      return reply.status(400).send({ success: false, error: 'Логин и пароль обязательны' });
    }

    const rateKey = `${request.ip}_${username}`;
    const rateCheck = checkLoginRateLimit(rateKey);

    if (!rateCheck.allowed) {
      return reply.status(429).send({
        success: false,
        error: `Слишком много неудачных попыток входа. Блокировка на ${rateCheck.remainingSec} сек.`,
      });
    }

    try {
      const admin = await prisma.adminUser.findUnique({ where: { username } });
      if (!admin || !verifyPassword(password, admin.passwordHash)) {
        recordFailedLogin(rateKey);
        return reply.status(401).send({ success: false, error: 'Неверный логин или пароль' });
      }

      clearLoginAttempts(rateKey);

      return {
        success: true,
        data: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          token: `adm_${admin.id}_${Date.now()}`,
        },
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Ошибка авторизации' });
    }
  });

  // 17. GET /api/v1/admin/bookings
  fastify.get('/api/v1/admin/bookings', async (request, reply) => {
    const query = request.query as any;
    try {
      const bookings = await getAdminBookings(query);
      return { success: true, data: bookings };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch bookings' });
    }
  });

  // 18. POST /api/v1/admin/bookings (Manual booking creation)
  fastify.post('/api/v1/admin/bookings', async (request, reply) => {
    const body = request.body as any;
    const { barberId, date, time, clientName, clientPhone, comment, serviceIds = [] } = body;

    if (!date || !time || !clientName || !clientPhone || serviceIds.length === 0 || !barberId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields for admin booking',
      });
    }

    try {
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

      return reply.status(201).send({ success: true, data: booking });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message || 'Failed to create booking' });
    }
  });

  // 19. PATCH /api/v1/admin/bookings/:id/status
  fastify.patch('/api/v1/admin/bookings/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' };

    try {
      const updated = await prisma.booking.update({
        where: { id },
        data: { status },
        include: { client: true, barber: true, services: true },
      });
      return { success: true, data: updated };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to update booking status' });
    }
  });

  // 20. DELETE /api/v1/admin/bookings/:id
  fastify.delete('/api/v1/admin/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.booking.delete({ where: { id } });
      return { success: true, message: 'Booking deleted' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to delete booking' });
    }
  });

  // 21. CRUD Services
  fastify.post('/api/v1/admin/services', async (request, reply) => {
    const body = request.body as any;
    try {
      const created = await prisma.service.create({
        data: {
          name: body.name,
          category: body.category || 'Стрижки',
          description: body.description || null,
          price: Number(body.price),
          durationMin: Number(body.durationMin),
          sortOrder: Number(body.sortOrder || 0),
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        },
      });
      return reply.status(201).send({ success: true, data: created });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to create service' });
    }
  });

  fastify.put('/api/v1/admin/services/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    try {
      const updated = await prisma.service.update({
        where: { id },
        data: {
          name: body.name,
          category: body.category,
          description: body.description,
          price: body.price !== undefined ? Number(body.price) : undefined,
          durationMin: body.durationMin !== undefined ? Number(body.durationMin) : undefined,
          sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        },
      });
      return { success: true, data: updated };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to update service' });
    }
  });

  fastify.delete('/api/v1/admin/services/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.service.update({ where: { id }, data: { isActive: false } });
      return { success: true, message: 'Service deactivated' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to delete service' });
    }
  });

  // 22. CRUD Barbers
  fastify.post('/api/v1/admin/barbers', async (request, reply) => {
    const body = request.body as any;
    try {
      const barber = await prisma.barber.create({
        data: {
          name: body.name,
          role: body.role || 'Барбер',
          bio: body.bio || null,
          photoUrl: body.photoUrl || null,
          experienceYears: Number(body.experienceYears || 1),
          sortOrder: Number(body.sortOrder || 0),
          isActive: true,
        },
      });

      // Link all active services by default
      const allServices = await prisma.service.findMany({ where: { isActive: true } });
      for (const s of allServices) {
        await prisma.barberService.create({
          data: { barberId: barber.id, serviceId: s.id, isEnabled: true },
        });
      }

      // Default schedule Mon-Sun 10:00 - 21:00
      for (let weekday = 0; weekday <= 6; weekday++) {
        await prisma.workingHours.create({
          data: { barberId: barber.id, weekday, startTime: '10:00', endTime: '21:00' },
        });
        await prisma.break.create({
          data: { barberId: barber.id, weekday, startTime: '14:00', endTime: '15:00' },
        });
      }

      return reply.status(201).send({ success: true, data: barber });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to create barber' });
    }
  });

  fastify.put('/api/v1/admin/barbers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    try {
      const updated = await prisma.barber.update({
        where: { id },
        data: {
          name: body.name,
          role: body.role,
          bio: body.bio,
          photoUrl: body.photoUrl,
          experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : undefined,
          sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        },
      });
      return { success: true, data: updated };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to update barber' });
    }
  });

  fastify.delete('/api/v1/admin/barbers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.barber.update({ where: { id }, data: { isActive: false } });
      return { success: true, message: 'Barber deactivated' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to delete barber' });
    }
  });

  // 23. Schedule & Time-Off
  fastify.put('/api/v1/admin/barbers/:id/schedule', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { workingHours = [], breaks = [] } = request.body as {
      workingHours: Array<{ weekday: number; startTime: string; endTime: string }>;
      breaks: Array<{ weekday: number; startTime: string; endTime: string }>;
    };

    try {
      await prisma.workingHours.deleteMany({ where: { barberId: id } });
      await prisma.break.deleteMany({ where: { barberId: id } });

      for (const wh of workingHours) {
        await prisma.workingHours.create({
          data: { barberId: id, weekday: wh.weekday, startTime: wh.startTime, endTime: wh.endTime },
        });
      }

      for (const br of breaks) {
        await prisma.break.create({
          data: { barberId: id, weekday: br.weekday, startTime: br.startTime, endTime: br.endTime },
        });
      }

      return { success: true, message: 'Schedule updated' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to update schedule' });
    }
  });

  fastify.post('/api/v1/admin/barbers/:id/time-off', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { startsAt, endsAt, type = 'DAY_OFF', note } = request.body as any;

    try {
      const created = await prisma.timeOff.create({
        data: {
          barberId: id,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          type,
          note,
        },
      });
      return reply.status(201).send({ success: true, data: created });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to create time off' });
    }
  });

  fastify.delete('/api/v1/admin/time-off/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.timeOff.delete({ where: { id } });
      return { success: true, message: 'Time off deleted' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to delete time off' });
    }
  });

  // 23b. Portfolio Items
  fastify.get('/api/v1/barbers/:id/portfolio', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const items = await prisma.portfolioItem.findMany({
        where: { barberId: id },
        orderBy: { sortOrder: 'asc' },
      });
      return { success: true, data: items };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch portfolio' });
    }
  });

  fastify.post('/api/v1/admin/barbers/:id/portfolio', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { imageUrl, sortOrder = 0 } = request.body as { imageUrl: string; sortOrder?: number };

    if (!imageUrl) {
      return reply.status(400).send({ success: false, error: 'imageUrl is required' });
    }

    try {
      const item = await prisma.portfolioItem.create({
        data: {
          barberId: id,
          imageUrl,
          sortOrder: Number(sortOrder),
        },
      });
      return reply.status(201).send({ success: true, data: item });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to add portfolio item' });
    }
  });

  fastify.delete('/api/v1/admin/portfolio/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.portfolioItem.delete({ where: { id } });
      return { success: true, message: 'Portfolio item deleted' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to delete portfolio item' });
    }
  });

  // 24. Reviews Moderation
  fastify.get('/api/v1/admin/reviews', async (request, reply) => {
    try {
      const reviews = await prisma.review.findMany({
        include: { barber: true, client: true, booking: true },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, data: reviews };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch reviews' });
    }
  });

  fastify.patch('/api/v1/admin/reviews/:id/visibility', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { isPublic } = request.body as { isPublic: boolean };
    try {
      const updated = await prisma.review.update({
        where: { id },
        data: { isPublic: Boolean(isPublic) },
      });
      return { success: true, data: updated };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to update review visibility' });
    }
  });

  // 25. Settings
  fastify.get('/api/v1/admin/settings', async (request, reply) => {
    try {
      const settings = await prisma.setting.findMany();
      const map: Record<string, string> = {};
      settings.forEach((s) => (map[s.key] = s.value));
      return { success: true, data: map };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to fetch settings' });
    }
  });

  fastify.put('/api/v1/admin/settings', async (request, reply) => {
    const body = request.body as Record<string, string>;
    try {
      for (const [key, value] of Object.entries(body)) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
      return { success: true, message: 'Settings saved' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to save settings' });
    }
  });

  // 26. Analytics
  fastify.get('/api/v1/admin/analytics', async (request, reply) => {
    const { days = '30' } = request.query as { days?: string };
    try {
      const summary = await getAnalyticsSummary(Number(days));
      return { success: true, data: summary };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to compute analytics' });
    }
  });

  // Global Error Handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  });

  const PORT = Number(process.env.PORT) || 4000;
  const HOST = process.env.HOST || '0.0.0.0';

  try {
    await ensureDefaultAdmin();
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Fastify Backend API running on http://localhost:${PORT}`);

    if (bot) {
      // Start bot polling in background for local development
      bot.start({
        onStart(botInfo) {
          console.log(`🤖 Telegram Bot started as @${botInfo.username}`);
        },
      }).catch((err) => {
        fastify.log.error(err, 'Telegram Bot polling error');
      });
    }

    // Run reminders cycle every 5 minutes in background
    setInterval(async () => {
      try {
        await runRemindersCycle();
      } catch (err) {
        fastify.log.error(err, 'Error in periodic reminders cycle');
      }
    }, 5 * 60 * 1000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
