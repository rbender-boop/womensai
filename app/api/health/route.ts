import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    xai: !!process.env.XAI_API_KEY,
    supabase: !!process.env.SUPABASE_URL,
    upstash: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  const allProviders = checks.openai && checks.anthropic && checks.gemini && checks.xai;

  return NextResponse.json({
    status: allProviders ? 'ok' : 'degraded',
    providers: checks,
    timestamp: new Date().toISOString(),
  });
}
