import { Service, Barber, Booking } from '../types';

const apiOrigin = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';

export async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok || !json.success) {
    const error: any = new Error(json.error || 'Request failed');
    if (json.code) {
      error.code = json.code;
    }
    throw error;
  }
  return json.data;
}

export async function fetchServices(): Promise<Service[]> {
  return request<Service[]>('/api/v1/services');
}

export async function fetchBarbers(): Promise<Barber[]> {
  return request<Barber[]>('/api/v1/barbers');
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

  return request<{ slots: string[]; slotMap?: Record<string, string[]> }>(
    `/api/v1/availability?${query.toString()}`
  );
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

  return request<Array<{ date: string; hasSlots: boolean }>>(
    `/api/v1/availability/days?${query.toString()}`
  );
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
  return request<Booking>('/api/v1/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      source: 'TELEGRAM',
    }),
  });
}

export async function fetchBooking(token: string): Promise<Booking> {
  return request<Booking>(`/api/v1/bookings/${token}`);
}

export async function cancelBooking(token: string): Promise<Booking> {
  return request<Booking>(`/api/v1/bookings/${token}/cancel`, {
    method: 'POST',
  });
}

export async function rescheduleBooking(token: string, payload: { date: string; time: string; barberId?: string }): Promise<Booking> {
  return request<Booking>(`/api/v1/bookings/${token}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchTelegramBookings(params: { telegramId?: string; phone?: string }): Promise<Booking[]> {
  const query = new URLSearchParams();
  if (params.telegramId) query.set('telegramId', params.telegramId);
  if (params.phone) query.set('phone', params.phone);

  const data = await request<Booking[]>(`/api/v1/telegram/bookings?${query.toString()}`);
  return data || [];
}

