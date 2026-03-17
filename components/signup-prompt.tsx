'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface SignupPromptProps {
  variant: 'banner' | 'modal' | 'return';
  onDismiss: () => void;
  onSignedUp: () => void;
}

export function SignupPrompt({ variant, onDismiss, onSignedUp }: SignupPromptProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.ok) {
        setDone(true);
        localStorage.setItem('wai_signed_up', '1');
        setTimeout(() => onSignedUp(), 1800);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── BANNER ──
  if (variant === 'banner') {
    return (
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
        style={{ animation: 'slideUp 0.35s ease' }}
      >
        <div
          className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          style={{ border: '1.5px solid #E8C4D0', boxShadow: '0 8px 32px rgba(155,65,99,0.12)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warm-black leading-snug">
              Sign up free — the more you ask, the smarter your answers get.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={done}
              className="text-sm px-3 py-2 rounded-xl border border-warm-border bg-cream focus:outline-none w-full sm:w-44 text-warm-black placeholder-warm-muted"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || done}
              className="text-sm font-medium px-4 py-2 rounded-xl shrink-0 transition-opacity disabled:opacity-60"
              style={{ background: '#9B4163', color: '#fff' }}
            >
              {done ? '\u2713 Done' : loading ? '...' : 'Sign up'}
            </button>
            <button onClick={onDismiss} className="text-warm-muted hover:text-warm-black transition-colors shrink-0">
              <X size={15} />
            </button>
          </div>
          {error && <p className="text-xs w-full" style={{ color: '#C0394F' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── MODAL ──
  const isReturn = variant === 'return';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(28,23,20,0.45)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md relative"
        style={{ border: '1.5px solid #E8C4D0', boxShadow: '0 24px 64px rgba(155,65,99,0.16)' }}
      >
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-warm-muted hover:text-warm-black transition-colors"
        >
          <X size={16} />
        </button>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}
        >
          <Sparkles size={16} style={{ color: '#9B4163' }} />
        </div>

        {done ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">\u2713</p>
            <p className="font-semibold text-warm-black">You&apos;re in.</p>
            <p className="text-sm text-warm-gray mt-1">The more you ask, the smarter your answers get.</p>
          </div>
        ) : (
          <>
            <h2 className="font-serif text-2xl font-bold text-warm-black mb-2 leading-snug">
              {isReturn ? 'Welcome back.' : "You've used today's free questions."}
            </h2>
            <p className="text-sm text-warm-gray leading-relaxed mb-6">
              {isReturn
                ? "You've been asking great questions. Sign up free — the more you ask, the smarter your answers get."
                : "Sign up free — the more you ask, the smarter your answers get. Your daily questions reset every 24 hours."}
            </p>

            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full text-sm px-4 py-3 rounded-xl border border-warm-border bg-cream focus:outline-none text-warm-black placeholder-warm-muted"
                style={{ outline: 'none' }}
              />
              {error && <p className="text-xs" style={{ color: '#C0394F' }}>{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full text-sm font-semibold py-3 rounded-xl transition-opacity disabled:opacity-60"
                style={{ background: '#9B4163', color: '#fff' }}
              >
                {loading ? 'Signing up...' : 'Sign up free'}
              </button>
              <button
                onClick={onDismiss}
                className="text-xs text-warm-muted hover:text-warm-black transition-colors text-center py-1"
              >
                {isReturn ? 'Maybe later' : "I'll wait until tomorrow"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
