import { NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({
      where: { isActive: true },
      include: {
        services: { where: { isEnabled: true }, include: { service: true } },
        workingHours: true,
        reviews: { where: { isPublic: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

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

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch barbers' }, { status: 500 });
  }
}
