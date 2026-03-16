/**
 * scripts/seed-cache.ts
 *
 * Pre-seeds the 6 homepage example questions so users never trigger
 * a live API call when clicking those prompts.
 *
 * Run ONCE after Supabase is configured:
 *   npx tsx scripts/seed-cache.ts
 *
 * Requires .env.local with all API keys set.
 */

import 'dotenv/config';
import { normalizeQuery, hashQuery, generateEmbedding, saveToCache, checkExactCache } from '../lib/cache';
import { runOpenAI } from '../lib/ai/providers/openai';
import { runAnthropic } from '../lib/ai/providers/anthropic';
import { runGemini } from '../lib/ai/providers/gemini';
import { runGrok } from '../lib/ai/providers/grok';
import { synthesizeResponses } from '../lib/ai/synthesize';

const EXAMPLE_QUESTIONS = [
  'What are the best natural ways to manage PCOS symptoms?',
  'Is it safe to take melatonin every night long-term?',
  'What are signs of perimenopause vs regular PMS?',
  'How do I talk to my doctor about getting my hormones tested?',
  'What are the early warning signs of breast cancer I should watch for?',
  'What body changes are normal for girls going through puberty?',
];

async function seedQuestion(query: string) {
  const normalized = normalizeQuery(query);
  const queryHash = hashQuery(normalized);

  const existing = await checkExactCache(queryHash);
  if (existing) {
    console.log(`⏭  Already cached: "${query.slice(0, 60)}"`);
    return;
  }

  console.log(`🔄 Fetching: "${query.slice(0, 60)}"`);

  const settled = await Promise.allSettled([
    runOpenAI(query),
    runGemini(query),
    runAnthropic(query),
    runGrok(query),
  ]);

  const providers = settled.map((r) => {
    if (r.status === 'fulfilled') return r.value;
    return { provider: 'chatgpt' as const, label: 'Unknown', model: 'unknown', status: 'error' as const, errorMessage: 'Failed' };
  });

  const successful = providers.filter((p) => p.status === 'success' && p.text);
  if (successful.length < 2) {
    console.warn(`⚠️  Not enough providers responded for: "${query.slice(0, 50)}"`);
    return;
  }

  const compiled = await synthesizeResponses(query, providers);
  const embedding = await generateEmbedding(normalized);

  await saveToCache(normalized, queryHash, embedding, compiled, providers);
  console.log(`✅ Seeded: "${query.slice(0, 60)}"`);
}

async function main() {
  console.log('🌱 Seeding AskWomensAI example question cache...\n');
  for (const q of EXAMPLE_QUESTIONS) {
    await seedQuestion(q);
    // Small delay between questions to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log('\n✅ Done. All example questions are now cached.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
