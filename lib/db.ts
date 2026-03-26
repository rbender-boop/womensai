import { createClient } from '@supabase/supabase-js';
import type { ProviderResult, CompiledResult } from '@/types/search';
import { tagQuestion } from '@/lib/ai/tag-question';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Upsert anonymous session ────────────────────────────────────────────────
export async function upsertAnonSession(
  sessionId: string,
  isNew: boolean,
  meta: {
    deviceType?: string;
    acquisitionChannel?: string;
    acquisitionSource?: string;
    acquisitionMedium?: string;
    acquisitionCampaign?: string;
  }
) {
  const supabase = getClient();
  if (!supabase) return;

  if (isNew) {
    await supabase.from('anonymous_sessions').insert({
      id: sessionId,
      device_type: meta.deviceType,
      acquisition_channel: meta.acquisitionChannel,
      acquisition_source: meta.acquisitionSource,
      acquisition_medium: meta.acquisitionMedium,
      acquisition_campaign: meta.acquisitionCampaign,
    });
  } else {
    await supabase
      .from('anonymous_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', sessionId);
  }
}

// ── Persist search ───────────────────────────────────────────────────────────
export async function persistSearch(
  requestId: string,
  query: string,
  providers: ProviderResult[],
  compiled: CompiledResult,
  totalLatencyMs: number,
  ipHash: string,
  sessionId?: string,
  ageRange?: string  // captured from follow-up question for segmentation
) {
  const supabase = getClient();
  if (!supabase) return;

  const successful = providers.filter((p) => p.status === 'success').length;
  const failed = providers.filter((p) => p.status !== 'success').length;

  try {
    await supabase.from('search_requests').insert({
      id: requestId,
      query_text: query,
      query_normalized: query.toLowerCase().trim(),
      ip_hash: ipHash,
      anonymous_session_id: sessionId ?? null,
      status: failed === 0 ? 'success' : successful > 0 ? 'partial_failure' : 'failure',
      total_latency_ms: totalLatencyMs,
      success_provider_count: successful,
      failed_provider_count: failed,
      provider_success_count: successful,
      age_range: ageRange ?? null,
    });

    await supabase.from('provider_results').insert(
      providers.map((p) => ({
        search_request_id: requestId,
        provider_name: p.provider,
        model_name: p.model,
        status: p.status,
        latency_ms: p.latencyMs,
        raw_text: p.text,
        error_message: p.errorMessage,
      }))
    );

    await supabase.from('compiled_results').insert({
      search_request_id: requestId,
      best_answer: compiled.bestAnswer,
      consensus: compiled.consensus,
      disagreements: compiled.disagreements,
      notes: compiled.notes,
      synthesis_model: compiled.synthesisModel,
    });

    if (sessionId) {
      await supabase.rpc('increment_session_question_count', { session_id: sessionId });
    }
  } catch (err) {
    console.error('Supabase persist error:', err);
  }
}

// ── Persist cache hit (lightweight log so admin dashboard counts every question) ──
export async function persistCacheHit(
  requestId: string,
  query: string,
  ipHash: string,
  sessionId?: string,
  totalLatencyMs?: number
) {
  const supabase = getClient();
  if (!supabase) return;

  try {
    await supabase.from('search_requests').insert({
      id: requestId,
      query_text: query,
      query_normalized: query.toLowerCase().trim(),
      ip_hash: ipHash,
      anonymous_session_id: sessionId ?? null,
      status: 'success',
      total_latency_ms: totalLatencyMs ?? 0,
      success_provider_count: 4,
      failed_provider_count: 0,
      provider_success_count: 4,
    });

    if (sessionId) {
      await supabase.rpc('increment_session_question_count', { session_id: sessionId });
    }
  } catch (err) {
    console.error('Supabase cache-hit persist error:', err);
  }
}

// ── Tag and write back ───────────────────────────────────────────────────────
export async function tagAndUpdateSearch(requestId: string, query: string) {
  const supabase = getClient();
  if (!supabase) return;

  try {
    const tags = await tagQuestion(query);

    await supabase
      .from('search_requests')
      .update({
        topic_tags: tags.topic_tags,
        primary_topic: tags.primary_topic,
        life_stage: tags.life_stage,
        category: tags.category,
        sentiment: tags.sentiment,
      })
      .eq('id', requestId);
  } catch (err) {
    console.error('Tag update error:', err);
  }
}
