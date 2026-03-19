import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/auth';

function getClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.includes('@') || !password) {
      return NextResponse.json({ error: 'Please enter your email and password.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getClient();

    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, password_hash, salt')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!verifyPassword(password, user.salt, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    return NextResponse.json({
      user: { id: user.id, firstName: user.first_name, email: user.email },
    });
  } catch (err) {
    console.error('[auth/login] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
