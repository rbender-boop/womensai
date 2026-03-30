import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import QuestionPageClient from './client';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.askwomensai.com';

interface CuratedQuestion {
  id: string;
  slug: string;
  question: string;
  category: string;
  age_group: string | null;
  is_weird: boolean;
  is_featured: boolean;
  search_request_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface CompiledResult {
  bestAnswer: string;
  consensus: string[];
  disagreements: string[];
  notes: string;
}

interface FullContent {
  teaser: string;
  bestAnswer: string;
  consensus: string[];
  disagreements: string[];
}

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

async function getQuestion(slug: string): Promise<CuratedQuestion | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('curated_questions')
    .select('*')
    .eq('slug', slug)
    .single();
  return data ?? null;
}

async function getFullContent(searchRequestId: string): Promise<FullContent | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('compiled_results')
    .select('best_answer, consensus, disagreements')
    .eq('search_request_id', searchRequestId)
    .single();
  if (!data?.best_answer) return null;

  const rawAnswer = typeof data.best_answer === 'string'
    ? data.best_answer
    : (data.best_answer as CompiledResult).bestAnswer ?? '';

  const consensus: string[] = Array.isArray(data.consensus)
    ? data.consensus
    : typeof data.consensus === 'object' && data.consensus !== null
      ? Object.values(data.consensus)
      : [];

  const disagreements: string[] = Array.isArray(data.disagreements)
    ? data.disagreements
    : typeof data.disagreements === 'object' && data.disagreements !== null
      ? Object.values(data.disagreements)
      : [];

  const sentences = rawAnswer.match(/[^.!?]+[.!?]+/g) ?? [];
  const teaser = sentences.slice(0, 2).join(' ').trim() || rawAnswer.slice(0, 220);

  return { teaser, bestAnswer: rawAnswer, consensus, disagreements };
}

export async function generateStaticParams() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('curated_questions')
    .select('slug')
    .limit(600);
  return (data ?? []).map((q) => ({ slug: q.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const q = await getQuestion(slug);
  if (!q) return { title: 'Question Not Found' };

  const title = q.meta_title ?? `${q.question} | AskWomensAI`;
  const description = q.meta_description ??
    `4 AIs answer: ${q.question} \u2014 ChatGPT, Gemini, Claude & Grok consensus + where they disagree.`;
  const url = `${SITE_URL}/q/${slug}`;
  const ogImageUrl = `${SITE_URL}/q/${slug}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'AskWomensAI',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: q.question,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function QuestionPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const q = await getQuestion(slug);
  if (!q) notFound();

  const content = q.search_request_id
    ? await getFullContent(q.search_request_id)
    : null;

  const url = `${SITE_URL}/q/${slug}`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: content?.bestAnswer ?? `See what ChatGPT, Gemini, Claude, and Grok say about: ${q.question}`,
      },
    }],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: `${SITE_URL}/questions` },
      { '@type': 'ListItem', position: 3, name: q.question, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <QuestionPageClient
        question={q}
        teaser={content?.teaser ?? null}
        bestAnswer={content?.bestAnswer ?? null}
        consensus={content?.consensus ?? []}
        disagreements={content?.disagreements ?? []}
      />
    </>
  );
}
