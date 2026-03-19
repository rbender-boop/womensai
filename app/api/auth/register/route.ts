import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSalt, hashPassword } from '@/lib/auth';
import { sendWelcomeEmail, sendSignupNotification } from '@/lib/email';

function getClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const AGE_RANGES = ['18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65+'];

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, ageRange, email, password } = await req.json();

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    if (!AGE_RANGES.includes(ageRange)) {
      return NextResponse.json({ error: 'Please select a valid age range.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getClient();

    // Check if already registered
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered. Try logging in.' }, { status: 409 });
    }

    // Hash password
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // Insert profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        email: normalizedEmail,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age_range: ageRange,
        password_hash: passwordHash,
        salt,
      })
      .select('id, email, first_name')
      .single();

    if (error || !data) {
      console.error('[auth/register] Insert error:', error);
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
    }

    // Also add to email_signups so they get QOTD emails
    await supabase.from('email_signups').upsert(
      { email: normalizedEmail, signed_up_at: new Date().toISOString(), source: 'account_signup' },
      { onConflict: 'email' }
    );

    // Welcome email + admin notification
    await sendWelcomeEmail(normalizedEmail);
    await sendSignupNotification({
      email: normalizedEmail,
      signedUpAt: new Date().toISOString(),
      source: 'account_signup',
    });

    return NextResponse.json({
      user: { id: data.id, firstName: data.first_name, email: data.email },
    });
  } catch (err) {
    console.error('[auth/register] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
