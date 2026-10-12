import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Converts "HH:MM" to minutes from midnight */
function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Converts minutes from midnight to "HH:MM" */
function minToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Preloaded data for a barber — loaded once, used for all dates */
interface BarberPreload {
  workingHours: Array<{ weekday: number; startTime: string; endTime: string }>;
  breaks: Array<{ weekday: number; startTime: string; endTime: string }>;
  timeOffs: Array<{ startsAt: Date; endsAt: Date }>;
  bookings: Array<{ startsAt: Date; endsAt: Date }>;
  slotStep: number;
  minNoticeMin: number;
}

/** Load all barber data once for a date range */
async function preloadBarberData(
  barberId: string,
  fromDate: string,
  days: number
): Promise<BarberPreload> {
  const rangeStart = new Date(`${fromDate}T00:00:00.000Z`);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + days);

  const [workingHours, breaks, timeOffs, bookings, slotStepSetting, minNoticeSetting] = await Promise.all([
    prisma.workingHours.findMany({ where: { barberId } }),
    prisma.break.findMany({ where: { barberId } }),
    prisma.timeOff.findMany({
      where: {
        OR: [{ barberId }, { barberId: null }],
        startsAt: { lte: rangeEnd },
        endsAt: { gte: rangeStart },
      },
    }),
    prisma.booking.findMany({
      where: {
        barberId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        startsAt: { gte: rangeStart, lt: rangeEnd },
      },
    }),
    prisma.setting.findUnique({ where: { key: 'slot_step_minutes' } }),
    prisma.setting.findUnique({ where: { key: 'min_notice_min' } }),
  ]);

  return {
    workingHours,
    breaks,
    timeOffs,
    bookings,
    slotStep: Number(slotStepSetting?.value ?? 30),
    minNoticeMin: Number(minNoticeSetting?.value ?? 60),
  };
}

/** Compute available slots from preloaded data (no DB calls) */
function computeSlots(
  data: BarberPreload,
  dateStr: string,
  durationMin: number
): string[] {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const weekday = date.getUTCDay();

  // Find working hours for this weekday
  const wh = data.workingHours.find((w) => w.weekday === weekday);
  if (!wh) return [];

  const workStart = timeToMin(wh.startTime);
  const workEnd = timeToMin(wh.endTime);

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.000Z`);

  // Check time_off that covers the entire day
  for (const off of data.timeOffs) {
    if (off.startsAt <= dayStart && off.endsAt >= dayEnd) return [];
  }

  // Build blocked ranges
  type Range = { start: number; end: number };
  const blocked: Range[] = [];

  // Breaks for this weekday
  for (const br of data.breaks) {
    if (br.weekday === weekday) {
      blocked.push({ start: timeToMin(br.startTime), end: timeToMin(br.endTime) });
    }
  }

  // Partial time_offs (not full-day)
  for (const off of data.timeOffs) {
    if (off.startsAt <= dayEnd && off.endsAt >= dayStart) {
      const offStart = off.startsAt.getUTCHours() * 60 + off.startsAt.getUTCMinutes();
      const offEnd = off.endsAt.getUTCHours() * 60 + off.endsAt.getUTCMinutes();
      blocked.push({ start: offStart, end: offEnd });
    }
  }

  // Existing bookings on this day
  for (const bk of data.bookings) {
    const bkDate = bk.startsAt.toISOString().split('T')[0];
    if (bkDate === dateStr) {
      const bkStart = bk.startsAt.getUTCHours() * 60 + bk.startsAt.getUTCMinutes();
      const bkEnd = bk.endsAt.getUTCHours() * 60 + bk.endsAt.getUTCMinutes();
      blocked.push({ start: bkStart, end: bkEnd });
    }
  }

  // Min notice: skip slots too close to now
  const nowUTC = new Date();
  const todayStr = nowUTC.toISOString().split('T')[0];
  const nowTotalMin = nowUTC.getUTCHours() * 60 + nowUTC.getUTCMinutes() + data.minNoticeMin;

  // Generate slots
  const slots: string[] = [];
  for (let start = workStart; start + durationMin <= workEnd; start += data.slotStep) {
    const end = start + durationMin;

    // Skip past slots on today
    if (dateStr === todayStr && start < nowTotalMin) continue;

    const isBlocked = blocked.some((b) => start < b.end && end > b.start);
    if (!isBlocked) {
      slots.push(minToTime(start));
    }
  }

  return slots;
}

/**
 * Returns available time slots for a given barber and date.
 * Fetches DB data once, computes in memory.
 */
export async function getAvailableSlots({
  barberId,
  dateStr,
  durationMin,
}: {
  barberId: string;
  dateStr: string;
  durationMin: number;
}): Promise<string[]> {
  const data = await preloadBarberData(barberId, dateStr, 1);
  return computeSlots(data, dateStr, durationMin);
}

/**
 * Returns which dates in the next N days have at least one free slot.
 * Preloads all data once — no N×M queries.
 */
export async function getAvailableDays({
  barberId,
  durationMin,
  fromDate,
  days = 14,
}: {
  barberId: string;
  durationMin: number;
  fromDate: string;
  days?: number;
}): Promise<{ date: string; hasSlots: boolean }[]> {
  // Load all data for the entire date range at once
  const data = await preloadBarberData(barberId, fromDate, days + 1);

  const result: { date: string; hasSlots: boolean }[] = [];
  const start = new Date(fromDate + 'T00:00:00.000Z');

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const slots = computeSlots(data, dateStr, durationMin);
    result.push({ date: dateStr, hasSlots: slots.length > 0 });
  }

  return result;
}

export { prisma };
