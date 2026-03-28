import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { searchSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { synthesizeResponses, streamSynthesisText, parseSynthesisOutput } from '@/lib/ai/synthesize';
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
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

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

async function fanOutProviders(query: string): Promise<ProviderResult[]> {
  const settled = await Promise.allSettled([
    runOpenAI(query),
    runGemini(query),
    runAnthropic(query),
    runGrok(query),
  ]);
  return settled.map((result) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      provider: 'chatgpt' as const,
      label: 'Unknown',
      model: 'unknown',
      status: 'error' as const,
      errorMessage: 'Unexpected promise rejection',
    };
  });
}

function sseResponse(
  events: Record<string, unknown>[],
  sessionId: string,
  isNewSession: boolean
): Response {
  const encoder = new TextEncoder();
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  };
  if (isNewSession) {
    headers['Set-Cookie'] = `${SESSION_COOKIE}=${sessionId}; Max-Age=${SESSION_MAX_AGE}; Path=/; HttpOnly; SameSite=Strict`;
  }
  return new Response(encoder.encode(body), { headers });
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = randomUUID();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const isStream = body.stream === true;

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid query' },
      { status: 400 }
    );
  }

  const { query } = parsed.data;
  const ageRange: string | undefined =
    typeof body.ageRange === 'string' ? String(body.ageRange) : undefined;

  const ipHash = getIpHash(req);

  // \u2500\u2500 Anonymous session \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const existingSession = req.cookies.get(SESSION_COOKIE)?.value;
  const isValidUUID =
    existingSession &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      existingSession
    );
  const sessionId = isValidUUID ? existingSession : randomUUID();
  const isNewSession = !isValidUUID;

  upsertAnonSession(sessionId, isNewSession, {
    deviceType: getDeviceType(req),
    acquisitionChannel: req.nextUrl.searchParams.get('utm_source') ?? undefined,
    acquisitionSource: req.nextUrl.searchParams.get('utm_source') ?? undefined,
    acquisitionMedium: req.nextUrl.searchParams.get('utm_medium') ?? undefined,
    acquisitionCampaign: req.nextUrl.searchParams.get('utm_campaign') ?? undefined,
  }).catch(console.error);

  // \u2500\u2500 Rate limit \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const rl = await checkRateLimit(ipHash);
  if (!rl.allowed) {
    if (isStream) {
      return sseResponse(
        [{ type: 'error', error: "You've reached your 5 free questions for today. Come back tomorrow!" }],
        sessionId,
        isNewSession
      );
    }
    return NextResponse.json(
      { error: 'Daily limit reached. You can ask 5 questions per day for free.', rateLimited: true },
      { status: 429 }
    );
  }

  // \u2500\u2500 Cache lookup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const normalized = normalizeQuery(query);
  const queryHash = hashQuery(normalized);

  const exactHit = await checkExactCache(queryHash);
  if (exactHit) {
    persistCacheHit(requestId, query, ipHash, sessionId, Date.now() - start).catch(console.error);
    tagAndUpdateSearch(requestId, query).catch(console.error);
    const result = {
      requestId,
      status: 'success' as const,
      query,
      compiled: exactHit.compiled,
      providers: exactHit.providers,
      totalLatencyMs: Date.now() - start,
      cached: true,
    };
    if (isStream) return sseResponse([{ type: 'cached', ...result }], sessionId, isNewSession);
    const res = NextResponse.json(result);
    if (isNewSession)
      res.cookies.set(SESSION_COOKIE, sessionId, {
        maxAge: SESSION_MAX_AGE,
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
      });
    return res;
  }

  const embedding = await generateEmbedding(normalized);
  if (embedding) {
    const semanticHit = await checkSemanticCache(embedding);
    if (semanticHit) {
      persistCacheHit(requestId, query, ipHash, sessionId, Date.now() - start).catch(console.error);
      tagAndUpdateSearch(requestId, query).catch(console.error);
      const result = {
        requestId,
        status: 'success' as const,
        query,
        compiled: semanticHit.compiled,
        providers: semanticHit.providers,
        totalLatencyMs: Date.now() - start,
        cached: true,
      };
      if (isStream) return sseResponse([{ type: 'cached', ...result }], sessionId, isNewSession);
      const res = NextResponse.json(result);
      if (isNewSession)
        res.cookies.set(SESSION_COOKIE, sessionId, {
          maxAge: SESSION_MAX_AGE,
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
        });
      return res;
    }
  }

  // \u2500\u2500 Streaming path \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  if (isStream) {
    const encoder = new TextEncoder();
    const synthModel = process.env.SYNTHESIS_MODEL || 'claude-sonnet-4-6';

    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          const providers = await fanOutProviders(query);
          const successful = providers.filter((p) => p.status === 'success' && p.text);

          if (successful.length < 2) {
            send({ type: 'error', error: 'Not enough providers responded. Please try again.' });
            controller.close();
            return;
          }

          send({ type: 'providers', providers, requestId });

          let fullText = '';
          for await (const delta of streamSynthesisText(query, providers)) {
            fullText += delta;
            send({ type: 'text', delta });
          }

          const parsed2 = parseSynthesisOutput(fullText);
          const compiled = { ...parsed2, synthesisModel: synthModel };
          const totalLatencyMs = Date.now() - start;

          persistSearch(requestId, query, providers, compiled, totalLatencyMs, ipHash, sessionId, ageRange).catch(console.error);
          saveToCache(normalized, queryHash, embedding, compiled, providers).catch(console.error);
          tagAndUpdateSearch(requestId, query).catch(console.error);

          send({
            type: 'done',
            compiled,
            requestId,
            totalLatencyMs,
            status: successful.length === 4 ? 'success' : 'partial_failure',
          });
          controller.close();
        } catch (err) {
          console.error('[search/stream]', err);
          try {
            send({ type: 'error', error: 'Something went wrong. Please try again.' });
          } catch { /* controller may be closed */ }
          try { controller.close(); } catch { /* already closed */ }
        }
      },
    });

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    };
    if (isNewSession) {
      headers['Set-Cookie'] = `${SESSION_COOKIE}=${sessionId}; Max-Age=${SESSION_MAX_AGE}; Path=/; HttpOnly; SameSite=Strict`;
    }
    return new Response(readable, { headers });
  }

  // \u2500\u2500 Standard (non-streaming) path \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const providers = await fanOutProviders(query);
  const successful = providers.filter((p) => p.status === 'success' && p.text);

  if (successful.length < 2) {
    return NextResponse.json(
      { requestId, status: 'failure', query, error: 'Not enough providers responded. Please try again.', providers },
      { status: 503 }
    );
  }

  const compiled = await synthesizeResponses(query, providers);
  const totalLatencyMs = Date.now() - start;

  persistSearch(requestId, query, providers, compiled, totalLatencyMs, ipHash, sessionId, ageRange).catch(console.error);
  saveToCache(normalized, queryHash, embedding, compiled, providers).catch(console.error);
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
  if (isNewSession)
    res.cookies.set(SESSION_COOKIE, sessionId, {
      maxAge: SESSION_MAX_AGE,
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
    });
  return res;
}
