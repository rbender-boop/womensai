import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getClient();
    let isNewSignup = true;

    if (supabase) {
      // Check if already signed up — don't resend welcome email to existing users
      const { data: existing } = await supabase
        .from('email_signups')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      isNewSignup = !existing;

      const { error } = await supabase
        .from('email_signups')
        .upsert(
          { email: normalizedEmail, signed_up_at: new Date().toISOString() },
          { onConflict: 'email' }
        );

      if (error) {
        console.error('Supabase signup error:', error);
      }
    }

    // Only send welcome email to brand new signups
    if (isNewSignup) {
      await sendWelcomeEmail(normalizedEmail);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Signup route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
