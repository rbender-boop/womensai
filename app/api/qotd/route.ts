import { NextResponse } from 'next/server';
import { getTodayQotd } from '@/lib/qotd';

// Revalidate every hour — QOTD only changes once per day
export const revalidate = 3600;

export async function GET() {
  try {
    const qotd = await getTodayQotd();
    return NextResponse.json({ qotd: qotd ?? null });
  } catch (err) {
    console.error('[api/qotd]', err);
    return NextResponse.json({ qotd: null }); // fail silently — banner just hides
  }
}
