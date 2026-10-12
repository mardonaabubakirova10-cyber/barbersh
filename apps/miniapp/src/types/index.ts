export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  durationMin: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  photoUrl?: string | null;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  services?: Array<{
    id: string;
    name: string;
    durationMin: number;
    price: number;
  }>;
}

export interface BookingServiceItem {
  id: string;
  serviceId: string;
  name: string;
  durationMin: number;
  price: number;
}

export interface Booking {
  id: string;
  manageToken: string;
  startsAt: string;
  endsAt: string;
  totalPrice: number;
  totalDurationMin: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  source: 'WEB' | 'TELEGRAM' | 'ADMIN';
  barber: {
    id: string;
    name: string;
    role: string;
    photoUrl?: string | null;
  };
  client: {
    id: string;
    name: string;
    phone: string;
    telegramId?: string | null;
  };
  services: BookingServiceItem[];
  createdAt: string;
}

export interface BookingFormState {
  selectedServiceIds: string[];
  selectedBarberId: string; // id or 'any'
  selectedDate: string; // 'YYYY-MM-DD'
  selectedTime: string; // 'HH:MM'
  clientName: string;
  clientPhone: string;
  comment: string;
}

export type AppTab = 'booking' | 'my-bookings' | 'catalog';
