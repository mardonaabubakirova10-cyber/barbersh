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
    const { imageUrl, sortOrder = 0 } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    const item = await prisma.portfolioItem.create({
      data: {
        barberId: id,
        imageUrl,
        sortOrder: Number(sortOrder),
      },
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to add portfolio item' },
      { status: 500 }
    );
  }
}
