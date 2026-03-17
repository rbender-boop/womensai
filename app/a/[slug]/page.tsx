import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Sparkles, CheckCheck, GitFork } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface SlugData {
  query_text: string;
  result_snapshot: {
    compiled: {
      bestAnswer: string;
      consensus: string[];
      disagreements: string[];
      notes?: string;
    };
    providers: Array<{ provider: string; label: string; status: string }>;
  };
}

export default async function SharedResultPage({ params }: { params: { slug: string } }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) notFound();

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('share_events')
    .select('query_text, result_snapshot')
    .eq('slug', params.slug)
    .maybeSingle();

  if (error || !data?.result_snapshot) notFound();

  const { compiled, providers } = (data as SlugData).result_snapshot;
  const query = (data as SlugData).query_text;
  const successCount = providers?.filter((p) => p.status === 'success').length ?? 4;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid #EDE8E3' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="font-serif font-bold text-warm-black">AskWomens</span>
            <span className="font-serif font-bold" style={{ color: '#9B4163' }}>AI</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold px-5 py-2 rounded-xl transition-all"
            style={{ background: '#9B4163', color: '#fff' }}
          >
            Ask your question →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {/* Shared badge */}
        <div>
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: '#F7ECF0', color: '#9B4163', border: '1px solid #E8C4D0' }}
          >
            Shared answer
          </span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl px-5 py-4" style={{ border: '1px solid #EDE8E3' }}>
          <p className="text-xs text-warm-muted mb-1.5 font-medium uppercase tracking-widest">Question</p>
          <p className="text-base text-warm-black font-medium leading-relaxed">{query}</p>
        </div>

        {/* Best Answer */}
        {compiled?.bestAnswer && (
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#9B4163' }}>
                <Sparkles size={13} style={{ color: '#fff' }} />
              </div>
              <h2 className="font-semibold text-warm-black">Best Answer</h2>
              <span className="text-xs text-warm-muted ml-auto">Synthesized from {successCount} AIs</span>
            </div>
            <p className="text-sm text-warm-gray leading-relaxed whitespace-pre-wrap">{compiled.bestAnswer}</p>
          </div>
        )}

        {/* Consensus */}
        {compiled?.consensus?.length > 0 && (
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6EF', border: '1px solid #C2D9C0' }}>
                <CheckCheck size={13} style={{ color: '#2F6B2B' }} />
              </div>
              <h2 className="font-semibold text-warm-black">Consensus</h2>
            </div>
            <ul className="space-y-2.5">
              {compiled.consensus.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-warm-gray">
                  <span className="mt-0.5 shrink-0 text-xs" style={{ color: '#4A9645' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disagreements */}
        {compiled?.disagreements?.length > 0 && (
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FDF6EC', border: '1px solid #EDD8B0' }}>
                <GitFork size={13} style={{ color: '#8A5E1A' }} />
              </div>
              <h2 className="font-semibold text-warm-black">Disagreements</h2>
            </div>
            <ul className="space-y-2.5">
              {compiled.disagreements.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-warm-gray">
                  <span className="mt-0.5 shrink-0" style={{ color: '#B08030' }}>≠</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div
          className="bg-white rounded-2xl p-8 text-center"
          style={{ border: '1px solid #E8C4D0', background: 'linear-gradient(135deg, #FDF0F6 0%, #FAF7F5 100%)' }}
        >
          <p className="font-serif font-semibold text-warm-black text-xl mb-2">Ask your own question</p>
          <p className="text-sm text-warm-muted mb-6">Get ChatGPT, Gemini, Claude, and Grok — all in one answer. Free.</p>
          <Link
            href="/"
            className="inline-block px-8 py-3.5 rounded-xl text-sm font-semibold"
            style={{ background: '#9B4163', color: '#fff' }}
          >
            Try AskWomensAI free →
          </Link>
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-2xl px-5 py-4 text-sm leading-relaxed"
          style={{ background: '#F7ECF0', border: '1px solid #E8C4D0', color: '#7A3050' }}
        >
          <strong>Important:</strong> These responses are from AI models for informational purposes only. They do not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
        </div>
      </main>
    </div>
  );
}
