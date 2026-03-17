import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import QuestionsClient from './client';

export const metadata: Metadata = {
  title: "Women's Health Questions — Answered by ChatGPT, Gemini, Claude & Grok | AskWomensAI",
  description:
    "Browse 500+ women's health, fitness, wellness, and beauty questions answered by four major AIs. See where ChatGPT, Gemini, Claude, and Grok agree — and where they differ.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL}/questions` },
  openGraph: {
    title: "Women's Health Questions | AskWomensAI",
    description: "Browse 500+ questions answered by ChatGPT, Gemini, Claude, and Grok.",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/questions`,
  },
};

export interface CuratedQuestion {
  id: string;
  slug: string;
  question: string;
  category: string;
  age_group: string | null;
  is_weird: boolean;
  is_featured: boolean;
}

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export const revalidate = 86400;

export default async function QuestionsPage() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('curated_questions')
    .select('id, slug, question, category, age_group, is_weird, is_featured')
    .eq('is_weird', false)
    .order('category', { ascending: true })
    .order('question', { ascending: true })
    .limit(600);

  const questions: CuratedQuestion[] = data ?? [];
  return <QuestionsClient questions={questions} />;
}
