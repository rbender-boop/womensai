import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || query.length < 4) return NextResponse.json({ questions: [] });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You generate personalized follow-up questions for women asking health, wellness, fitness, or beauty questions. ' +
            'Return ONLY a valid JSON array of 2-3 short, conversational questions. ' +
            'No preamble, no explanation, no markdown fences. ' +
            'Example output: ["How old are you?","Are you currently taking any medications?"]',
        },
        {
          role: 'user',
          content: `Question: "${query}"\n\nGenerate 2-3 follow-up questions that would meaningfully personalize the answer for her specific situation.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    const questions: string[] = JSON.parse(clean);

    if (!Array.isArray(questions)) return NextResponse.json({ questions: [] });
    return NextResponse.json({ questions: questions.slice(0, 3) });
  } catch (err) {
    console.error('[FollowupQuestions] Error:', err);
    return NextResponse.json({ questions: [] });
  }
}
