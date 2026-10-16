import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await prisma.service.create({
      data: {
        name: body.name,
        category: body.category || 'Стрижки',
        description: body.description || null,
        price: Number(body.price),
        durationMin: Number(body.durationMin),
        sortOrder: Number(body.sortOrder || 0),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
