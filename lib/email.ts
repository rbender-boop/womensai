const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = 'Kelly at AskWomensAI <kelly@askwomensai.com>';
const ADMIN_EMAIL = 'kelly@askwomensai.com';

// ─── Welcome email (existing) ────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — skipping welcome email');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#FAF7F5;font-family:Georgia,serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F5;padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #EDE8E3;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:#9B4163;padding:28px 36px;">
                  <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:-0.3px;">
                    AskWomens<span style="color:#F7C5D5;">AI</span>
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 36px 28px;">
                  <p style="margin:0 0 4px;font-size:22px;font-weight:bold;color:#1C1714;line-height:1.3;">
                    You're in.
                  </p>
                  <p style="margin:0 0 20px;font-size:15px;color:#9B4163;font-style:italic;line-height:1.3;">
                    Your profile is anonymous.
                  </p>
                  <p style="margin:0 0 20px;font-size:15px;color:#5C524D;line-height:1.7;">
                    The more you ask, the smarter and more personalized your answers get — and your questions always remain anonymous.
                  </p>
                  <p style="margin:0 0 28px;font-size:15px;color:#5C524D;line-height:1.7;">
                    Keep asking. The more context we have, the better and more personalized your answers get.
                  </p>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#9B4163;border-radius:10px;">
                        <a
                          href="https://www.askwomensai.com"
                          style="display:inline-block;padding:13px 28px;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.2px;"
                        >
                          Ask your next question →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding:0 36px;"><hr style="border:none;border-top:1px solid #EDE8E3;margin:0;" /></td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 36px 28px;">
                  <p style="margin:0;font-size:11px;color:#A89E97;line-height:1.6;">
                    For research only. Always consult a qualified healthcare provider before making health decisions.<br />
                    You received this because you signed up at AskWomensAI.com.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: "You're in — your profile is anonymous",
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend error:', body);
    }
  } catch (err) {
    console.error('sendWelcomeEmail error:', err);
  }
}

// ─── Admin notification: fires on every new signup → kelly@ ─────────────────

export async function sendSignupNotification({
  email,
  signedUpAt,
  source,
}: {
  email: string;
  signedUpAt: string;
  source?: string;
}) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — skipping signup notification');
    return;
  }

  const time = new Date(signedUpAt).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const html = `
    <div style="font-family:Georgia,serif;max-width:480px;padding:32px;">
      <p style="margin:0 0 4px;font-size:12px;color:#A89E97;text-transform:uppercase;letter-spacing:1px;">AskWomensAI</p>
      <h2 style="margin:0 0 20px;font-size:20px;color:#1C1714;">New signup</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#7A6E67;width:90px;">Email</td>
          <td style="padding:8px 0;font-weight:600;color:#1C1714;">${email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#7A6E67;">Time</td>
          <td style="padding:8px 0;color:#1C1714;">${time} ET</td>
        </tr>
        ${source ? `
        <tr>
          <td style="padding:8px 0;color:#7A6E67;">Source</td>
          <td style="padding:8px 0;color:#1C1714;">${source}</td>
        </tr>` : ''}
      </table>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: `New signup: ${email}`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[sendSignupNotification] Resend error:', body);
    }
  } catch (err) {
    console.error('[sendSignupNotification] error:', err);
  }
}

// ─── QOTD email — minimal personal style, teaser only ───────────────────────

export async function sendDailyQotdEmail({
  recipients,
  question,
  teaser,
  answer,
  date,
}: {
  recipients: string[];
  question: string;
  teaser?: string;
  answer: string;
  date: string;
}) {
  if (!RESEND_API_KEY || !recipients.length) return { sent: 0 };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.askwomensai.com';
  const searchUrl = `${appUrl}?q=${encodeURIComponent(question)}`;
  const unsubscribeUrl = `${appUrl}/unsubscribe`;

  // Use teaser if available, otherwise truncate answer to ~2 sentences
  const displayTeaser = teaser || truncateToTeaser(answer);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:#ffffff;color:#1C1714;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <p style="margin:0 0 28px;font-size:13px;color:#9B4163;font-weight:600;letter-spacing:0.5px;">AskWomensAI</p>
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1C1714;line-height:1.45;">${escapeHtml(question)}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#5C524D;line-height:1.75;">${escapeHtml(displayTeaser)}</p>
    <a href="${searchUrl}" style="display:inline-block;padding:13px 28px;background:#9B4163;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;border-radius:10px;font-family:Georgia,serif;">Search for the answer &#8594;</a>
    <p style="margin:36px 0 0;font-size:11px;color:#A89E97;line-height:1.6;">For research only. Always consult a qualified healthcare provider.<br/><a href="${unsubscribeUrl}" style="color:#A89E97;">Unsubscribe</a></p>
  </div>
</body>
</html>`;

  // Resend batch: max 100 per call
  const batches = chunk(recipients, 100);
  let totalSent = 0;

  for (const batch of batches) {
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          batch.map((to) => ({
            from: FROM,
            to: [to],
            subject: question,
            html,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }))
        ),
      });

      if (res.ok) {
        totalSent += batch.length;
      } else {
        const body = await res.text();
        console.error('[sendDailyQotdEmail] batch error:', body);
      }
    } catch (err) {
      console.error('[sendDailyQotdEmail] error:', err);
    }
  }

  return { sent: totalSent };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateToTeaser(answer: string): string {
  const sentences = answer.split(/(?<=[.!?])\s+/);
  const first2 = sentences.slice(0, 2).join(' ');
  return first2.length > 200 ? first2.slice(0, 197) + '...' : first2;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
