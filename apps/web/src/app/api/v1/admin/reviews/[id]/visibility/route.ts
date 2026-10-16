import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const { isPublic } = await request.json();
    const updated = await prisma.review.update({
      where: { id },
      data: { isPublic: Boolean(isPublic) },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update review visibility' },
      { status: 500 }
    );
  }
}
