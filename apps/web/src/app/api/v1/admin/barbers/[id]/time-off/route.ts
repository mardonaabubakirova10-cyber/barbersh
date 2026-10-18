export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const { startsAt, endsAt, type = 'DAY_OFF', note } = body;

    const created = await prisma.timeOff.create({
      data: {
        barberId: id,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        type,
        note,
      },
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to create time off' },
      { status: 500 }
    );
  }
}
