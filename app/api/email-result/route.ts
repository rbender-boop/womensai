import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

function getDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { to, query, compiled, shareUrl, type, note, senderEmail } = await req.json();

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const subject = type === 'self'
      ? `Your AskWomensAI answer: ${query.slice(0, 55)}${query.length > 55 ? '\u2026' : ''}`
      : `Someone shared an AskWomensAI answer with you`;

    const { error } = await resend.emails.send({
      from: 'AskWomensAI <hello@askwomensai.com>',
      to,
      subject,
      html: buildEmail({ query, compiled, shareUrl, type, note }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Email failed to send' }, { status: 500 });
    }

    // Log share event with sender/recipient tracking
    const db = getDb();
    if (db) {
      db.from('share_events').insert({
        share_channel: type === 'self' ? 'email_self' : 'email_friend',
        sender_email: senderEmail || (type === 'self' ? to : null),
        recipient_email: to,
        query_text: query,
        result_snapshot: compiled ? { compiled } : null,
      }).then(({ error: dbErr }) => {
        if (dbErr) console.error('Share event log error:', dbErr);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Email result error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function buildEmail({
  query, compiled, shareUrl, type, note,
}: {
  query: string;
  compiled: { bestAnswer: string; consensus: string[]; disagreements: string[]; notes?: string };
  shareUrl: string;
  type: 'self' | 'friend';
  note?: string;
}): string {
  const consensusHtml = compiled.consensus?.map(
    (c) => `<li style="margin-bottom:8px;color:#4A5540;">\u2713 ${c}</li>`
  ).join('') ?? '';

  const disagreeHtml = compiled.disagreements?.map(
    (d) => `<li style="margin-bottom:8px;color:#5A4520;">\u2260 ${d}</li>`
  ).join('') ?? '';

  const noteHtml = type === 'friend' && note
    ? `<div style="margin-bottom:24px;padding:16px;background:#F7ECF0;border-radius:10px;border:1px solid #E8C4D0;">
        <p style="margin:0;font-size:14px;color:#7A3050;font-style:italic;">${note}</p>
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F5;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:32px auto;padding:0 16px;">
    <div style="background:white;border-radius:20px;padding:36px;border:1px solid #EDE8E3;">
      <div style="text-align:center;margin-bottom:28px;">
        <span style="font-size:22px;font-weight:bold;color:#2D2926;">AskWomens</span><span style="font-size:22px;font-weight:bold;color:#9B4163;">AI</span>
      </div>
      ${noteHtml}
      <p style="font-size:12px;color:#7A6E67;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Question</p>
      <div style="background:#FAF7F5;border-radius:12px;padding:16px;margin-bottom:28px;border:1px solid #EDE8E3;">
        <p style="margin:0;font-size:16px;font-weight:600;color:#2D2926;line-height:1.5;">${query}</p>
      </div>
      <div style="margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="background:#9B4163;border-radius:8px;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:white;font-size:14px;">\u2726</span>
          </div>
          <h2 style="margin:0;font-size:16px;color:#2D2926;display:inline;">Best Answer</h2>
          <span style="font-size:12px;color:#AFA8A2;margin-left:4px;">Synthesized from all 4 AIs</span>
        </div>
        <p style="margin:0;font-size:14px;line-height:1.75;color:#4A4540;white-space:pre-wrap;">${compiled.bestAnswer}</p>
      </div>
      ${consensusHtml ? `
      <div style="background:#EFF6EF;border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid #C2D9C0;">
        <h3 style="margin:0 0 12px;font-size:14px;color:#2F6B2B;">Where the AIs agree</h3>
        <ul style="margin:0;padding:0;list-style:none;font-size:13px;line-height:1.7;">${consensusHtml}</ul>
      </div>` : ''}
      ${disagreeHtml ? `
      <div style="background:#FDF6EC;border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid #EDD8B0;">
        <h3 style="margin:0 0 12px;font-size:14px;color:#8A5E1A;">Where they differ</h3>
        <ul style="margin:0;padding:0;list-style:none;font-size:13px;line-height:1.7;">${disagreeHtml}</ul>
      </div>` : ''}
      ${shareUrl ? `<div style="text-align:center;margin:28px 0;">
        <a href="${shareUrl}" style="background:#9B4163;color:white;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;display:inline-block;">View Full Answer</a>
      </div>` : ''}
      <div style="margin-top:28px;padding:16px;background:#FDF0F6;border-radius:10px;border:1px solid #E8C4D0;">
        <p style="margin:0;font-size:12px;color:#7A3050;line-height:1.6;">
          <strong>Important:</strong> These responses are from AI models for informational purposes only. They do not constitute medical advice. Always consult a qualified healthcare provider.
        </p>
      </div>
      <p style="text-align:center;margin-top:24px;font-size:12px;color:#AFA8A2;">
        <a href="https://www.askwomensai.com" style="color:#9B4163;text-decoration:none;">AskWomensAI.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
