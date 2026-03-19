import { NextRequest, NextResponse } from 'next/server';
import { generateAndStoreQotd, getQotdSubscribers, shouldSendEmailToday, markAsEmailed } from '@/lib/qotd';
import { sendDailyQotdEmail } from '@/lib/email';

// Vercel Cron — runs daily at 7:00 AM ET (12:00 UTC)
// QOTD is generated daily (for site content)
// Email is sent every 3 days (cadence check in code)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Generate QOTD (idempotent — runs daily for site content)
    const qotd = await generateAndStoreQotd();
    console.log('[cron/qotd] Generated:', qotd.question.slice(0, 60));

    // 2. Check 3-day email cadence
    const shouldEmail = await shouldSendEmailToday();
    if (!shouldEmail) {
      console.log('[cron/qotd] Skipping email — sent within last 3 days');
      return NextResponse.json({
        ok: true,
        date: qotd.date,
        emailSkipped: true,
        reason: 'sent_within_3_days',
      });
    }

    // 3. Get all subscribers from email_signups
    const subscribers = await getQotdSubscribers();
    console.log(`[cron/qotd] Sending to ${subscribers.length} subscribers`);

    // 4. Send with teaser (falls back to truncated answer if teaser missing)
    const { sent } = await sendDailyQotdEmail({
      recipients: subscribers,
      question: qotd.question,
      teaser: qotd.teaser ?? undefined,
      answer: qotd.answer,
      date: qotd.date,
    });

    // 5. Mark as emailed
    await markAsEmailed(qotd.date);

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
