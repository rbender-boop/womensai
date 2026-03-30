import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import WeirdClient from './client';

const SITE_URL = 'https://www.askwomensai.com';

export const metadata: Metadata = {
  title: "Weird Women's Health Questions \u2014 What Do the AIs Say? | AskWomensAI",
  description:
    "The weird, the wild, and the genuinely curious. Browse 50+ strange women's health questions and see how ChatGPT, Gemini, Claude, and Grok respond.",
  alternates: { canonical: `${SITE_URL}/weird` },
  openGraph: {
    title: "Weird Women's Health Questions | AskWomensAI",
    description: "The weird, the wild, and the genuinely curious \u2014 answered by 4 AIs.",
    url: `${SITE_URL}/weird`,
    siteName: 'AskWomensAI',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'AskWomensAI Weird Questions' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Weird Women's Health Questions | AskWomensAI",
    description: "The weird, the wild, and the genuinely curious \u2014 answered by 4 AIs.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export interface WeirdQuestion {
  id: string;
  slug: string;
  question: string;
  category: string;
  age_group: string | null;
}

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export const revalidate = 86400;

export default async function WeirdPage() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('curated_questions')
    .select('id, slug, question, category, age_group')
    .eq('is_weird', true)
    .order('question', { ascending: true })
    .limit(100);

  const questions: WeirdQuestion[] = data ?? [];
  return <WeirdClient questions={questions} />;
}
