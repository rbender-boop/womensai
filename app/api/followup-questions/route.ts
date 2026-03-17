import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 5-year age range options shown as pill chips in the UI
export const AGE_RANGES = [
  'Under 18',
  '18–24',
  '25–29',
  '30–34',
  '35–39',
  '40–44',
  '45–49',
  '50–54',
  '55–59',
  '60+',
];

// Topics where age is clearly relevant to the answer
const AGE_RELEVANT_KEYWORDS = [
  'tired', 'fatigue', 'energy', 'sleep', 'hormone', 'period', 'cycle', 'menopause',
  'perimenopause', 'pcos', 'fertility', 'pregnant', 'pregnancy', 'weight', 'metabolism',
  'skin', 'hair', 'acne', 'thyroid', 'anxiety', 'mood', 'depression', 'supplement',
  'vitamin', 'exercise', 'workout', 'libido', 'sex', 'birth control', 'contraception',
  'bone', 'muscle', 'joint', 'pain', 'inflammation', 'diet', 'nutrition', 'collagen',
  'estrogen', 'progesterone', 'testosterone', 'cortisol', 'insulin', 'blood sugar',
  'heart', 'cholesterol', 'blood pressure', 'cancer', 'screening', 'mammogram',
];

function isAgeRelevant(query: string): boolean {
  const q = query.toLowerCase();
  return AGE_RELEVANT_KEYWORDS.some((kw) => q.includes(kw));
}

export interface FollowupQuestion {
  id: string;
  question: string;
  type: 'age_range' | 'text';
  options?: string[]; // only for age_range
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || query.length < 4) return NextResponse.json({ questions: [] });

    const questions: FollowupQuestion[] = [];

    // Always inject age first when the topic benefits from it
    if (isAgeRelevant(query)) {
      questions.push({
        id: 'age',
        question: 'What is your age range?',
        type: 'age_range',
        options: AGE_RANGES,
      });
    }

    // Get 1-2 additional AI-generated contextual questions
    const maxAiQuestions = questions.length > 0 ? 2 : 3;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You generate personalized follow-up questions for women asking health, wellness, fitness, or beauty questions. ' +
              `Return ONLY a valid JSON array of ${maxAiQuestions} short, conversational questions. ` +
              'Do NOT ask about age — that is already handled. ' +
              'No preamble, no explanation, no markdown fences. ' +
              'Example output: ["Are you currently taking any medications?","How many hours of sleep do you typically get?"]',
          },
          {
            role: 'user',
            content: `Question: "${query}"\n\nGenerate ${maxAiQuestions} follow-up questions that would meaningfully personalize the answer for her specific situation. Do not ask about age.`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
      const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
      const aiQuestions: string[] = JSON.parse(clean);

      if (Array.isArray(aiQuestions)) {
        aiQuestions.slice(0, maxAiQuestions).forEach((q, i) => {
          questions.push({ id: `q${i}`, question: q, type: 'text' });
        });
      }
    } catch (err) {
      console.error('[FollowupQuestions] AI error:', err);
      // Age question still returns even if AI call fails
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('[FollowupQuestions] Error:', err);
    return NextResponse.json({ questions: [] });
  }
}
