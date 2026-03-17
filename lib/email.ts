const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = 'Kelly at AskWomensAI <kelly@askwomensai.com>';

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
                  <p style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#1C1714;line-height:1.3;">
                    You're in.
                  </p>
                  <p style="margin:0 0 20px;font-size:15px;color:#5C524D;line-height:1.7;">
                    Every question you ask from here makes your answers more personalized to you — not just based on your last question, but your full health history.
                  </p>
                  <p style="margin:0 0 28px;font-size:15px;color:#5C524D;line-height:1.7;">
                    Keep asking. The more context we have, the better your answers get.
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
        subject: 'You're in — your answers just got personal',
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
