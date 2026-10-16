import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const { status } = await request.json();
    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { client: true, barber: true, services: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
