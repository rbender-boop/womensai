import OpenAI from 'openai';
import { PROVIDER_PROMPT_TEMPLATE } from '@/lib/ai/prompts';
import { PROVIDER_TIMEOUT_MS, PROVIDER_MAX_TOKENS } from '@/lib/ai/types';
import type { ProviderResult } from '@/types/search';

const MODEL = process.env.XAI_MODEL || 'grok-3-mini';
const ENABLED = process.env.ENABLE_XAI !== 'false';

export async function runGrok(query: string): Promise<ProviderResult> {
  const base: ProviderResult = {
    provider: 'grok',
    label: 'Grok',
    model: MODEL,
    status: 'error',
  };

  if (!ENABLED || !process.env.XAI_API_KEY) {
    return { ...base, status: 'disabled', errorMessage: 'Grok disabled or API key missing' };
  }

  const start = Date.now();

  try {
    // xAI uses OpenAI-compatible SDK
    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    const response = await client.chat.completions.create(
      {
        model: MODEL,
        max_tokens: PROVIDER_MAX_TOKENS,
        messages: [{ role: 'user', content: PROVIDER_PROMPT_TEMPLATE(query) }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timer);

    const text = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;

    return {
      ...base,
      status: 'success',
      text,
      latencyMs: Date.now() - start,
      promptTokensEst: usage?.prompt_tokens,
      completionTokensEst: usage?.completion_tokens,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ...base,
      status: isTimeout ? 'timeout' : 'error',
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
