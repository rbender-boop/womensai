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
    const { path, referrer, sessionId } = await req.json();
    if (!path) return NextResponse.json({ ok: true });

    const supabase = getClient();
    if (!supabase) return NextResponse.json({ ok: true });

    const ua = req.headers.get('user-agent') || '';
    let deviceType = 'desktop';
    if (/mobile|android|iphone/i.test(ua)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

    await supabase.from('page_views').insert({
      path,
      referrer: referrer || null,
      session_id: sessionId || null,
      user_agent: ua.slice(0, 500),
      device_type: deviceType,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
