'use client';

import { useState, useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { CuratedQuestion } from './page';

const CATEGORIES = [
  'All',
  'Health & Body',
  'Hormones & Menopause',
  'Fitness & Exercise',
  'Nutrition & Diet',
  'Mental Health',
  'Relationships',
  'Sex & Intimacy',
  'Pregnancy & Fertility',
  'Parenting',
  'Skin, Hair & Beauty',
  'Career & Money',
];

const AGE_GROUPS = ['All ages', '18–24', '25–34', '35–44', '45–54', '55+'];

interface Props { questions: CuratedQuestion[]; }

export default function QuestionsClient({ questions }: Props) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAge, setActiveAge] = useState('All ages');

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const catMatch = activeCategory === 'All' || q.category === activeCategory;
      const ageMatch = activeAge === 'All ages' || q.age_group === activeAge;
      return catMatch && ageMatch;
    });
  }, [questions, activeCategory, activeAge]);

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>
      <style>{`
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .q-in { animation: floatIn 0.7s ease both; }
        .q-card-hover { transition: box-shadow 0.2s, transform 0.15s; }
        .q-card-hover:hover {
          box-shadow: 0 8px 36px rgba(139,48,88,0.13) !important;
          transform: translateY(-2px);
        }
        .cat-pill { transition: all 0.15s ease; cursor: pointer; }
        .age-chip { transition: all 0.15s ease; cursor: pointer; }
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
            <a href="/about">About</a>
            <a href="/" className="text-sm font-semibold px-5 py-2.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)', color: '#fff', boxShadow: '0 2px 14px rgba(139,48,88,0.28)' }}>
              Ask a question
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-16">

        {/* Page heading */}
        <div className="q-in text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-5 py-2 rounded-full mb-6"
            style={{ background: 'rgba(155,65,99,0.07)', border: '1px solid rgba(155,65,99,0.18)', color: '#8B3058' }}>
            <Sparkles size={11} />
            ChatGPT · Gemini · Claude · Grok
          </div>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 700, lineHeight: 1.1, color: '#1C1714', letterSpacing: '-0.3px',
          }}>
            Women&apos;s Health Questions
          </h1>
          <p className="mt-4 mx-auto" style={{ fontSize: '16px', color: '#7A6E67', maxWidth: '500px', lineHeight: 1.75 }}>
            Browse {questions.length}+ questions answered by all four major AIs. Click any question to see where they agree — and where they differ.
          </p>
        </div>

        {/* Category filter */}
        <div className="q-in mb-6 flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className="cat-pill text-xs px-4 py-2 rounded-full border font-medium"
              style={activeCategory === cat ? {
                background: '#9B4163', color: '#fff', borderColor: '#9B4163',
              } : {
                background: 'rgba(255,255,255,0.75)', color: '#7A6E67',
                borderColor: 'rgba(212,167,185,0.45)', backdropFilter: 'blur(4px)',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Age group filter */}
        <div className="q-in mb-10 flex flex-wrap gap-2 justify-center">
          {AGE_GROUPS.map((age) => (
            <button key={age} onClick={() => setActiveAge(age)} className="age-chip text-xs px-3.5 py-1.5 rounded-full border"
              style={activeAge === age ? {
                background: 'rgba(155,65,99,0.12)', color: '#9B4163', borderColor: '#9B4163', fontWeight: 600,
              } : {
                background: 'transparent', color: '#AFA8A2', borderColor: 'rgba(212,167,185,0.35)',
              }}>
              {age}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-center text-xs mb-8" style={{ color: '#AFA8A2' }}>
          Showing {filtered.length} question{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          {activeAge !== 'All ages' ? ` · Ages ${activeAge}` : ''}
        </p>

        {/* Question cards grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: '#AFA8A2', fontSize: '15px' }}>No questions found for these filters.</p>
            <button onClick={() => { setActiveCategory('All'); setActiveAge('All ages'); }}
              className="mt-4 text-sm px-5 py-2 rounded-full"
              style={{ background: 'rgba(155,65,99,0.08)', color: '#9B4163', border: '1px solid rgba(155,65,99,0.2)' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((q) => (
              <a key={q.id} href={`/q/${q.slug}`}
                className="q-card-hover block rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(212,167,185,0.32)',
                  boxShadow: '0 2px 16px rgba(139,48,88,0.06)',
                  textDecoration: 'none',
                }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(155,65,99,0.07)', color: '#9B4163', fontWeight: 500 }}>
                    {q.category}
                  </span>
                  {q.age_group && (
                    <span className="text-xs" style={{ color: '#AFA8A2' }}>{q.age_group}</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#1C1714', fontWeight: 500, lineHeight: 1.55 }}>
                  {q.question}
                </p>
                <div className="flex items-center gap-1 text-xs" style={{ color: '#9B4163' }}>
                  <span>See all 4 AI answers</span>
                  <ArrowRight size={11} />
                </div>
              </a>
            ))}
          </div>
        )}

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
