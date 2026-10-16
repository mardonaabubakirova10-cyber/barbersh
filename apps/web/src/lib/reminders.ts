import { prisma } from '@/lib/slots';
import { bot } from '@/lib/bot';
import { InlineKeyboard } from 'grammy';

const miniAppUrl = process.env.MINIAPP_URL || 'http://localhost:5173';
const webUrl = process.env.WEB_URL || 'http://localhost:3000';

function formatRuDateTime(date: Date) {
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const dateStr = date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  return `${dateStr} в ${timeStr}`;
}

export interface ReminderRunResult {
  remindersDayCount: number;
  reminders30mCount: number;
  autoCompletedCount: number;
  reviewsRequestedCount: number;
  errors: string[];
}

export async function runRemindersCycle(): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    remindersDayCount: 0,
    reminders30mCount: 0,
    autoCompletedCount: 0,
    reviewsRequestedCount: 0,
    errors: [],
  };

  const now = new Date();

  // 1. Day-before reminders
  try {
    const dayStartWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const dayEndWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const dayBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminderDaySentAt: null,
        startsAt: { gte: dayStartWindow, lte: dayEndWindow },
      },
      include: { client: true, barber: true, services: true },
    });

    for (const b of dayBookings) {
      try {
        const clientChatId = b.client.telegramChatId || b.client.telegramId;
        if (bot && clientChatId) {
          const text =
            `⏰ *Напоминание о записи на завтра!*\n\n` +
            `Ждем вас *${formatRuDateTime(new Date(b.startsAt))}*\n` +
            `✂️ *Мастер:* ${b.barber.name}\n` +
            `💰 *Сумма:* ${b.totalPrice} ₽\n` +
            `📍 *Адрес:* ул. Большая Никитская, 24/1\n\n` +
            `Если ваши планы изменились, пожалуйста, предупредите нас заранее:`;

          const keyboard = new InlineKeyboard()
            .url('🌐 Изменить запись', `${webUrl}/booking/${b.manageToken}`)
            .webApp('📱 Открыть Mini App', miniAppUrl);

          await bot.api.sendMessage(clientChatId, text, {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
        }

        await prisma.booking.update({ where: { id: b.id }, data: { reminderDaySentAt: now } });
        result.remindersDayCount++;
      } catch (err: any) {
        result.errors.push(`Day reminder error for ${b.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Day reminders fetch error: ${err.message}`);
  }

  // 2. 30-minutes reminders
  try {
    const min30Start = new Date(now.getTime() + 20 * 60 * 1000);
    const min30End = new Date(now.getTime() + 40 * 60 * 1000);

    const m30Bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminder30mSentAt: null,
        startsAt: { gte: min30Start, lte: min30End },
      },
      include: { client: true, barber: true, services: true },
    });

    for (const b of m30Bookings) {
      try {
        const clientChatId = b.client.telegramChatId || b.client.telegramId;
        if (bot && clientChatId) {
          const timeStr = new Date(b.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
          const text =
            `⚡️ *Ваша запись через 30 минут!*\n\n` +
            `В *${timeStr}* вас ждет мастер *${b.barber.name}*.\n` +
            `📍 Адрес: ул. Большая Никитская, 24/1\n` +
            `☕️ Горячий зерновой кофе и напитки уже ждут вас!`;

          await bot.api.sendMessage(clientChatId, text, { parse_mode: 'Markdown' });
        }

        await prisma.booking.update({ where: { id: b.id }, data: { reminder30mSentAt: now } });
        result.reminders30mCount++;
      } catch (err: any) {
        result.errors.push(`30m reminder error for ${b.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`30m reminders fetch error: ${err.message}`);
  }

  // 3. Auto-complete passed bookings
  try {
    const passedBookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED', endsAt: { lt: now }, autoCompletedAt: null },
    });

    for (const b of passedBookings) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { status: 'COMPLETED', autoCompletedAt: now },
      });
      result.autoCompletedCount++;
    }
  } catch (err: any) {
    result.errors.push(`Auto complete error: ${err.message}`);
  }

  // 4. Review requests
  try {
    const reviewThreshold = new Date(now.getTime() - 60 * 60 * 1000);
    const reviewBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        endsAt: { lte: reviewThreshold },
        reviewRequestedAt: null,
        review: null,
      },
      include: { client: true, barber: true },
    });

    for (const b of reviewBookings) {
      try {
        const clientChatId = b.client.telegramChatId || b.client.telegramId;
        if (bot && clientChatId) {
          const text =
            `⭐️ *Как прошел ваш визит в BLADE & CO.?*\n\n` +
            `Мастер ${b.barber.name} был рад вас видеть! Оцените качество стрижки и сервиса.`;

          const keyboard = new InlineKeyboard()
            .url('⭐️ Оставить отзыв', `${webUrl}/booking/${b.manageToken}#review`)
            .webApp('📱 Открыть в приложении', miniAppUrl);

          await bot.api.sendMessage(clientChatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
        }

        await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestedAt: now } });
        result.reviewsRequestedCount++;
      } catch (err: any) {
        result.errors.push(`Review request error for ${b.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Review request fetch error: ${err.message}`);
  }

  return result;
}
