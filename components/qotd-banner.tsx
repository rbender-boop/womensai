'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';

type Qotd = {
  id: string;
  date: string;
  question: string;
  answer: string;
  category: string | null;
};

export function QotdBanner() {
  const [qotd, setQotd] = useState<Qotd | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem('qotd_dismissed') === today) {
      setDismissed(true);
      setReady(true);
      return;
    }

    fetch('/api/qotd')
      .then((r) => r.json())
      .then(({ qotd }) => { if (qotd) setQotd(qotd); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  function dismiss() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('qotd_dismissed', today);
    setDismissed(true);
  }

  function askThis() {
    if (!qotd) return;
    window.location.href = `/?q=${encodeURIComponent(qotd.question)}`;
  }

  if (!ready || dismissed || !qotd) return null;

  return (
    <div
      style={{
        width: '100%',
        borderBottom: '1px solid rgba(212,167,185,0.3)',
        background: 'rgba(253,245,248,0.95)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          maxWidth: '1152px',
          margin: '0 auto',
          padding: expanded ? '12px 24px 14px' : '9px 24px',
          transition: 'padding 0.2s',
        }}
      >
        {/* Collapsed row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <Sparkles size={12} style={{ color: '#9B4163' }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#9B4163',
            }}>
              Question of the Day
            </span>
          </div>

          <span style={{ color: 'rgba(212,167,185,0.6)', flexShrink: 0 }}>·</span>

          {/* Question text — clickable */}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
            }}
          >
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#1C1714',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {qotd.question}
            </span>
            {expanded
              ? <ChevronUp size={13} style={{ color: '#9B4163', flexShrink: 0 }} />
              : <ChevronDown size={13} style={{ color: '#9B4163', flexShrink: 0 }} />}
          </button>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: '#AFA8A2',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div style={{ marginTop: '12px' }}>
            {/* Answer */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '14px',
            }}>
              <div style={{
                width: '3px',
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #DCA8C0, rgba(220,168,192,0.2))',
                flexShrink: 0,
                marginTop: '2px',
              }} />
              <p style={{
                fontSize: '13px',
                lineHeight: 1.75,
                color: '#5C524D',
                margin: 0,
              }}>
                {qotd.answer}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                onClick={askThis}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '7px 16px',
                  borderRadius: '100px',
                  background: 'linear-gradient(135deg, #9B4163, #7A3050)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(139,48,88,0.25)',
                }}
              >
                Ask all AIs this question →
              </button>

              <SubscribeInline />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline subscribe form ────────────────────────────────────────────────────

function SubscribeInline() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'qotd_banner' }),
      });
      setStatus(res.ok ? 'done' : 'error');
      if (res.ok) localStorage.setItem('wai_signed_up', '1');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <span style={{ fontSize: '12px', color: '#7A8C6E', fontWeight: 500 }}>
        ✓ You&apos;ll get the daily question in your inbox
      </span>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Get this daily  ·  your@email.com"
        required
        style={{
          height: '32px',
          width: '220px',
          padding: '0 12px',
          fontSize: '12px',
          borderRadius: '100px',
          border: '1px solid rgba(212,167,185,0.55)',
          background: 'rgba(255,255,255,0.88)',
          color: '#1C1714',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          height: '32px',
          padding: '0 14px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '100px',
          background: 'rgba(155,65,99,0.1)',
          border: '1px solid rgba(155,65,99,0.3)',
          color: '#9B4163',
          cursor: 'pointer',
        }}
      >
        {status === 'loading' ? '...' : 'Subscribe'}
      </button>
    </form>
  );
}
