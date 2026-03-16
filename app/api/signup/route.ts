import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const supabase = getClient();

    if (supabase) {
      // Upsert so duplicate emails don't throw errors
      const { error } = await supabase
        .from('email_signups')
        .upsert(
          {
            email: email.toLowerCase().trim(),
            signed_up_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

      if (error) {
        console.error('Supabase signup error:', error);
        // Still return success — don't block UX over a DB error
      }
    } else {
      // Supabase not configured — log and continue
      console.log('Signup captured (no Supabase):', email);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Signup route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
