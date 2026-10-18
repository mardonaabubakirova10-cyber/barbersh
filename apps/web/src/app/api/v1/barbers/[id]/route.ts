export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: {
        services: { where: { isEnabled: true }, include: { service: true } },
        workingHours: true,
        breaks: true,
        reviews: { where: { isPublic: true }, include: { client: true } },
      },
    });

    if (!barber) {
      return NextResponse.json({ success: false, error: 'Barber not found' }, { status: 404 });
    }

    const rating =
      barber.reviews.length > 0
        ? Number((barber.reviews.reduce((acc, r) => acc + r.rating, 0) / barber.reviews.length).toFixed(2))
        : 5.0;

    return NextResponse.json({
      success: true,
      data: { ...barber, rating, reviewsCount: barber.reviews.length },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch barber' }, { status: 500 });
  }
}
