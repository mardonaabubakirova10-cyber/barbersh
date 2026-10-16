import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const barber = await prisma.barber.create({
      data: {
        name: body.name,
        role: body.role || 'Барбер',
        bio: body.bio || null,
        photoUrl: body.photoUrl || null,
        experienceYears: Number(body.experienceYears || 1),
        sortOrder: Number(body.sortOrder || 0),
        isActive: true,
      },
    });

    const allServices = await prisma.service.findMany({ where: { isActive: true } });
    for (const s of allServices) {
      await prisma.barberService.create({
        data: { barberId: barber.id, serviceId: s.id, isEnabled: true },
      });
    }

    for (let weekday = 0; weekday <= 6; weekday++) {
      await prisma.workingHours.create({
        data: { barberId: barber.id, weekday, startTime: '10:00', endTime: '21:00' },
      });
      await prisma.break.create({
        data: { barberId: barber.id, weekday, startTime: '14:00', endTime: '15:00' },
      });
    }

    return NextResponse.json({ success: true, data: barber }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to create barber' },
      { status: 500 }
    );
  }
}
