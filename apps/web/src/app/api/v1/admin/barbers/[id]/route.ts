import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/slots';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const updated = await prisma.barber.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        bio: body.bio,
        photoUrl: body.photoUrl,
        experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update barber' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await prisma.barber.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, message: 'Barber deactivated' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete barber' },
      { status: 500 }
    );
  }
}
