'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, CheckCheck, GitFork, Brain } from 'lucide-react';
import { SignupPrompt } from '@/components/signup-prompt';
import {
  recordSession,
  recordQuestion,
  useSignupTrigger,
  isSignedUp,
} from '@/hooks/use-signup-trigger';

const EXAMPLES = [
  'What are the best natural ways to manage PCOS symptoms?',
  'Is it safe to take melatonin every night long-term?',
  'What are signs of perimenopause vs regular PMS?',
  'How do I talk to my doctor about getting my hormones tested?',
  'What are the early warning signs of breast cancer I should watch for?',
  'What body changes are normal for girls going through puberty?',
];

const DIFF_CARDS = [
  {
    icon: Sparkles,
    label: "We ask four AIs, so you don't have to",
    desc: "One question. Four AI perspectives. Simultaneously. You get the combined intelligence of ChatGPT, Gemini, Claude, and Grok — without opening a single extra tab.",
    delay: '0s',
  },
  {
    icon: GitFork,
    label: 'We show you the disagreements',
    desc: 'When AIs contradict each other on your health, that matters. We surface those conflicts clearly. Other tools bury them.',
    delay: '1s',
  },
  {
    icon: CheckCheck,
    label: 'We synthesize, not just dump',
    desc: "You don't get four raw walls of text. You get one compiled recommendation — built from the strongest overlapping insights across all four models.",
    delay: '2s',
  },
  {
    icon: Brain,
    label: 'I get smarter every time you ask',
    desc: 'The more questions you ask, the smarter I get — and the more personalized your responses become. Sign up free to build that context.',
    delay: '3s',
  },
];

function LiftCard({
  icon: Icon,
  label,
  desc,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  delay: string;
}) {
  return (
    <div
      className="flex items-start gap-4 bg-white rounded-2xl p-6"
      style={{
        border: '1px solid #EDE8E3',
        animation: 'cardLift 4s ease-in-out infinite',
        animationDelay: delay,
        willChange: 'transform, box-shadow',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}
      >
        <Icon size={15} style={{ color: '#9B4163' }} />
      </div>
      <div>
        <p className="font-bold text-sm text-warm-black mb-1.5">{label}</p>
        <p className="text-sm text-warm-gray leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [questionJustAsked, setQuestionJustAsked] = useState(false);
  const [showInlineSignup, setShowInlineSignup] = useState(false);
  const [forceModal, setForceModal] = useState(false);

  const [stripEmail, setStripEmail] = useState('');
  const [stripLoading, setStripLoading] = useState(false);
  const [stripDone, setStripDone] = useState(false);
  const [stripError, setStripError] = useState('');

  const { variant, dismiss, onSignedUp } = useSignupTrigger(questionJustAsked);

  useEffect(() => {
    recordSession();
    setShowInlineSignup(!isSignedUp());
  }, []);

  function handleSubmit(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 8) { setError('Please enter at least 8 characters.'); return; }
    if (trimmed.length > 1500) { setError('Please keep your question under 1,500 characters.'); return; }
    setError('');
    recordQuestion();
    setQuestionJustAsked(true);
    setTimeout(() => setQuestionJustAsked(false), 500);
    router.push(`/results/new?q=${encodeURIComponent(trimmed)}`);
  }

  async function handleStripSignup() {
    const trimmed = stripEmail.trim();
    if (!trimmed.includes('@')) { setStripError('Please enter a valid email.'); return; }
    setStripLoading(true);
    setStripError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.ok) {
        setStripDone(true);
        localStorage.setItem('wai_signed_up', '1');
        setShowInlineSignup(false);
      } else {
        setStripError('Something went wrong. Please try again.');
      }
    } catch {
      setStripError('Something went wrong. Please try again.');
    } finally {
      setStripLoading(false);
    }
  }

  const activeVariant = forceModal ? 'modal' : variant;

  return (
    <div className="min-h-screen flex flex-col bg-cream">

      <style>{`
        @keyframes cardLift {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 1px 4px rgba(155, 65, 99, 0.06);
            border-color: #EDE8E3;
          }
          50% {
            transform: translateY(-6px);
            box-shadow: 0 12px 32px rgba(155, 65, 99, 0.18);
            border-color: #E8C4D0;
          }
        }
      `}</style>

      {activeVariant && (
        <SignupPrompt
          variant={activeVariant}
          onDismiss={() => { setForceModal(false); dismiss(); }}
          onSignedUp={() => { setForceModal(false); setShowInlineSignup(false); onSignedUp(); }}
        />
      )}

      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-warm-border max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-0.5">
          <span className="font-serif text-xl font-bold tracking-tight text-warm-black">AskWomens</span>
          <span className="font-serif text-xl font-bold tracking-tight" style={{ color: '#9B4163' }}>AI</span>
        </div>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-warm-gray">
          <a href="#how-it-works" className="hover:text-warm-black transition-colors">How it works</a>
          <a href="/about" className="hover:text-warm-black transition-colors">About</a>
          {!stripDone && (
            <button
              onClick={() => setForceModal(true)}
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-85"
              style={{ background: '#9B4163', color: '#fff' }}
            >
              Sign up free
            </button>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center px-4">

        {/* Hero */}
        <section className="w-full max-w-2xl mx-auto pt-20 pb-12 text-center">
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full mb-7 border"
            style={{ background: '#F7ECF0', borderColor: '#E8C4D0', color: '#9B4163' }}
          >
            <Sparkles size={11} />
            ChatGPT · Gemini · Claude · Grok — one compiled answer
          </div>

          <h1
            className="font-serif text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-5"
            style={{ color: '#1C1714' }}
          >
            Your health questions,
            <br />
            answered by{' '}
            <em className="not-italic" style={{ color: '#9B4163', textDecoration: 'underline', textUnderlineOffset: '6px', textDecorationThickness: '2px' }}>
              every AI
            </em>
            ,<br />
            from one search.
          </h1>

          <p className="text-lg text-warm-gray max-w-lg mx-auto mb-6 leading-relaxed">
            Stop trusting one AI with your health. AskWomensAI asks ChatGPT, Gemini, Claude, and Grok simultaneously — then compiles one clear answer, shows where they agree, and flags where they don&apos;t.
          </p>

          <p className="font-medium font-serif italic mb-8" style={{ color: '#9B4163', fontSize: '18px', animation: 'breath 3s ease-in-out infinite' }}>
            Because one AI&apos;s opinion isn&apos;t enough for decisions that matter.
          </p>

          <div className="w-full bg-white rounded-2xl transition-all" style={{ border: '1.5px solid #EDE8E3', boxShadow: '0 2px 12px rgba(155, 65, 99, 0.06)' }}>
            <textarea
              className="w-full px-5 pt-4 pb-2 text-base placeholder-warm-muted bg-transparent resize-none focus:outline-none rounded-t-2xl leading-relaxed text-warm-black"
              placeholder="Ask a health question you want multiple AI perspectives on…"
              rows={3}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(query); } }}
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

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); setError(''); }}
                className="text-xs px-3 py-1.5 rounded-full transition-colors text-left"
                style={{ background: '#fff', border: '1px solid #EDE8E3', color: '#7A6E67' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = '#E8C4D0'; (e.target as HTMLElement).style.color = '#9B4163'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = '#EDE8E3'; (e.target as HTMLElement).style.color = '#7A6E67'; }}
              >
                {ex}
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs text-warm-muted">
            5 free questions per day · No account required · Always consult a healthcare provider
          </p>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="w-full max-w-4xl mx-auto py-16 border-t border-warm-border">
          <h2 className="font-serif text-3xl font-bold text-warm-black text-center mb-10">How AskWomensAI works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Search, title: '1. Ask once', desc: 'Type your health question one time. No need to open four browser tabs or wonder which AI to trust.' },
              { icon: Sparkles, title: '2. All four AIs answer', desc: 'ChatGPT, Gemini, Claude, and Grok all respond in parallel — usually in under 30 seconds.' },
              { icon: CheckCheck, title: '3. Get a compiled answer', desc: 'See what they agree on, where they differ, and a synthesized best answer to guide your next step.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 bg-white rounded-2xl p-6 border border-warm-border">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}>
                  <Icon size={15} style={{ color: '#9B4163' }} />
                </div>
                <h3 className="font-semibold text-warm-black text-sm">{title}</h3>
                <p className="text-sm text-warm-gray leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why we're different */}
        <section className="w-full max-w-4xl mx-auto py-14 border-t border-warm-border">
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9B4163' }}>One AI isn&apos;t enough</span>
          </div>
          <h2 className="font-serif text-4xl font-bold text-warm-black text-center mb-3">
            Why we&apos;re different.
          </h2>
          <p className="text-center text-warm-gray text-sm max-w-lg mx-auto mb-10 leading-relaxed">
            Every other health AI tool gives you one model&apos;s answer and calls it done. We built something fundamentally different.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DIFF_CARDS.map((card) => (
              <LiftCard key={card.label} {...card} />
            ))}
          </div>
        </section>

        {/* Inline signup strip */}
        {showInlineSignup && (
          <section className="w-full max-w-4xl mx-auto py-14 border-t border-warm-border mb-8">
            <div className="rounded-3xl px-8 py-10 text-center" style={{ background: '#F7ECF0', border: '1.5px solid #E8C4D0' }}>
              {stripDone ? (
                <>
                  <p className="text-2xl mb-2">✓</p>
                  <p className="font-serif text-xl font-bold text-warm-black">You&apos;re in.</p>
                  <p className="text-sm text-warm-gray mt-2">The more you ask, the smarter your answers get.</p>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: '#1C1714' }}>
                    Sign up free — the more you ask, the smarter your answers get.
                  </h2>
                  <p className="text-sm text-warm-gray mb-7 max-w-md mx-auto leading-relaxed">
                    Your questions build context. Every answer gets sharper. No credit card. No commitment.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={stripEmail}
                      onChange={(e) => { setStripEmail(e.target.value); setStripError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleStripSignup()}
                      className="flex-1 text-sm px-4 py-3 rounded-xl border border-warm-border bg-white focus:outline-none text-warm-black placeholder-warm-muted"
                    />
                    <button
                      onClick={handleStripSignup}
                      disabled={stripLoading}
                      className="text-sm font-semibold px-6 py-3 rounded-xl transition-opacity disabled:opacity-60 shrink-0"
                      style={{ background: '#9B4163', color: '#fff' }}
                    >
                      {stripLoading ? 'Signing up...' : 'Sign up free'}
                    </button>
                  </div>
                  {stripError && <p className="mt-2 text-xs" style={{ color: '#C0394F' }}>{stripError}</p>}
                  <p className="mt-4 text-xs text-warm-muted">No spam. Unsubscribe anytime.</p>
                </>
              )}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-warm-border py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-warm-gray">
          <div className="flex items-center gap-0.5">
            <span className="font-serif font-bold text-warm-black">AskWomens</span>
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
