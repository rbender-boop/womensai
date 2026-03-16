import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROVIDER_PROMPT_TEMPLATE } from '@/lib/ai/prompts';
import { PROVIDER_TIMEOUT_MS, PROVIDER_MAX_TOKENS } from '@/lib/ai/types';
import type { ProviderResult } from '@/types/search';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const ENABLED = process.env.ENABLE_GEMINI !== 'false';

export async function runGemini(query: string): Promise<ProviderResult> {
  const base: ProviderResult = {
    provider: 'gemini',
    label: 'Gemini',
    model: MODEL,
    status: 'error',
  };

  if (!ENABLED || !process.env.GEMINI_API_KEY) {
    return { ...base, status: 'disabled', errorMessage: 'Gemini disabled or API key missing' };
  }

  const start = Date.now();

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { maxOutputTokens: PROVIDER_MAX_TOKENS },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), PROVIDER_TIMEOUT_MS)
    );

    const resultPromise = model.generateContent(PROVIDER_PROMPT_TEMPLATE(query));
    const result = await Promise.race([resultPromise, timeoutPromise]);

    const text = result.response.text();

    return {
      ...base,
      status: 'success',
      text,
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.message === 'Gemini timeout';
    return {
      ...base,
      status: isTimeout ? 'timeout' : 'error',
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
