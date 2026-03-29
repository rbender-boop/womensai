import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const BOT_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduck|slurp|archive\.org|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegrambot|discordbot|applebot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic-ai|chatgpt-user|perplexitybot|cohere-ai|headlesschrome|phantomjs|lighthouse|pagespeed|pingdom|uptimerobot|statuspage|dataforseo|screaming frog|rogerbot|ahrefsbot|blexbot|seznambot|yandexbot|megaindex|majestic|netcraft/i;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || 'wai-salt';
  return createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    const { path, referrer, sessionId } = await req.json();
    if (!path) return NextResponse.json({ ok: true });

    // Skip admin pages (double-check server-side)
    if (path.startsWith('/admin')) return NextResponse.json({ ok: true });

    const ua = req.headers.get('user-agent') || '';

    // Filter bots by user-agent
    if (BOT_PATTERN.test(ua)) return NextResponse.json({ ok: true });

    // Filter empty or suspiciously short user agents (likely bots/scripts)
    if (!ua || ua.length < 20) return NextResponse.json({ ok: true });

    const supabase = getClient();
    if (!supabase) return NextResponse.json({ ok: true });

    // Hash the IP for unique visitor tracking (never store raw IP)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
    const ipHash = hashIp(ip);

    let deviceType = 'desktop';
    if (/mobile|android|iphone/i.test(ua)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

    await supabase.from('page_views').insert({
      path,
      referrer: referrer || null,
      session_id: sessionId || null,
      user_agent: ua.slice(0, 500),
      device_type: deviceType,
      ip_hash: ipHash,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
