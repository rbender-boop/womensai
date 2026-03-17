import { NextRequest, NextResponse } from 'next/server';
import { generateAndStoreQotd, getQotdSubscribers } from '@/lib/qotd';
import { sendDailyQotdEmail } from '@/lib/email';

// Vercel Cron — runs daily at 7:00 AM ET (12:00 UTC)
// Configured in vercel.json

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Generate (idempotent — safe to call multiple times)
    const qotd = await generateAndStoreQotd();
    console.log('[cron/qotd] Generated:', qotd.question.slice(0, 60));

    // 2. Get all subscribers from email_signups
    const subscribers = await getQotdSubscribers();
    console.log(`[cron/qotd] Sending to ${subscribers.length} subscribers`);

    // 3. Send
    const { sent } = await sendDailyQotdEmail({
      recipients: subscribers,
      question: qotd.question,
      answer: qotd.answer,
      date: qotd.date,
    });

    return NextResponse.json({
      ok: true,
      date: qotd.date,
      subscribers: subscribers.length,
      sent,
    });
  } catch (err) {
    console.error('[cron/qotd] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
