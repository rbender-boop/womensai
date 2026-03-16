import Anthropic from '@anthropic-ai/sdk';
import { PROVIDER_PROMPT_TEMPLATE } from '@/lib/ai/prompts';
import { PROVIDER_TIMEOUT_MS, PROVIDER_MAX_TOKENS } from '@/lib/ai/types';
import type { ProviderResult } from '@/types/search';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const ENABLED = process.env.ENABLE_ANTHROPIC !== 'false';

export async function runAnthropic(query: string): Promise<ProviderResult> {
  const base: ProviderResult = {
    provider: 'claude',
    label: 'Claude',
    model: MODEL,
    status: 'error',
  };

  if (!ENABLED || !process.env.ANTHROPIC_API_KEY) {
    return { ...base, status: 'disabled', errorMessage: 'Anthropic disabled or API key missing' };
  }

  const start = Date.now();

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: PROVIDER_MAX_TOKENS,
        messages: [{ role: 'user', content: PROVIDER_PROMPT_TEMPLATE(query) }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timer);

    const textBlock = response.content.find((b) => b.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '';
    const usage = response.usage;

    return {
      ...base,
      status: 'success',
      text,
      latencyMs: Date.now() - start,
      promptTokensEst: usage?.input_tokens,
      completionTokensEst: usage?.output_tokens,
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
