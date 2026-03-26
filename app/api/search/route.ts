import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { searchSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { synthesizeResponses } from '@/lib/ai/synthesize';
import { persistSearch, persistCacheHit, upsertAnonSession, tagAndUpdateSearch } from '@/lib/db';
import { runOpenAI } from '@/lib/ai/providers/openai';
import { runAnthropic } from '@/lib/ai/providers/anthropic';
import { runGemini } from '@/lib/ai/providers/gemini';
import { runGrok } from '@/lib/ai/providers/grok';
import {
  normalizeQuery,
  hashQuery,
  generateEmbedding,
  checkExactCache,
  checkSemanticCache,
  saveToCache,
} from '@/lib/cache';
import type { ProviderResult, SearchResponse } from '@/types/search';

const SESSION_COOKIE = 'wai_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getIpHash(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (Math.imul(31, h) + ip.charCodeAt(i)) | 0;
  return `ip_${Math.abs(h).toString(36)}`;
}

function getDeviceType(req: NextRequest): string {
  const ua = req.headers.get('user-agent') ?? '';
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = nanoid();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid query' },
      { status: 400 }
    );
  }

  const { query } = parsed.data;
  // age_range is optional — passed when user answered the age follow-up question
  const ageRange: string | undefined =
    typeof (body as Record<string, unknown>).ageRange === 'string'
      ? String((body as Record<string, unknown>).ageRange)
      : undefined;

  const ipHash = getIpHash(req);

  // ── Anonymous session ────────────────────────────────────────────────────────
  const existingSession = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existingSession ?? nanoid();
  const isNewSession = !existingSession;

  upsertAnonSession(sessionId, isNewSession, {
    deviceType: getDeviceType(req),
    acquisitionChannel: req.nextUrl.searchParams.get('utm_source') ?? undefined,
    acquisitionSource: req.nextUrl.searchParams.get('utm_source') ?? undefined,
    acquisitionMedium: req.nextUrl.searchParams.get('utm_medium') ?? undefined,
    acquisitionCampaign: req.nextUrl.searchParams.get('utm_campaign') ?? undefined,
  }).catch(console.error);

  const rl = await checkRateLimit(ipHash);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Daily limit reached. You can ask 5 questions per day for free.', rateLimited: true },
      { status: 429 }
    );
  }

  // ── Cache lookup ─────────────────────────────────────────────────────────────
  const normalized = normalizeQuery(query);
  const queryHash = hashQuery(normalized);

  const exactHit = await checkExactCache(queryHash);
  if (exactHit) {
    // Log cache hit so it shows in admin dashboard
    persistCacheHit(requestId, query, ipHash, sessionId, Date.now() - start).catch(console.error);
    tagAndUpdateSearch(requestId, query).catch(console.error);

    const res = NextResponse.json({
      requestId,
      status: 'success',
      query,
      compiled: exactHit.compiled,
      providers: exactHit.providers,
      totalLatencyMs: Date.now() - start,
      cached: true,
    } satisfies SearchResponse & { cached: boolean });
    if (isNewSession) res.cookies.set(SESSION_COOKIE, sessionId, { maxAge: SESSION_MAX_AGE, path: '/', httpOnly: true, sameSite: 'strict' });
    return res;
  }

  const embedding = await generateEmbedding(normalized);
  if (embedding) {
    const semanticHit = await checkSemanticCache(embedding);
    if (semanticHit) {
      // Log cache hit so it shows in admin dashboard
      persistCacheHit(requestId, query, ipHash, sessionId, Date.now() - start).catch(console.error);
      tagAndUpdateSearch(requestId, query).catch(console.error);

      const res = NextResponse.json({
        requestId,
        status: 'success',
        query,
        compiled: semanticHit.compiled,
        providers: semanticHit.providers,
        totalLatencyMs: Date.now() - start,
        cached: true,
      } satisfies SearchResponse & { cached: boolean });
      if (isNewSession) res.cookies.set(SESSION_COOKIE, sessionId, { maxAge: SESSION_MAX_AGE, path: '/', httpOnly: true, sameSite: 'strict' });
      return res;
    }
  }

  const settled = await Promise.allSettled([
    runOpenAI(query),
    runGemini(query),
    runAnthropic(query),
    runGrok(query),
  ]);

  const providers: ProviderResult[] = settled.map((result) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      provider: 'chatgpt' as const,
      label: 'Unknown',
      model: 'unknown',
      status: 'error' as const,
      errorMessage: 'Unexpected promise rejection',
    };
  });

  const successful = providers.filter((p) => p.status === 'success' && p.text);

  if (successful.length < 2) {
    return NextResponse.json(
      { requestId, status: 'failure', query, error: 'Not enough providers responded. Please try again.', providers },
      { status: 503 }
    );
  }

  const compiled = await synthesizeResponses(query, providers);
  const totalLatencyMs = Date.now() - start;

  // Persist + cache fire-and-forget
  persistSearch(requestId, query, providers, compiled, totalLatencyMs, ipHash, sessionId, ageRange).catch(console.error);
  saveToCache(normalized, queryHash, embedding, compiled, providers).catch(console.error);

  // Tag fire-and-forget
  tagAndUpdateSearch(requestId, query).catch(console.error);

  const response: SearchResponse = {
    requestId,
    status: successful.length === 4 ? 'success' : 'partial_failure',
    query,
    compiled,
    providers,
    totalLatencyMs,
  };

  const res = NextResponse.json(response);
  if (isNewSession) res.cookies.set(SESSION_COOKIE, sessionId, { maxAge: SESSION_MAX_AGE, path: '/', httpOnly: true, sameSite: 'strict' });
  return res;
}
