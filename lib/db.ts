import { createClient } from '@supabase/supabase-js';
import type { ProviderResult, CompiledResult } from '@/types/search';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function persistSearch(
  requestId: string,
  query: string,
  providers: ProviderResult[],
  compiled: CompiledResult,
  totalLatencyMs: number,
  ipHash: string
) {
  const supabase = getClient();
  if (!supabase) return; // silently skip if Supabase not configured

  const successful = providers.filter((p) => p.status === 'success').length;
  const failed = providers.filter((p) => p.status !== 'success').length;

  try {
    await supabase.from('search_requests').insert({
      id: requestId,
      query_text: query,
      ip_hash: ipHash,
      status: failed === 0 ? 'success' : successful > 0 ? 'partial_failure' : 'failure',
      total_latency_ms: totalLatencyMs,
      success_provider_count: successful,
      failed_provider_count: failed,
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
  } catch (err) {
    console.error('Supabase persist error:', err);
  }
}
