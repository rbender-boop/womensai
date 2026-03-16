'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, CheckCheck, GitFork, AlignLeft } from 'lucide-react';

const EXAMPLES = [
  'What are the best natural ways to manage PCOS symptoms?',
  'Is it safe to take melatonin every night long-term?',
  'What are signs of perimenopause vs regular PMS?',
  'How do I talk to my doctor about getting my hormones tested?',
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 8) {
      setError('Please enter at least 8 characters.');
      return;
    }
    if (trimmed.length > 1500) {
      setError('Please keep your question under 1,500 characters.');
      return;
    }
    setError('');
    const encoded = encodeURIComponent(trimmed);
    router.push(`/results/new?q=${encoded}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-warm-border max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-1">
          <span className="font-serif text-xl font-bold tracking-tight text-warm-black">Womens</span>
          <span
            className="font-serif text-xl font-bold tracking-tight"
            style={{ color: '#9B4163' }}
          >
            AI
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-warm-gray">
          <a href="#how-it-works" className="hover:text-warm-black transition-colors">How it works</a>
          <a href="/about" className="hover:text-warm-black transition-colors">About</a>
          <a href="/pricing" className="hover:text-warm-black transition-colors">Pricing</a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center px-4">
        {/* Hero */}
        <section className="w-full max-w-2xl mx-auto pt-20 pb-12 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full mb-7 border"
            style={{
              background: '#F7ECF0',
              borderColor: '#E8C4D0',
              color: '#9B4163',
            }}
          >
            <Sparkles size={11} />
            ChatGPT · Gemini · Claude · Grok — one compiled answer
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-5"
            style={{ color: '#1C1714' }}
          >
            Your health questions,
            <br />
            <em className="not-italic" style={{ color: '#9B4163' }}>
              answered by every AI.
            </em>
          </h1>

          <p className="text-lg text-warm-gray max-w-lg mx-auto mb-10 leading-relaxed">
            AskWomensAI asks ChatGPT, Gemini, Claude, and Grok at the same time — then compiles the clearest answer, shows what they agree on, and flags where they differ.
          </p>

          {/* Search box */}
          <div
            className="w-full bg-white rounded-2xl transition-all"
            style={{
              border: '1.5px solid #EDE8E3',
              boxShadow: '0 2px 12px rgba(155, 65, 99, 0.06)',
            }}
            onFocus={() => {}}
          >
            <textarea
              className="w-full px-5 pt-4 pb-2 text-base placeholder-warm-muted bg-transparent resize-none focus:outline-none rounded-t-2xl leading-relaxed text-warm-black"
              placeholder="Ask a health question you want multiple AI perspectives on…"
              rows={3}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(''); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(query);
                }
              }}
            />
            <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
              <span className="text-xs text-warm-muted">{query.length} / 1500</span>
              <button
                onClick={() => handleSubmit(query)}
                disabled={query.trim().length < 8}
                className="flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#9B4163', color: '#fff' }}
              >
                <Search size={13} />
                Ask all AIs
              </button>
            </div>
          </div>

          {error && <p className="mt-2 text-sm" style={{ color: '#C0394F' }}>{error}</p>}

          {/* Example prompts */}
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); setError(''); }}
                className="text-xs px-3 py-1.5 rounded-full transition-colors text-left"
                style={{
                  background: '#fff',
                  border: '1px solid #EDE8E3',
                  color: '#7A6E67',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor = '#E8C4D0';
                  (e.target as HTMLElement).style.color = '#9B4163';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = '#EDE8E3';
                  (e.target as HTMLElement).style.color = '#7A6E67';
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-warm-muted">
            5 free questions per day · No account required · Always consult a healthcare provider for personal medical decisions
          </p>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="w-full max-w-4xl mx-auto py-16 border-t border-warm-border">
          <h2 className="font-serif text-3xl font-bold text-warm-black text-center mb-10">
            How AskWomensAI works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Search, title: '1. Ask once', desc: 'Type your health question one time. No need to open four browser tabs or wonder which AI to trust.' },
              { icon: Sparkles, title: '2. All four AIs answer', desc: 'ChatGPT, Gemini, Claude, and Grok all respond in parallel — usually in under 30 seconds.' },
              { icon: CheckCheck, title: '3. Get a compiled answer', desc: 'See what they agree on, where they differ, and a synthesized best answer to guide your next step.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 bg-white rounded-2xl p-6 border border-warm-border">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}
                >
                  <Icon size={15} style={{ color: '#9B4163' }} />
                </div>
                <h3 className="font-semibold text-warm-black text-sm">{title}</h3>
                <p className="text-sm text-warm-gray leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What you get section */}
        <section className="w-full max-w-4xl mx-auto py-12 border-t border-warm-border mb-16">
          <h2 className="font-serif text-3xl font-bold text-warm-black text-center mb-10">
            What you get in every result
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Sparkles, label: 'Best Answer', desc: 'A synthesized recommendation based on the strongest overlapping insights from all four AIs.' },
              { icon: CheckCheck, label: 'Consensus', desc: 'What the models broadly agree on — the clearest, most reliable signal.' },
              { icon: GitFork, label: 'Disagreements', desc: 'Where the models meaningfully differ in recommendation or confidence.' },
              { icon: AlignLeft, label: 'Raw Responses', desc: 'The full unedited answer from each AI — ChatGPT, Gemini, Claude, and Grok.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-warm-border">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}
                >
                  <Icon size={13} style={{ color: '#9B4163' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-warm-black mb-1">{label}</p>
                  <p className="text-sm text-warm-gray leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-border py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-warm-gray">
          <div className="flex items-center gap-1">
            <span className="font-serif font-bold text-warm-black">Womens</span>
            <span className="font-serif font-bold" style={{ color: '#9B4163' }}>AI</span>
            <span className="ml-2 text-warm-muted text-xs">© 2025</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="hover:text-warm-black transition-colors text-xs">Privacy</a>
            <a href="/terms" className="hover:text-warm-black transition-colors text-xs">Terms</a>
            <a href="/about" className="hover:text-warm-black transition-colors text-xs">About</a>
          </div>
          <p className="text-xs text-warm-muted text-center sm:text-right max-w-xs leading-relaxed">
            For research only. Always consult a qualified healthcare provider before making health decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
