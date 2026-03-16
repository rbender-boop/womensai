import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { SYNTHESIS_PROMPT_TEMPLATE } from '@/lib/ai/prompts';
import { SYNTHESIS_MAX_TOKENS } from '@/lib/ai/types';
import type { ProviderResult, CompiledResult } from '@/types/search';

function parseSynthesisOutput(raw: string): Omit<CompiledResult, 'synthesisModel'> {
  const extract = (tag: string): string => {
    const regex = new RegExp(`${tag}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, 'i');
    const match = raw.match(regex);
    return match ? match[1].trim() : '';
  };

  const parseBullets = (section: string): string[] => {
    return section
      .split('\n')
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  };

  return {
    bestAnswer: extract('BEST_ANSWER'),
    consensus: parseBullets(extract('CONSENSUS')),
    disagreements: parseBullets(extract('DISAGREEMENTS')),
    notes: extract('NOTES'),
  };
}

export async function synthesizeResponses(
  query: string,
  providerResults: ProviderResult[]
): Promise<CompiledResult> {
  const successful = providerResults.filter((r) => r.status === 'success' && r.text);
  const responses = successful.map((r) => ({ label: r.label, text: r.text! }));

  const prompt = SYNTHESIS_PROMPT_TEMPLATE(query, responses);
  const provider = process.env.SYNTHESIS_PROVIDER || 'anthropic';
  const model = process.env.SYNTHESIS_MODEL || 'claude-sonnet-4-6';

  try {
    let raw = '';

    if (provider === 'anthropic') {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model,
        max_tokens: SYNTHESIS_MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = response.content.find((b) => b.type === 'text');
      raw = block?.type === 'text' ? block.text : '';
    } else {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({
        model,
        max_tokens: SYNTHESIS_MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = response.choices[0]?.message?.content ?? '';
    }

    return { ...parseSynthesisOutput(raw), synthesisModel: model };
  } catch (err) {
    return {
      bestAnswer: 'Synthesis unavailable — please review the individual responses below.',
      consensus: [],
      disagreements: [],
      notes: `Synthesis failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      synthesisModel: model,
    };
  }
}
