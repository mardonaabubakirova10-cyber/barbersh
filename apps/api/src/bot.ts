import dotenv from 'dotenv';
import path from 'path';
import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { prisma } from '@barbershop/db';

// tsx hoists imports, so env must load here — otherwise bot starts without token
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl = process.env.MINIAPP_URL || 'http://localhost:5173';
const webUrl = process.env.WEB_URL || 'http://localhost:3000';

export const bot = token && token !== 'MOCK_BOT_TOKEN' ? new Bot(token) : null;

if (!bot) {
  console.warn('🤖 Telegram Bot is not configured: TELEGRAM_BOT_TOKEN is missing');
}

function resolveClientChatId(client: { telegramChatId?: string | null; telegramId?: string | null }) {
  return client.telegramChatId || client.telegramId || null;
}

// WebApp кнопки требуют HTTPS. В dev используем URL-кнопку вместо webApp
const isHttps = miniAppUrl.startsWith('https://');
function addMiniAppButton(kb: InlineKeyboard, label: string): InlineKeyboard {
  return isHttps ? kb.webApp(label, miniAppUrl) : kb.url(label, miniAppUrl);
}

// Helpers to format dates in Russian
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

if (bot) {
  // 1. Command: /start [param]
  bot.command('start', async (ctx) => {
    const payload = ctx.match; // parameter after /start
    const from = ctx.from;
    const chatId = String(ctx.chat.id);
    const tgUserId = from ? String(from.id) : undefined;

    // Handle deep link: /start b_<token> (link client to booking manageToken)
    if (payload && payload.startsWith('b_')) {
      const manageToken = payload.replace('b_', '');
      try {
        const booking = await prisma.booking.findUnique({
          where: { manageToken },
          include: { client: true, barber: true, services: true },
        });

        if (booking) {
          // Link client's telegram info
          await prisma.client.update({
            where: { id: booking.clientId },
            data: {
              telegramChatId: chatId,
              ...(tgUserId ? { telegramId: tgUserId } : {}),
            },
          });

          const servicesList = booking.services.map((s) => `• ${s.name}`).join('\n');
          const text = `💈 *BLADE & CO. | Ваша запись*\n\n` +
            `📅 *Дата и время:* ${formatRuDateTime(new Date(booking.startsAt))}\n` +
            `✂️ *Мастер:* ${booking.barber.name} (${booking.barber.role})\n` +
            `⏱ *Длительность:* ${booking.totalDurationMin} мин\n` +
            `💰 *Стоимость:* ${booking.totalPrice} ₽\n\n` +
            `📋 *Услуги:*\n${servicesList}\n\n` +
            `📍 *Адрес:* ул. Большая Никитская, 24/1\n` +
            `_Ваш Telegram успешно привязан к этой записи!_`;

          const keyboard = addMiniAppButton(new InlineKeyboard(), '📱 Открыть в приложении')
            .row()
            .url('🌐 Управление записью', `${webUrl}/booking/${booking.manageToken}`);

          return await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
        }
      } catch (err) {
        console.error('Error handling deep link b_:', err);
      }
    }

    // Handle deep link: /start barber_link_<barberId> (link barber notifications)
    if (payload && payload.startsWith('barber_link_')) {
      const barberId = payload.replace('barber_link_', '');
      try {
        const barber = await prisma.barber.findUnique({ where: { id: barberId } });
        if (barber) {
          await prisma.barber.update({
            where: { id: barberId },
            data: { telegramChatId: chatId },
          });
          return await ctx.reply(
            `✅ *Привет, ${barber.name}!*\n\nВаш Telegram успешно привязан. Теперь вы будете получать уведомления о новых записях и переносах сюда.`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (err) {
        console.error('Error linking barber:', err);
      }
    }

    // Try linking or finding existing client by telegramId
    if (tgUserId) {
      const client = await prisma.client.findFirst({
        where: { OR: [{ telegramId: tgUserId }, { telegramChatId: chatId }] },
      });
      if (client && !client.telegramChatId) {
        await prisma.client.update({
          where: { id: client.id },
          data: { telegramChatId: chatId },
        });
      }
    }

    // Default Greeting
    const welcomeText =
      `💈 *Добро пожаловать в BLADE & CO.!*\n\n` +
      `Премиальный барбершоп в центре города.\n` +
      `Идеальные стрижки, классическое бритье и атмосфера комфорта.\n\n` +
      `👇 Нажмите кнопку ниже, чтобы выбрать мастера и удобное время:`;

    const keyboard = addMiniAppButton(new InlineKeyboard(), '✂️ Записаться онлайн')
      .row()
      .text('📅 Мои записи', 'my_bookings')
      .text('💈 Прайс & Мастера', 'services_info')
      .row()
      .text('📍 Контакты & Адрес', 'contacts');

    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // 2. Callback query: my_bookings
  bot.callbackQuery('my_bookings', async (ctx) => {
    await ctx.answerCallbackQuery();
    const tgUserId = String(ctx.from.id);
    const chatId = String(ctx.chat?.id || ctx.from.id);

    const client = await prisma.client.findFirst({
      where: { OR: [{ telegramId: tgUserId }, { telegramChatId: chatId }] },
      include: {
        bookings: {
          where: { status: 'CONFIRMED', startsAt: { gte: new Date() } },
          include: { barber: true, services: true },
          orderBy: { startsAt: 'asc' },
        },
      },
    });

    if (!client || client.bookings.length === 0) {
      const keyboard = addMiniAppButton(new InlineKeyboard(), '✂️ Записаться сейчас')
        .row()
        .text('« Назад в меню', 'main_menu');

      return await ctx.editMessageText(
        `У вас пока нет активных предстоящих записей.\n\nЗапишитесь на стрижку прямо сейчас:`,
        { reply_markup: keyboard }
      );
    }

    let text = `📅 *Ваши предстоящие записи:*\n\n`;
    const keyboard = new InlineKeyboard();

    client.bookings.forEach((b, i) => {
      text += `*${i + 1}.* ${formatRuDateTime(new Date(b.startsAt))}\n` +
        `   ✂️ Мастер: ${b.barber.name}\n` +
        `   💰 Сумма: ${b.totalPrice} ₽ (${b.totalDurationMin} мин)\n\n`;
      keyboard.url(`Управление записью #${b.manageToken.slice(-4).toUpperCase()}`, `${webUrl}/booking/${b.manageToken}`).row();
    });

    addMiniAppButton(keyboard, '📱 Открыть Mini App').row();
    keyboard.text('« Главное меню', 'main_menu');

    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  });

  // 3. Callback query: services_info
  bot.callbackQuery('services_info', async (ctx) => {
    await ctx.answerCallbackQuery();
    try {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { sortOrder: 'asc' },
      });

      let text = `💈 *Популярные услуги BLADE & CO.:*\n\n`;
      services.forEach((s) => {
        text += `• *${s.name}* — ${s.price} ₽ (${s.durationMin} мин)\n`;
      });
      text += `\n_И еще более 10 видов ухода и моделирования бороды в нашем Mini App!_`;

      const keyboard = addMiniAppButton(new InlineKeyboard(), '✂️ Выбрать услугу в приложении')
        .row()
        .text('« Назад', 'main_menu');

      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (err) {
      console.error(err);
    }
  });

  // 4. Callback query: contacts
  bot.callbackQuery('contacts', async (ctx) => {
    await ctx.answerCallbackQuery();
    const text =
      `📍 *Адрес:* г. Москва, ул. Большая Никитская, 24/1\n` +
      `🚇 м. Арбатская / Охотный Ряд (5 мин)\n\n` +
      `⏰ *Режим работы:* Ежедневно 10:00 — 22:00\n` +
      `📞 *Телефон:* +7 (495) 777-24-24\n` +
      `☕️ _Бесплатный зерновой кофе, крафтовые напитки и PlayStation для каждого гостя._`;

    const keyboard = addMiniAppButton(new InlineKeyboard(), '✂️ Записаться')
      .row()
      .text('« Назад', 'main_menu');

    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  });

  // 5. Callback query: main_menu
  bot.callbackQuery('main_menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    const welcomeText =
      `💈 *BLADE & CO. | Главное меню*\n\n` +
      `Премиальный барбершоп в центре города.\n` +
      `Выберите действие:`;

    const keyboard = addMiniAppButton(new InlineKeyboard(), '✂️ Записаться онлайн')
      .row()
      .text('📅 Мои записи', 'my_bookings')
      .text('💈 Прайс & Мастера', 'services_info')
      .row()
      .text('📍 Контакты & Адрес', 'contacts');

    await ctx.editMessageText(welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // Catch errors
  bot.catch((err) => {
    console.error('Telegram Bot error:', err);
  });
}

/**
 * Send notification when new booking is created
 */
export async function sendBookingCreatedNotification(bookingId: string) {
  if (!bot) {
    console.warn('Skip booking notification: Telegram bot is not configured');
    return;
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, barber: true, services: true },
    });

    if (!booking) return;

    const servicesList = booking.services.map((s) => `• ${s.name}`).join('\n');
    const dateTimeFormatted = formatRuDateTime(new Date(booking.startsAt));

    // 1. Notify Client (chat id equals user id in private chats)
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
    } else {
      console.warn(`No telegram chat id for client ${booking.client.id}, booking ${bookingId}`);
    }

    // 2. Notify Barber (if has Telegram)
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

/**
 * Send notification when booking is cancelled
 */
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

      await bot.api.sendMessage(clientChatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }

    // Notify barber
    if (booking.barber.telegramChatId) {
      const msg =
        `⚠️ *Отмена записи*\n\n` +
        `Клиент ${booking.client.name} отменил запись на *${dateTimeFormatted}*.\n` +
        `Слот освобожден в расписании.`;

      await bot.api.sendMessage(booking.barber.telegramChatId, msg, {
        parse_mode: 'Markdown',
      });
    }
  } catch (err) {
    console.error('Failed to send booking cancelled notification:', err);
  }
}

/**
 * Send notification when booking is rescheduled
 */
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

      await bot.api.sendMessage(clientChatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }

    // Notify barber
    if (booking.barber.telegramChatId) {
      const msg =
        `🔄 *Перенос записи*\n\n` +
        `Клиент ${booking.client.name} перенес визит на *${dateTimeFormatted}*.\n` +
        `Длительность: ${booking.totalDurationMin} мин.`;

      await bot.api.sendMessage(booking.barber.telegramChatId, msg, {
        parse_mode: 'Markdown',
      });
    }
  } catch (err) {
    console.error('Failed to send booking rescheduled notification:', err);
  }
}

/**
 * Generate a single-use or direct link for a barber to bind their Telegram Chat ID
 */
export function getBarberTelegramBindLink(barberId: string, botUsername: string = 'blade_barber_bot'): string {
  return `https://t.me/${botUsername}?start=barber_link_${barberId}`;
}
