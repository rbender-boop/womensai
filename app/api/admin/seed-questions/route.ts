export const maxDuration = 300; // Vercel Pro: up to 300s

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { runOpenAI } from '@/lib/ai/providers/openai';
import { runAnthropic } from '@/lib/ai/providers/anthropic';
import { runGemini } from '@/lib/ai/providers/gemini';
import { runGrok } from '@/lib/ai/providers/grok';
import { synthesizeResponses } from '@/lib/ai/synthesize';
import { persistSearch } from '@/lib/db';
import {
  normalizeQuery,
  hashQuery,
  generateEmbedding,
  checkExactCache,
  saveToCache,
} from '@/lib/cache';
import type { ProviderResult } from '@/types/search';

const BATCH_SIZE = 1;
const BATCH_DELAY_MS = 500;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedQuestion(query: string): Promise<string | null> {
  const normalized = normalizeQuery(query);
  const queryHash = hashQuery(normalized);

  // Skip if already cached
  const existing = await checkExactCache(queryHash);
  if (existing) return `cached:${existing.cacheId}`;

  // Run all 4 providers in parallel
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
      errorMessage: 'Provider failed during seed',
    };
  });

  const successful = providers.filter((p) => p.status === 'success' && p.text);
  if (successful.length < 2) return null;

  const compiled = await synthesizeResponses(query, providers);
  const requestId = nanoid();

  await persistSearch(requestId, query, providers, compiled, 0, 'seed', 'seed', undefined);

  const embedding = await generateEmbedding(normalized);
  await saveToCache(normalized, queryHash, embedding, compiled, providers);

  return requestId;
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase: ReturnType<typeof getSupabase>;
  try {
    supabase = getSupabase();
  } catch (e) {
    return NextResponse.json({ error: `Supabase init failed: ${String(e)}` }, { status: 500 });
  }

  // Accept optional limit — default 10 per call to stay under Vercel timeout
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body?.limit) || 10, 20);

  // Fetch unseeded questions up to limit
  const { data: questions, error } = await supabase
    .from('curated_questions')
    .select('id, question')
    .is('seeded_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!questions || questions.length === 0) {
    return NextResponse.json({ message: 'All questions already seeded', seeded: 0, failed: 0, remaining: 0 });
  }

  let seeded = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (q) => {
        try {
          const result = await seedQuestion(q.question);
          if (result) {
            await supabase
              .from('curated_questions')
              .update({ seeded_at: new Date().toISOString() })
              .eq('id', q.id);
            seeded++;
          } else {
            failed++;
            failures.push(q.question);
          }
        } catch (err) {
          failed++;
          failures.push(q.question);
          console.error(`Seed failed: ${q.question}`, err);
        }
      })
    );

    if (i + BATCH_SIZE < questions.length) await sleep(BATCH_DELAY_MS);
  }

  const { count: remaining } = await supabase
    .from('curated_questions')
    .select('id', { count: 'exact', head: true })
    .is('seeded_at', null);

  return NextResponse.json({
    seeded,
    failed,
    remaining: remaining ?? 0,
    failures: failures.slice(0, 20),
  });
}
