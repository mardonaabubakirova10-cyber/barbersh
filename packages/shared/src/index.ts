export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  category: string;
  popular?: boolean;
}

export interface BarberItem {
  id: string;
  name: string;
  role: string;
  bio: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  specialties: string[];
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  service: string;
  barberName: string;
}
