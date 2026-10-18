export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await prisma.timeOff.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Time off deleted' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete time off' },
      { status: 500 }
    );
  }
}
