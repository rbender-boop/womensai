'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';

interface CuratedQuestion {
  id: string;
  slug: string;
  question: string;
  category: string;
  age_group: string | null;
  is_weird: boolean;
  search_request_id: string | null;
}

interface Props {
  question: CuratedQuestion;
  teaser: string | null;
  bestAnswer: string | null;
  consensus: string[];
  disagreements: string[];
}

export default function QuestionPageClient({ question, teaser, bestAnswer, consensus, disagreements }: Props) {
  const router = useRouter();

  function handleSeeAnswer() {
    const q = encodeURIComponent(question.question);
    router.push(`/results/new?q=${q}&from_slug=${question.slug}`);
  }

  const isWeird = question.is_weird;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}
    >
      <style>{`
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .q-hero { animation: floatIn 0.7s ease both; }
        .q-card { animation: floatIn 0.7s ease 0.15s both; }
        .q-cta  { animation: floatIn 0.7s ease 0.28s both; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(212,167,185,0.25)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(253,245,248,0.82)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 700, color: '#1C1714' }}>AskWomens</span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 700, color: '#8B3058', fontStyle: 'italic' }}>AI</span>
          </a>
          <nav className="hidden sm:flex items-center gap-7 text-sm" style={{ color: '#7A6E67' }}>
            <a href="/questions">Questions</a>
            <a href="/weird">Weird Questions</a>
            <a href="/about">About</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-2xl">

          {/* Category pill */}
          <div className="q-hero flex items-center gap-2 mb-8">
            <a
              href="/questions"
              className="text-xs font-medium px-4 py-1.5 rounded-full"
              style={{
                background: isWeird ? 'rgba(139,48,88,0.08)' : 'rgba(155,65,99,0.07)',
                border: '1px solid rgba(155,65,99,0.18)',
                color: '#8B3058',
              }}
            >
              {isWeird ? '🤔 Weird Questions' : question.category}
            </a>
            <span style={{ color: '#AFA8A2', fontSize: '12px' }}>·</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: '#AFA8A2' }}>
              <Sparkles size={10} />
              ChatGPT · Gemini · Claude · Grok
            </span>
          </div>

          {/* Question heading */}
          <h1
            className="q-hero mb-10"
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(28px, 5vw, 46px)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#1C1714',
              letterSpacing: '-0.3px',
            }}
          >
            {question.question}
          </h1>

          {/* Teaser card */}
          <div
            className="q-card rounded-3xl p-8 mb-8"
            style={{
              background: 'rgba(255,255,255,0.80)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(212,167,185,0.35)',
              boxShadow: '0 4px 30px rgba(139,48,88,0.07)',
            }}
          >
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#9B4163', letterSpacing: '2.5px' }}>
              What the AIs say
            </p>

            {teaser ? (
              <>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#3A342F' }}>
                  {teaser}
                </p>
                {/* Fade blur gate */}
                <div
                  className="relative overflow-hidden rounded-xl mb-6"
                  style={{ height: '72px' }}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(90deg, rgba(180,160,170,0.15) 0px, rgba(180,160,170,0.08) 4px, transparent 4px, transparent 12px)',
                    filter: 'blur(1px)',
                    borderRadius: '12px',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.97) 100%)',
                  }} />
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                    <Lock size={12} style={{ color: '#AFA8A2' }} />
                    <span className="text-xs" style={{ color: '#AFA8A2' }}>Full answer · Consensus · Disagreements below</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-base leading-relaxed mb-6" style={{ color: '#7A6E67' }}>
                We&apos;ve asked ChatGPT, Gemini, Claude, and Grok this question. See where they agree — and where they differ.
              </p>
            )}

            {/* CTA button */}
            <button
              onClick={handleSeeAnswer}
              className="q-cta w-full flex items-center justify-center gap-2 text-sm font-semibold py-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(139,48,88,0.32)',
                transition: 'box-shadow 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(139,48,88,0.44)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,48,88,0.32)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              See what 4 AIs actually say
              <ArrowRight size={15} />
            </button>

            <p className="mt-4 text-center text-xs" style={{ color: '#AFA8A2' }}>
              Free · No account required · Best Answer + Consensus + Disagreements
            </p>
          </div>

          {/* Related prompt */}
          <div className="q-cta text-center">
            <p className="text-sm mb-3" style={{ color: '#7A6E67' }}>Have a different question?</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1.5px solid rgba(212,167,185,0.45)',
                color: '#8B3058',
                backdropFilter: 'blur(8px)',
              }}
            >
              Ask your own question
              <ArrowRight size={13} />
            </a>
          </div>

          {/* Visually hidden full answer — visible to Google, invisible to users */}
          {bestAnswer && (
            <div aria-hidden="true" style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}>
              <h2>Best Answer</h2>
              <p>{bestAnswer}</p>
              {consensus.length > 0 && (
                <>
                  <h2>Where the AIs Agree</h2>
                  <ul>{consensus.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </>
              )}
              {disagreements.length > 0 && (
                <>
                  <h2>Where the AIs Disagree</h2>
                  <ul>{disagreements.map((d, i) => <li key={i}>{d}</li>)}</ul>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(212,167,185,0.25)', background: 'rgba(253,245,248,0.7)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#7A6E67' }}>
          <div className="flex items-center">
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#1C1714' }}>AskWomens</span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#8B3058', fontStyle: 'italic' }}>AI</span>
            <span className="ml-2 text-xs" style={{ color: '#AFA8A2' }}>© 2025</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/questions" style={{ fontSize: '12px', color: '#7A6E67' }}>Questions</a>
            <a href="/weird" style={{ fontSize: '12px', color: '#7A6E67' }}>Weird Questions</a>
            <a href="/privacy" style={{ fontSize: '12px', color: '#7A6E67' }}>Privacy</a>
          </div>
          <p className="text-xs" style={{ color: '#AFA8A2' }}>For research only. Always consult a qualified healthcare provider.</p>
        </div>
      </footer>
    </div>
  );
}
