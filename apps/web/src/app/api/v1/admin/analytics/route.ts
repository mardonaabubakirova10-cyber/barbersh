import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = searchParams.get('days') || '30';

  try {
    const summary = await getAnalyticsSummary(Number(days));
    return NextResponse.json({ success: true, data: summary });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to compute analytics' },
      { status: 500 }
    );
  }
}
