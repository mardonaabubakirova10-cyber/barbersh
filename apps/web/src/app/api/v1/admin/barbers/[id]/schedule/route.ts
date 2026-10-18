export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const { workingHours = [], breaks = [] } = (await request.json()) as {
      workingHours: Array<{ weekday: number; startTime: string; endTime: string }>;
      breaks: Array<{ weekday: number; startTime: string; endTime: string }>;
    };

    await prisma.workingHours.deleteMany({ where: { barberId: id } });
    await prisma.break.deleteMany({ where: { barberId: id } });

    for (const wh of workingHours) {
      await prisma.workingHours.create({
        data: { barberId: id, weekday: wh.weekday, startTime: wh.startTime, endTime: wh.endTime },
      });
    }

    for (const br of breaks) {
      await prisma.break.create({
        data: { barberId: id, weekday: br.weekday, startTime: br.startTime, endTime: br.endTime },
      });
    }

    return NextResponse.json({ success: true, message: 'Schedule updated' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}
