import { Service, Barber, Booking } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchServices(): Promise<Service[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/services`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch services');
  }
  return json.data;
}

export async function fetchBarbers(): Promise<Barber[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/barbers`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch barbers');
  }
  return json.data;
}

export async function fetchAvailability(params: {
  barberId?: string;
  date: string;
  durationMin: number;
}): Promise<{ slots: string[]; slotMap?: Record<string, string[]> }> {
  const query = new URLSearchParams({
    date: params.date,
    durationMin: String(params.durationMin),
    ...(params.barberId ? { barberId: params.barberId } : {}),
  });

  const res = await fetch(`${API_BASE_URL}/api/v1/availability?${query.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch availability');
  }
  return json.data;
}

export async function fetchAvailableDays(params: {
  barberId?: string;
  fromDate: string;
  durationMin: number;
  days?: number;
}): Promise<Array<{ date: string; hasSlots: boolean }>> {
  const query = new URLSearchParams({
    fromDate: params.fromDate,
    durationMin: String(params.durationMin),
    days: String(params.days || 14),
    ...(params.barberId ? { barberId: params.barberId } : {}),
  });

  const res = await fetch(`${API_BASE_URL}/api/v1/availability/days?${query.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch available days');
  }
  return json.data;
}

export interface CreateBookingPayload {
  serviceIds: string[];
  barberId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  comment?: string;
  source?: 'TELEGRAM' | 'WEB';
  telegramId?: string;
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      source: 'TELEGRAM',
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    const error: any = new Error(json.error || 'Failed to create booking');
    error.code = json.code;
    throw error;
  }
  return json.data;
}

export async function fetchBooking(token: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${token}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch booking');
  }
  return json.data;
}

export async function cancelBooking(token: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${token}/cancel`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to cancel booking');
  }
  return json.data;
}

export async function rescheduleBooking(token: string, payload: { date: string; time: string; barberId?: string }): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${token}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    const error: any = new Error(json.error || 'Failed to reschedule booking');
    error.code = json.code;
    throw error;
  }
  return json.data;
}

export async function fetchTelegramBookings(params: { telegramId?: string; phone?: string }): Promise<Booking[]> {
  const query = new URLSearchParams();
  if (params.telegramId) query.set('telegramId', params.telegramId);
  if (params.phone) query.set('phone', params.phone);

  const res = await fetch(`${API_BASE_URL}/api/v1/telegram/bookings?${query.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch telegram bookings');
  }
  return json.data || [];
}
