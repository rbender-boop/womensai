'use client';

import { ArrowRight, Share2 } from 'lucide-react';
import type { WeirdQuestion } from './page';

interface Props { questions: WeirdQuestion[]; }

function ShareButtons({ question, slug }: { question: string; slug: string }) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.askwomensai.com'}/q/${slug}`;
  const text = `"${question}" — I asked 4 AIs. The answers are wild 👀`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;

  return (
    <div className="flex items-center gap-2 mt-3">
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(0,0,0,0.05)', color: '#555', border: '1px solid rgba(0,0,0,0.08)', textDecoration: 'none' }}>
        <Share2 size={10} />
        X
      </a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(37,211,102,0.08)', color: '#1a8a3c', border: '1px solid rgba(37,211,102,0.2)', textDecoration: 'none' }}>
        <Share2 size={10} />
        WhatsApp
      </a>
    </div>
  );
}

export default function WeirdClient({ questions }: Props) {
  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>
      <style>{`
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .w-in  { animation: floatIn 0.7s ease both; }
        .w-card { transition: box-shadow 0.2s, transform 0.15s; }
        .w-card:hover { box-shadow: 0 10px 40px rgba(139,48,88,0.15) !important; transform: translateY(-3px); }
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
            <a href="/questions">All questions</a>
            <a href="/" className="text-sm font-semibold px-5 py-2.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)', color: '#fff', boxShadow: '0 2px 14px rgba(139,48,88,0.28)' }}>
              Ask your own
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16">

        {/* Page heading */}
        <div className="w-in text-center mb-14">
          <p className="text-4xl mb-4">🤔</p>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700, lineHeight: 1.08, color: '#1C1714', letterSpacing: '-0.3px',
          }}>
            The weird questions.
            <br />
            <em style={{ color: '#9B4163', fontStyle: 'italic' }}>The ones you actually wondered.</em>
          </h1>
          <p className="mt-5 mx-auto" style={{ fontSize: '16px', color: '#7A6E67', maxWidth: '480px', lineHeight: 1.75 }}>
            {questions.length} questions you were too afraid to Google. We asked all four AIs so you don&apos;t have to.
          </p>
        </div>

        {/* Questions — large text list style */}
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="w-card rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(212,167,185,0.32)',
                boxShadow: '0 2px 16px rgba(139,48,88,0.06)',
                animationDelay: `${Math.min(i * 0.03, 0.5)}s`,
              }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <a href={`/q/${q.slug}`} style={{ textDecoration: 'none' }}>
                    <p style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: 'clamp(16px, 2.5vw, 20px)',
                      fontWeight: 600, color: '#1C1714', lineHeight: 1.4,
                    }}>
                      {q.question}
                    </p>
                  </a>
                  <ShareButtons question={q.question} slug={q.slug} />
                </div>
                <a href={`/q/${q.slug}`}
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold mt-1"
                  style={{ color: '#9B4163', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  See answers <ArrowRight size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA at bottom */}
        <div className="text-center mt-16">
          <p className="text-sm mb-4" style={{ color: '#7A6E67' }}>Have a weird question of your own?</p>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)',
              color: '#fff', boxShadow: '0 4px 18px rgba(139,48,88,0.32)', textDecoration: 'none',
            }}>
            Ask all 4 AIs <ArrowRight size={13} />
          </a>
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
          <div className="flex items-center gap-6">
            <a href="/questions" style={{ fontSize: '12px' }}>Questions</a>
            <a href="/weird" style={{ fontSize: '12px' }}>Weird Questions</a>
            <a href="/privacy" style={{ fontSize: '12px' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: '12px' }}>Terms</a>
            <a href="/about" style={{ fontSize: '12px' }}>About</a>
          </div>
          <p className="text-xs" style={{ color: '#AFA8A2' }}>For research only. Always consult a qualified healthcare provider.</p>
        </div>
      </footer>
    </div>
  );
}
