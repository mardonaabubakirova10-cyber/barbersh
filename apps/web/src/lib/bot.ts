import { Bot, InlineKeyboard } from 'grammy';
import { prisma } from './slots';

const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl = process.env.MINIAPP_URL || 'http://localhost:5173';
const webUrl = process.env.WEB_URL || 'http://localhost:3000';

export function getBot(): Bot | null {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t || t === 'MOCK_BOT_TOKEN') return null;
  try {
    return new Bot(t);
  } catch {
    return null;
  }
}

export const bot = getBot();


function resolveClientChatId(client: { telegramChatId?: string | null; telegramId?: string | null }) {
  return client.telegramChatId || client.telegramId || null;
}

const isHttps = miniAppUrl.startsWith('https://');
function addMiniAppButton(kb: InlineKeyboard, label: string): InlineKeyboard {
  return isHttps ? kb.webApp(label, miniAppUrl) : kb.url(label, miniAppUrl);
}

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

export async function sendBookingCreatedNotification(bookingId: string) {
  if (!bot) return;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, barber: true, services: true },
    });

    if (!booking) return;

    const servicesList = booking.services.map((s) => `• ${s.name}`).join('\n');
    const dateTimeFormatted = formatRuDateTime(new Date(booking.startsAt));

    const clientChatId = resolveClientChatId(booking.client);
    if (clientChatId) {
      const clientMsg =
        `✅ *Ваша запись подтверждена!*\n\n` +
        `📅 *Дата и время:* ${dateTimeFormatted}\n` +
        `✂️ *Мастер:* ${booking.barber.name}\n` +
        `💰 *Сумма:* ${booking.totalPrice} ₽\n` +
        `⏱ *Длительность:* ${booking.totalDurationMin} мин\n\n` +
        `📋 *Услуги:*\n${servicesList}\n\n` +
        `📍 *Адрес:* ул. Большая Никитская, 24/1`;

      const keyboard = addMiniAppButton(
        new InlineKeyboard().url('🌐 Управление записью', `${webUrl}/booking/${booking.manageToken}`).row(),
        '📱 Открыть Mini App'
      );

      await bot.api.sendMessage(clientChatId, clientMsg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }

    if (booking.barber.telegramChatId) {
      const barberMsg =
        `💈 *Новая запись к вам!*\n\n` +
        `👤 *Клиент:* ${booking.client.name} (${booking.client.phone})\n` +
        `📅 *Когда:* ${dateTimeFormatted}\n` +
        `⏱ *Длительность:* ${booking.totalDurationMin} мин\n` +
        `💰 *Стоимость:* ${booking.totalPrice} ₽\n\n` +
        `📋 *Услуги:*\n${servicesList}`;

      await bot.api.sendMessage(booking.barber.telegramChatId, barberMsg, {
        parse_mode: 'Markdown',
      });
    }
  } catch (err) {
    console.error('Failed to send booking created notification:', err);
  }
}

export async function sendBookingCancelledNotification(bookingId: string) {
  if (!bot) return;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, barber: true, services: true },
    });

    if (!booking) return;

    const dateTimeFormatted = formatRuDateTime(new Date(booking.startsAt));
    const clientChatId = resolveClientChatId(booking.client);

    if (clientChatId) {
      const msg =
        `❌ *Запись отменена*\n\n` +
        `Визит на *${dateTimeFormatted}* к мастеру ${booking.barber.name} был отменен.\n\n` +
        `Вы можете выбрать другое удобное время в любой момент:`;

      const keyboard = addMiniAppButton(new InlineKeyboard(), '✂️ Записаться снова');
      await bot.api.sendMessage(clientChatId, msg, { parse_mode: 'Markdown', reply_markup: keyboard });
    }

    if (booking.barber.telegramChatId) {
      const msg =
        `⚠️ *Отмена записи*\n\n` +
        `Клиент ${booking.client.name} отменил запись на *${dateTimeFormatted}*.\n` +
        `Слот освобожден в расписании.`;
      await bot.api.sendMessage(booking.barber.telegramChatId, msg, { parse_mode: 'Markdown' });
    }
  } catch (err) {
    console.error('Failed to send booking cancelled notification:', err);
  }
}

export async function sendBookingRescheduledNotification(bookingId: string) {
  if (!bot) return;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, barber: true, services: true },
    });

    if (!booking) return;

    const dateTimeFormatted = formatRuDateTime(new Date(booking.startsAt));
    const clientChatId = resolveClientChatId(booking.client);

    if (clientChatId) {
      const msg =
        `🔄 *Запись успешно перенесена!*\n\n` +
        `📅 *Новое время:* ${dateTimeFormatted}\n` +
        `✂️ *Мастер:* ${booking.barber.name}\n` +
        `📍 *Адрес:* ул. Большая Никитская, 24/1`;

      const keyboard = addMiniAppButton(
        new InlineKeyboard().url('🌐 Управление записью', `${webUrl}/booking/${booking.manageToken}`).row(),
        '📱 Открыть Mini App'
      );
      await bot.api.sendMessage(clientChatId, msg, { parse_mode: 'Markdown', reply_markup: keyboard });
    }

    if (booking.barber.telegramChatId) {
      const msg =
        `🔄 *Перенос записи*\n\n` +
        `Клиент ${booking.client.name} перенес визит на *${dateTimeFormatted}*.\n` +
        `Длительность: ${booking.totalDurationMin} мин.`;
      await bot.api.sendMessage(booking.barber.telegramChatId, msg, { parse_mode: 'Markdown' });
    }
  } catch (err) {
    console.error('Failed to send booking rescheduled notification:', err);
  }
}
