'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, CheckCheck, GitFork, Brain, Heart, ArrowRight } from 'lucide-react';
import { SignupPrompt } from '@/components/signup-prompt';
import {
  recordSession,
  recordQuestion,
  useSignupTrigger,
  isSignedUp,
} from '@/hooks/use-signup-trigger';
import type { FollowupQuestion } from '@/app/api/followup-questions/route';

const EXAMPLES = [
  'What are the best natural ways to manage PCOS symptoms?',
  'Is it safe to take melatonin every night long-term?',
  'What are signs of perimenopause vs regular PMS?',
  'How do I talk to my doctor about getting my hormones tested?',
  'What are the early warning signs of breast cancer I should watch for?',
  'Best skincare routine for hormonal acne?',
];

const DIFF_CARDS = [
  {
    icon: Heart,
    label: 'Built for women. Not just adapted for them.',
    desc: "Most AI health tools are built for everyone — which means they're optimized for no one. AskWomensAI is purpose-built for women's health, fitness, wellness, and beauty.",
    delay: '0s',
  },
  {
    icon: GitFork,
    label: 'We show you the disagreements',
    desc: 'When AIs contradict each other on your health, that matters. We surface those conflicts clearly so you can ask better questions of your doctor.',
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
    label: 'It gets smarter every time you ask',
    desc: 'The more questions you ask, the smarter it gets — and the more personalized your responses become. Sign up free to build that context.',
    delay: '3s',
  },
];

function LiftCard({ icon: Icon, label, desc, delay }: { icon: React.ElementType; label: string; desc: string; delay: string; }) {
  return (
    <div
      className="flex items-start gap-5 rounded-3xl p-7"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(212,167,185,0.35)',
        animation: 'cardLift 4s ease-in-out infinite',
        animationDelay: delay,
        willChange: 'transform, box-shadow',
      }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #F7ECF0, #EDD5E2)', border: '1px solid #DCA8C0' }}
      >
        <Icon size={16} style={{ color: '#8B3058' }} />
      </div>
      <div>
        <p className="font-semibold text-sm mb-2" style={{ color: '#1C1714', fontFamily: 'var(--font-playfair)', fontSize: '15px' }}>{label}</p>
        <p className="text-sm leading-relaxed" style={{ color: '#7A6E67' }}>{desc}</p>
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

  // Follow-up question states
  const [followupState, setFollowupState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [followupQuestions, setFollowupQuestions] = useState<FollowupQuestion[]>([]);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});

  const { variant, dismiss, onSignedUp } = useSignupTrigger(questionJustAsked);

  useEffect(() => {
    recordSession();
    setShowInlineSignup(!isSignedUp());
  }, []);

  function navigate(enrichedQuery: string, displayQuery: string, ageRange?: string) {
    recordQuestion();
    setQuestionJustAsked(true);
    setTimeout(() => setQuestionJustAsked(false), 500);
    const q = encodeURIComponent(enrichedQuery);
    const dq = enrichedQuery !== displayQuery ? `&dq=${encodeURIComponent(displayQuery)}` : '';
    const ar = ageRange ? `&ar=${encodeURIComponent(ageRange)}` : '';
    router.push(`/results/new?q=${q}${dq}${ar}`);
  }

  async function handleSubmit(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 8) { setError('Please enter at least 8 characters.'); return; }
    if (trimmed.length > 1500) { setError('Please keep your question under 1,500 characters.'); return; }
    setError('');
    setFollowupState('loading');
    setFollowupQuestions([]);
    setFollowupAnswers({});

    try {
      const res = await fetch('/api/followup-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setFollowupQuestions(data.questions);
        setFollowupAnswers({});
        setFollowupState('ready');
      } else {
        setFollowupState('idle');
        navigate(trimmed, trimmed);
      }
    } catch {
      setFollowupState('idle');
      navigate(trimmed, trimmed);
    }
  }

  function handleFinalSubmit(skip = false) {
    const trimmed = query.trim();
    const ageRange = followupAnswers['age'] || undefined;

    if (!skip) {
      const contextParts = followupQuestions
        .filter((fq) => fq.type === 'text')
        .map((fq) => {
          const ans = followupAnswers[fq.id]?.trim();
          return ans ? `${fq.question} ${ans}` : null;
        })
        .filter(Boolean) as string[];

      const allParts: string[] = [];
      if (ageRange) allParts.push(`Age range: ${ageRange}`);
      allParts.push(...contextParts);

      const enriched = allParts.length > 0
        ? `${trimmed}. Additional context: ${allParts.join('. ')}`
        : trimmed;

      navigate(enriched, trimmed, ageRange);
    } else {
      navigate(trimmed, trimmed);
    }
    setFollowupState('idle');
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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>

      <style>{`
        @keyframes cardLift {
          0%, 100% { transform: translateY(0px); box-shadow: 0 2px 8px rgba(139,48,88,0.06); }
          50% { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(139,48,88,0.14); }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .hero-1 { animation: floatIn 0.8s ease both; }
        .hero-2 { animation: floatIn 0.8s ease 0.12s both; }
        .hero-3 { animation: floatIn 0.8s ease 0.24s both; }
        .hero-4 { animation: floatIn 0.8s ease 0.36s both; }
        .pill-ex { transition: all 0.18s ease; }
        .pill-ex:hover { background: rgba(139,48,88,0.07) !important; border-color: #DCA8C0 !important; color: #8B3058 !important; }
        .followup-in { animation: floatIn 0.35s ease both; }
        .age-chip { transition: all 0.15s ease; cursor: pointer; }
        .age-chip:hover { border-color: #9B4163 !important; color: #9B4163 !important; }
      `}</style>

      {activeVariant && (
        <SignupPrompt
          variant={activeVariant}
          onDismiss={() => { setForceModal(false); dismiss(); }}
          onSignedUp={() => { setForceModal(false); setShowInlineSignup(false); onSignedUp(); }}
        />
      )}

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(212,167,185,0.25)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(253,245,248,0.82)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 700, color: '#1C1714' }}>AskWomens</span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 700, color: '#8B3058', fontStyle: 'italic' }}>AI</span>
          </div>
          <nav className="hidden sm:flex items-center gap-7 text-sm" style={{ color: '#7A6E67' }}>
            <a href="#why-different" style={{ transition: 'color 0.15s' }} onMouseEnter={e => (e.target as HTMLElement).style.color='#1C1714'} onMouseLeave={e => (e.target as HTMLElement).style.color='#7A6E67'}>Why us</a>
            <a href="/how-it-works" style={{ transition: 'color 0.15s' }} onMouseEnter={e => (e.target as HTMLElement).style.color='#1C1714'} onMouseLeave={e => (e.target as HTMLElement).style.color='#7A6E67'}>How it works</a>
            <a href="/about" style={{ transition: 'color 0.15s' }} onMouseEnter={e => (e.target as HTMLElement).style.color='#1C1714'} onMouseLeave={e => (e.target as HTMLElement).style.color='#7A6E67'}>About</a>
            {!stripDone && (
              <button
                onClick={() => setForceModal(true)}
                className="text-sm font-semibold px-5 py-2.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)',
                  color: '#fff',
                  boxShadow: '0 2px 14px rgba(139,48,88,0.28)',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,48,88,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 14px rgba(139,48,88,0.28)')}
              >
                Sign up free
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">

        {/* HERO */}
        <section className="w-full max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">

          <div className="hero-1 inline-flex items-center gap-2 text-xs font-medium px-5 py-2 rounded-full mb-10"
            style={{ background: 'rgba(155,65,99,0.07)', border: '1px solid rgba(155,65,99,0.18)', color: '#8B3058', letterSpacing: '0.3px' }}>
            <Sparkles size={11} />
            ChatGPT · Gemini · Claude · Grok — one compiled answer
          </div>

          <h1 className="hero-2 mb-6" style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(40px, 7vw, 74px)',
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.5px',
            color: '#1C1714',
          }}>
            Your questions.
            <br />
            <em style={{ color: '#9B4163', fontStyle: 'italic' }}>Every AI.</em>
            <br />
            One answer.
          </h1>

          <p className="hero-3 mx-auto mb-3" style={{ fontSize: '17px', color: '#6B6560', maxWidth: '440px', lineHeight: 1.8, textAlign: 'center' }}>
            Health. Fitness. Wellness. Beauty. Ask once and get the combined perspective of ChatGPT, Gemini, Claude, and Grok — compiled into one clear, trustworthy answer.
          </p>

          <p className="hero-3 mx-auto mb-8" style={{ fontSize: '15px', color: '#7A6E67', maxWidth: '380px', lineHeight: 1.75, textAlign: 'center' }}>
            See how the AIs agree — or if they disagree on certain key points — in 60 seconds or less.
          </p>

          <p className="hero-3 mb-11" style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '17px',
            color: '#9B4163',
            fontStyle: 'italic',
            animation: 'breathe 3.5s ease-in-out infinite',
          }}>
            Because one AI&apos;s opinion isn&apos;t enough for decisions that matter.
          </p>

          {/* Search */}
          <div className="hero-4 w-full mx-auto" style={{ maxWidth: '620px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.88)',
              border: '1.5px solid rgba(212,167,185,0.55)',
              borderRadius: '24px',
              boxShadow: '0 6px 40px rgba(139,48,88,0.10), 0 1px 4px rgba(0,0,0,0.03)',
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}>
              <textarea
                className="w-full px-6 pt-5 pb-3 text-base bg-transparent resize-none focus:outline-none leading-relaxed"
                style={{ color: '#1C1714' }}
                placeholder="Ask a health, fitness, wellness, or beauty question…"
                rows={3}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(''); setFollowupState('idle'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(query); } }}
              />
              <div className="flex items-center justify-between px-5 pb-5 pt-1">
                <span className="text-xs" style={{ color: '#AFA8A2' }}>{query.length} / 1500</span>
                <button
                  onClick={() => handleSubmit(query)}
                  disabled={query.trim().length < 8 || followupState === 'loading'}
                  className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 18px rgba(139,48,88,0.32)',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(139,48,88,0.44)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(139,48,88,0.32)')}
                >
                  <Search size={13} />
                  Ask all AIs
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {error && <p className="mt-2 text-sm" style={{ color: '#C0394F' }}>{error}</p>}

            {/* Follow-up Questions Panel */}
            {followupState !== 'idle' && (
              <div
                className="followup-in mt-3"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  border: '1.5px solid rgba(212,167,185,0.5)',
                  borderRadius: '20px',
                  padding: '20px 22px',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {followupState === 'loading' ? (
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '15px', height: '15px', borderRadius: '50%',
                      border: '2px solid #9B4163', borderTopColor: 'transparent',
                      animation: 'spin 0.7s linear infinite', flexShrink: 0,
                    }} />
                    <p className="text-sm" style={{ color: '#7A6E67' }}>Personalizing your questions…</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#9B4163', letterSpacing: '2.5px' }}>
                      Help us tailor your answer
                    </p>
                    <div className="space-y-4">
                      {followupQuestions.map((fq) => (
                        <div key={fq.id}>
                          <label className="block text-sm mb-2" style={{ color: '#4A4540', fontWeight: 500 }}>{fq.question}</label>

                          {fq.type === 'age_range' && fq.options ? (
                            <div className="flex flex-wrap gap-2">
                              {fq.options.map((opt) => {
                                const selected = followupAnswers['age'] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setFollowupAnswers(prev => ({ ...prev, age: selected ? '' : opt }))}
                                    className="age-chip text-xs px-3.5 py-1.5 rounded-full border font-medium"
                                    style={selected ? {
                                      background: '#9B4163',
                                      color: '#fff',
                                      borderColor: '#9B4163',
                                    } : {
                                      background: 'rgba(253,245,248,0.8)',
                                      color: '#7A6E67',
                                      borderColor: 'rgba(212,167,185,0.5)',
                                    }}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={followupAnswers[fq.id] || ''}
                              onChange={e => setFollowupAnswers(prev => ({ ...prev, [fq.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleFinalSubmit(); }}
                              placeholder="Optional — leave blank to skip"
                              className="w-full text-sm px-4 py-2.5 focus:outline-none"
                              style={{
                                background: 'rgba(253,245,248,0.8)',
                                border: '1px solid rgba(212,167,185,0.4)',
                                borderRadius: '12px',
                                color: '#1C1714',
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-5">
                      <button
                        onClick={() => handleFinalSubmit()}
                        className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)',
                          color: '#fff',
                          boxShadow: '0 4px 18px rgba(139,48,88,0.28)',
                        }}
                      >
                        Get my answer →
                      </button>
                      <button
                        onClick={() => handleFinalSubmit(true)}
                        className="text-sm"
                        style={{ color: '#AFA8A2' }}
                      >
                        Skip
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); setError(''); setFollowupState('idle'); }}
                  className="pill-ex text-xs px-4 py-2 rounded-full text-left"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(212,167,185,0.38)',
                    color: '#7A6E67',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs" style={{ color: '#AFA8A2' }}>
              5 free questions per day · No account required · Not medical advice · Always consult your doctor
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full px-6" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(155,65,99,0.2), transparent)' }} />
        </div>

        {/* WHY WE'RE DIFFERENT */}
        <section id="why-different" className="w-full max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#9B4163', letterSpacing: '3.5px' }}>One AI isn&apos;t enough</p>
            <h2 style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(32px, 5vw, 54px)',
              fontWeight: 700,
              color: '#1C1714',
              lineHeight: 1.12,
            }}>
              Why we&apos;re{' '}
              <em style={{ color: '#9B4163', fontStyle: 'italic' }}>different.</em>
            </h2>
            <p className="mt-4 mx-auto" style={{ color: '#7A6E67', fontSize: '15px', maxWidth: '460px', lineHeight: 1.75 }}>
              Every other health AI tool gives you one model&apos;s answer and calls it done.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DIFF_CARDS.map((card) => <LiftCard key={card.label} {...card} />)}
          </div>
        </section>

        {/* SIGNUP */}
        {showInlineSignup && (
          <section className="w-full max-w-2xl mx-auto px-6 pb-24">
            <div style={{
              borderRadius: '32px',
              padding: '56px 48px',
              textAlign: 'center',
              background: 'linear-gradient(145deg, rgba(155,65,99,0.08) 0%, rgba(122,48,80,0.12) 100%)',
              border: '1.5px solid rgba(212,167,185,0.45)',
              backdropFilter: 'blur(12px)',
            }}>
              {stripDone ? (
                <>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>✶</p>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 700, color: '#1C1714' }}>You&apos;re in.</p>
                  <p className="mt-2 text-sm" style={{ color: '#7A6E67' }}>The more you ask, the smarter your answers get.</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase mb-5" style={{ color: '#9B4163', letterSpacing: '3px' }}>Free forever to start</p>
                  <h2 className="mb-4" style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: 'clamp(20px, 3vw, 30px)',
                    fontWeight: 700,
                    color: '#1C1714',
                    lineHeight: 1.3,
                  }}>
                    Sign up free — the more you ask,
                    <br />
                    <em style={{ color: '#9B4163', fontStyle: 'italic' }}>the smarter and more personalized your answers get.</em>
                  </h2>
                  <p className="text-sm mb-8 mx-auto" style={{ color: '#7A6E67', maxWidth: '380px', lineHeight: 1.75 }}>
                    Your questions build context. Every answer gets sharper and more personalized.
                    <br />Your questions always remain anonymous. No credit card. No commitment.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center" style={{ maxWidth: '420px', margin: '0 auto' }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={stripEmail}
                      onChange={(e) => { setStripEmail(e.target.value); setStripError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleStripSignup()}
                      className="flex-1 text-sm px-5 py-3.5 focus:outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.88)',
                        border: '1.5px solid rgba(212,167,185,0.5)',
                        borderRadius: '100px',
                        color: '#1C1714',
                      }}
                    />
                    <button
                      onClick={handleStripSignup}
                      disabled={stripLoading}
                      className="text-sm font-semibold px-7 py-3.5 disabled:opacity-60 shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #9B4163, #7A3050)',
                        color: '#fff',
                        borderRadius: '100px',
                        boxShadow: '0 4px 18px rgba(139,48,88,0.32)',
                      }}
                    >
                      {stripLoading ? 'Signing up...' : 'Sign up free'}
                    </button>
                  </div>
                  {stripError && <p className="mt-3 text-xs" style={{ color: '#C0394F' }}>{stripError}</p>}
                  <p className="mt-5 text-xs" style={{ color: '#AFA8A2' }}>No spam. Unsubscribe anytime.</p>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(212,167,185,0.25)', background: 'rgba(253,245,248,0.7)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#7A6E67' }}>
          <div className="flex items-center">
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#1C1714' }}>AskWomens</span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#8B3058', fontStyle: 'italic' }}>AI</span>
            <span className="ml-2 text-xs" style={{ color: '#AFA8A2' }}>© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/questions" style={{ fontSize: '12px', transition: 'color 0.15s' }}>Questions</a>
            <a href="/weird" style={{ fontSize: '12px', transition: 'color 0.15s' }}>Weird Questions</a>
            <a href="/privacy" style={{ fontSize: '12px', transition: 'color 0.15s' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: '12px', transition: 'color 0.15s' }}>Terms</a>
            <a href="/about" style={{ fontSize: '12px', transition: 'color 0.15s' }}>About</a>
          </div>
          <p className="text-xs text-center sm:text-right" style={{ color: '#AFA8A2', maxWidth: '280px', lineHeight: 1.6 }}>
            For informational purposes only. Always consult a qualified healthcare provider before making health decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
