import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: { barber: true, client: true, booking: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: reviews });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
