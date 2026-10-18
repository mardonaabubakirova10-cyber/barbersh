export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { runRemindersCycle } from '@/lib/reminders';

export const runtime = 'nodejs';

async function handleCron() {
  try {
    const result = await runRemindersCycle();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleCron();
}

export async function GET(request: NextRequest) {
  return handleCron();
}
