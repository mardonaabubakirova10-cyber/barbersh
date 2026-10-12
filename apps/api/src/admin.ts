import crypto from 'crypto';
import { prisma } from '@barbershop/db';

/**
 * Hash password with PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against salt:hash
 */
export function verifyPassword(password: string, combined: string): boolean {
  if (!combined.includes(':')) {
    // Fallback simple comparison for dev seed if plain
    return password === combined;
  }
  const [salt, storedHash] = combined.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// In-memory rate limiting map for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): { allowed: boolean; remainingSec?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    return { allowed: true };
  }

  if (entry.count >= 5) {
    const remainingSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remainingSec };
  }

  return { allowed: true };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 min lockout window
  } else {
    entry.count++;
  }
}

export function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

/**
 * Ensure default admin exists
 */
export async function ensureDefaultAdmin() {
  const count = await prisma.adminUser.count();
  if (count === 0) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword(defaultPassword),
        role: 'ADMIN',
      },
    });
    console.log('🛡 Default admin user created: username="admin" password="' + defaultPassword + '"');
  }
}

/**
 * Admin Bookings Management
 */
export async function getAdminBookings(filters?: {
  date?: string;
  barberId?: string;
  status?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.barberId && filters.barberId !== 'all') {
    where.barberId = filters.barberId;
  }

  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  if (filters?.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(`${filters.date}T23:59:59.999Z`);
    where.startsAt = { gte: start, lte: end };
  }

  if (filters?.search) {
    const q = filters.search.trim();
    where.OR = [
      { client: { name: { contains: q, mode: 'insensitive' } } },
      { client: { phone: { contains: q, mode: 'insensitive' } } },
      { manageToken: { contains: q, mode: 'insensitive' } },
    ];
  }

  return prisma.booking.findMany({
    where,
    include: {
      client: true,
      barber: true,
      services: true,
      review: true,
    },
    orderBy: { startsAt: 'desc' },
  });
}

/**
 * Analytics Data Aggregator (for Stage 10)
 */
export async function getAnalyticsSummary(periodDays: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const bookings = await prisma.booking.findMany({
    where: {
      startsAt: { gte: startDate },
    },
    include: {
      barber: true,
      services: true,
    },
  });

  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Barber workload
  const barberMap: Record<string, { name: string; bookingsCount: number; revenue: number }> = {};
  for (const b of bookings) {
    if (!barberMap[b.barberId]) {
      barberMap[b.barberId] = { name: b.barber.name, bookingsCount: 0, revenue: 0 };
    }
    barberMap[b.barberId].bookingsCount++;
    if (b.status === 'COMPLETED') {
      barberMap[b.barberId].revenue += b.totalPrice;
    }
  }

  // Popular services
  const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const b of completedBookings) {
    for (const s of b.services) {
      if (!serviceMap[s.serviceId]) {
        serviceMap[s.serviceId] = { name: s.name, count: 0, revenue: 0 };
      }
      serviceMap[s.serviceId].count++;
      serviceMap[s.serviceId].revenue += s.price;
    }
  }

  return {
    periodDays,
    totalBookings: bookings.length,
    completedCount: completedBookings.length,
    cancelledCount: cancelledBookings.length,
    totalRevenue,
    averageCheck: completedBookings.length > 0 ? Math.round(totalRevenue / completedBookings.length) : 0,
    barberWorkload: Object.values(barberMap),
    popularServices: Object.values(serviceMap).sort((a, b) => b.count - a.count),
  };
}
