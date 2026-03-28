import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail, sendSignupNotification } from '@/lib/email';
import { checkEmailForSpam, isHoneypotTriggered } from '@/lib/spam-filter';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source, website } = body;

    // Honeypot check — 'website' is a hidden field bots auto-fill
    if (isHoneypotTriggered(website)) {
      // Return success so bots think it worked, but do nothing
      console.log(`[spam-filter] Honeypot triggered: ${email}`);
      return NextResponse.json({ success: true });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Spam domain + pattern check
    const spamCheck = checkEmailForSpam(normalizedEmail);
    if (spamCheck.isSpam) {
      // Return success so bots think it worked, but do nothing
      console.log(`[spam-filter] Blocked signup: ${normalizedEmail} (${spamCheck.reason})`);
      return NextResponse.json({ success: true });
    }

    const supabase = getClient();
    let isNewSignup = true;

    if (supabase) {
      const { data: existing } = await supabase
        .from('email_signups')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      isNewSignup = !existing;

      const { error } = await supabase
        .from('email_signups')
        .upsert(
          {
            email: normalizedEmail,
            signed_up_at: new Date().toISOString(),
            source: source ?? 'unknown',
          },
          { onConflict: 'email' }
        );

      if (error) {
        console.error('Supabase signup error:', error);
      }
    }

    if (isNewSignup) {
      await sendWelcomeEmail(normalizedEmail);
      await sendSignupNotification({
        email: normalizedEmail,
        signedUpAt: new Date().toISOString(),
        source: source ?? 'unknown',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Signup route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
