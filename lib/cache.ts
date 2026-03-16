import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { createHash } from 'crypto';
import type { ProviderResult, CompiledResult } from '@/types/search';

// ─── Supabase client (service role for cache reads/writes) ───────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── OpenAI embeddings client ────────────────────────────────────────────────

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

// ─── Normalize query for consistent hashing ──────────────────────────────────

export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ─── SHA-256 hash for exact match lookup ─────────────────────────────────────

export function hashQuery(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

// ─── Generate embedding via OpenAI text-embedding-3-small ────────────────────

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const openai = getOpenAI();
    if (!openai) return null;
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0]?.embedding ?? null;
  } catch (err) {
    console.error('Embedding generation failed:', err);
    return null;
  }
}

// ─── Cache result shape returned to route ────────────────────────────────────

export interface CacheHit {
  compiled: CompiledResult;
  providers: ProviderResult[];
  cacheId: string;
  queryText: string;
  similarity?: number; // undefined = exact match
}

// ─── 1. Exact match check ─────────────────────────────────────────────────────

export async function checkExactCache(queryHash: string): Promise<CacheHit | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('query_cache')
    .select('id, query_text, compiled, providers')
    .eq('query_hash', queryHash)
    .single();

  if (error || !data) return null;

  // fire-and-forget hit count increment
  void Promise.resolve(supabase.rpc('increment_cache_hits', { cache_id: data.id }));

  return {
    compiled: data.compiled as CompiledResult,
    providers: data.providers as ProviderResult[],
    cacheId: data.id,
    queryText: data.query_text,
  };
}

// ─── 2. Semantic similarity check ────────────────────────────────────────────

export async function checkSemanticCache(
  embedding: number[],
  threshold = 0.92
): Promise<CacheHit | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('match_query_cache', {
    query_embedding: embedding,
    similarity_threshold: threshold,
    match_count: 1,
  });

  if (error || !data || data.length === 0) return null;

  const row = data[0];

  // fire-and-forget hit count increment
  void Promise.resolve(supabase.rpc('increment_cache_hits', { cache_id: row.id }));

  return {
    compiled: row.compiled as CompiledResult,
    providers: row.providers as ProviderResult[],
    cacheId: row.id,
    queryText: row.query_text,
    similarity: row.similarity,
  };
}

// ─── 3. Save to cache ─────────────────────────────────────────────────────────

export async function saveToCache(
  queryText: string,
  queryHash: string,
  embedding: number[] | null,
  compiled: CompiledResult,
  providers: ProviderResult[]
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('query_cache').upsert(
      {
        query_hash: queryHash,
        query_text: queryText,
        embedding: embedding,
        compiled: compiled,
        providers: providers,
      },
      { onConflict: 'query_hash' }
    );
  } catch (err) {
    console.error('Cache save failed:', err);
  }
}
