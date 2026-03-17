import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PROVIDER_PROMPT_TEMPLATE } from '@/lib/ai/prompts';
import { PROVIDER_TIMEOUT_MS, PROVIDER_MAX_TOKENS } from '@/lib/ai/types';
import type { ProviderResult } from '@/types/search';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ENABLED = process.env.ENABLE_GEMINI !== 'false';

// Lower safety thresholds so women's health content isn't blocked
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export async function runGemini(query: string): Promise<ProviderResult> {
  const base: ProviderResult = {
    provider: 'gemini',
    label: 'Gemini',
    model: MODEL,
    status: 'error',
  };

  if (!ENABLED) {
    return { ...base, status: 'disabled', errorMessage: 'Gemini disabled via env flag' };
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('[Gemini] GEMINI_API_KEY is not set');
    return { ...base, status: 'disabled', errorMessage: 'Gemini API key missing' };
  }

  const start = Date.now();

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { maxOutputTokens: PROVIDER_MAX_TOKENS },
      safetySettings: SAFETY_SETTINGS,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), PROVIDER_TIMEOUT_MS)
    );

    const resultPromise = model.generateContent(PROVIDER_PROMPT_TEMPLATE(query));
    const result = await Promise.race([resultPromise, timeoutPromise]);

    // Check if response was blocked by safety filters
    const candidate = result.response.candidates?.[0];
    if (!candidate || candidate.finishReason === 'SAFETY') {
      console.error('[Gemini] Response blocked by safety filters for query:', query);
      return {
        ...base,
        status: 'error',
        latencyMs: Date.now() - start,
        errorMessage: 'Response blocked by Gemini safety filters',
      };
    }

    const text = result.response.text();

    if (!text || text.trim().length === 0) {
      console.error('[Gemini] Empty response for query:', query);
      return {
        ...base,
        status: 'error',
        latencyMs: Date.now() - start,
        errorMessage: 'Gemini returned empty response',
      };
    }

    return {
      ...base,
      status: 'success',
      text,
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.message === 'Gemini timeout';
    console.error('[Gemini] Error:', err instanceof Error ? err.message : err);
    return {
      ...base,
      status: isTimeout ? 'timeout' : 'error',
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
