import { createClient } from '@supabase/supabase-js';

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type QuestionOfTheDay = {
  id: string;
  date: string;
  question: string;
  answer: string;
  teaser: string | null;
  category: string | null;
  generated_at: string;
  emailed_at: string | null;
};

// ─── Fetch today's QOTD (used by the banner API route) ───────────────────────

export async function getTodayQotd(): Promise<QuestionOfTheDay | null> {
  const today = todayDate();
  const supabase = getClient();

  const { data, error } = await supabase
    .from('question_of_the_day')
    .select('*')
    .eq('date', today)
    .single();

  if (error || !data) return null;
  return data as QuestionOfTheDay;
}

// ─── Generate + store today's QOTD (called by cron) ─────────────────────────

export async function generateAndStoreQotd(): Promise<QuestionOfTheDay> {
  const today = todayDate();
  const supabase = getClient();

  // Idempotent — skip if already generated today
  const existing = await getTodayQotd();
  if (existing) return existing;

  const { question, answer, teaser, category } = await callClaudeForQotd();

  const { data, error } = await supabase
    .from('question_of_the_day')
    .insert({
      date: today,
      question,
      answer,
      teaser,
      category,
      model_used: 'claude-sonnet-4-20250514',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to store QOTD: ${error?.message}`);
  }

  return data as QuestionOfTheDay;
}

// ─── Get all QOTD subscribers for the daily email ───────────────────────────

export async function getQotdSubscribers(): Promise<string[]> {
  const supabase = getClient();

  // Reuses the existing email_signups table
  const { data, error } = await supabase
    .from('email_signups')
    .select('email');

  if (error || !data) return [];
  return data.map((r: { email: string }) => r.email);
}

// ─── 3-day email cadence check ───────────────────────────────────────────────

export async function shouldSendEmailToday(): Promise<boolean> {
  const supabase = getClient();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data } = await supabase
    .from('question_of_the_day')
    .select('emailed_at')
    .not('emailed_at', 'is', null)
    .gte('emailed_at', threeDaysAgo.toISOString())
    .limit(1);

  return !data || data.length === 0;
}

export async function markAsEmailed(date: string): Promise<void> {
  const supabase = getClient();
  await supabase
    .from('question_of_the_day')
    .update({ emailed_at: new Date().toISOString() })
    .eq('date', date);
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function callClaudeForQotd(): Promise<{
  question: string;
  answer: string;
  teaser: string;
  category: string;
}> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const prompt = `Today is ${today}.

Generate one sharp, practical "Question of the Day" for AskWomensAI — a tool that helps women make better health, wellness, fitness, and beauty decisions by comparing answers from ChatGPT, Gemini, Claude, and Grok.

The question should be:
- Specific to women's health, wellness, fitness, or beauty
- Practical and decision-oriented (not vague or purely informational)
- Something a woman aged 25-55 would genuinely wonder
- Concrete enough to have a real, useful answer

Then write a concise, practical answer (150-200 words) that:
- Leads with a direct answer or recommendation
- Acknowledges nuance or individual variation
- Sounds like a trusted, knowledgeable friend — not clinical, not marketing
- Ends with a suggestion for next steps

Also write a teaser (2-3 sentences, max 60 words) that:
- Hooks the reader with the most surprising or useful insight from the answer
- Does NOT give away the full answer
- Makes the reader want to click to learn more
- Ends with something like "Here's what the top AIs say..." or similar

Return ONLY valid JSON in exactly this format, nothing else:
{
  "question": "...",
  "answer": "...",
  "teaser": "...",
  "category": "one of: hormones | nutrition | fitness | skincare | mental-health | sleep | perimenopause | fertility | general"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? '';

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (!parsed.question || !parsed.answer) throw new Error('Missing fields');
    return {
      question: parsed.question,
      answer: parsed.answer,
      teaser: parsed.teaser ?? '',
      category: parsed.category ?? 'general',
    };
  } catch {
    throw new Error(`Failed to parse QOTD response: ${raw.slice(0, 200)}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function todayDate(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}
