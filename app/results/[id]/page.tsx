'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles, CheckCheck, GitFork, AlignLeft, AlertCircle,
  RotateCcw, Home, Mail, MessageSquare, Share2, X,
  Copy, Check, BookmarkPlus, Users,
} from 'lucide-react';
import type { SearchResponse, ProviderResult } from '@/types/search';

// ── Style maps ────────────────────────────────────────────────────────────────
const PROVIDER_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  chatgpt: { bg: '#EFF6EF', border: '#C2D9C0', text: '#2F6B2B', dot: '#4A9645' },
  gemini:  { bg: '#EBF0F8', border: '#B8CCE2', text: '#264F7A', dot: '#3B76B0' },
  claude:  { bg: '#FAF0EB', border: '#E8C7B2', text: '#7A3D20', dot: '#B55A30' },
  grok:    { bg: '#F3EEF8', border: '#D4BEED', text: '#5E2F85', dot: '#8B4CBF' },
};

const AI_CARDS = [
  { label: 'ChatGPT', color: '#2F6B2B', bg: '#EFF6EF', border: '#C2D9C0', dot: '#4A9645', delay: '0s' },
  { label: 'Gemini',  color: '#264F7A', bg: '#EBF0F8', border: '#B8CCE2', dot: '#3B76B0', delay: '0.35s' },
  { label: 'Claude',  color: '#7A3D20', bg: '#FAF0EB', border: '#E8C7B2', dot: '#B55A30', delay: '0.7s' },
  { label: 'Grok',    color: '#5E2F85', bg: '#F3EEF8', border: '#D4BEED', dot: '#8B4CBF', delay: '1.05s' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function ProviderBadge({ provider, label }: { provider: string; label: string }) {
  const s = PROVIDER_STYLES[provider] || { bg: '#F3F0EC', border: '#DDD5CE', text: '#7A6E67', dot: '#AFA8A2' };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
      {label}
    </span>
  );
}

function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="bg-white border border-warm-border rounded-2xl p-6">
      <div className="h-3.5 rounded-full w-28 mb-5 warm-pulse" style={{ background: '#EDE8E3' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded-full mb-3 warm-pulse"
          style={{ background: '#EDE8E3', width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

function ProviderCard({ result }: { result: ProviderResult }) {
  const failed = result.status !== 'success';
  return (
    <div className={`bg-white border rounded-2xl p-5 border-warm-border ${failed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 mb-3.5">
        <ProviderBadge provider={result.provider} label={result.label} />
        <span className="text-xs text-warm-muted">{result.model}</span>
        {result.latencyMs && (
          <span className="text-xs text-warm-muted ml-auto">{(result.latencyMs / 1000).toFixed(1)}s</span>
        )}
      </div>
      {failed ? (
        <p className="text-sm text-warm-muted italic">
          {result.status === 'disabled' ? 'Provider not configured' : `Unavailable: ${result.errorMessage || result.status}`}
        </p>
      ) : (
        <p className="text-sm text-warm-gray leading-relaxed whitespace-pre-wrap">{result.text}</p>
      )}
    </div>
  );
}

function ActionBtn({
  icon, label, onClick, active, highlight,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left w-full"
      style={
        highlight
          ? { background: '#F7ECF0', color: '#9B4163', border: '1px solid #E8C4D0' }
          : active
          ? { background: '#9B4163', color: '#fff', border: '1px solid #9B4163' }
          : { background: '#FAF7F5', color: '#4A4540', border: '1px solid #EDE8E3' }
      }
    >
      <span style={{ color: active ? '#fff' : '#9B4163' }}>{icon}</span>
      {label}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(30,20,25,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl p-6 relative shadow-xl" style={{ border: '1px solid #EDE8E3' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-warm-black">{title}</h3>
          <button onClick={onClose} className="text-warm-muted hover:text-warm-gray transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get('q') || '';

  // Core
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('chatgpt');

  // Share
  const [requestId, setRequestId] = useState<string | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [emailSelf, setEmailSelf] = useState('');
  const [emailFriend, setEmailFriend] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [followUpText, setFollowUpText] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [saveEmail, setSaveEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // ── Helpers ──────────────────────────────────────────────────────────────────
  async function runSearch(q: string) {
    if (!q || q.length < 8) return;
    setLoading(true);
    setError('');
    setData(null);
    setShareSlug(null);
    setRequestId(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(res.status === 429
          ? "You've reached your 5 free questions for today. Come back tomorrow!"
          : json.error || 'Something went wrong. Please try again.');
        return;
      }

      setData(json);
      setRequestId(json.requestId ?? null);
      if (json.providers?.length) {
        const first = json.providers.find((p: ProviderResult) => p.status === 'success');
        if (first) setActiveTab(first.provider);
      }
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (query) runSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const compiled = data?.compiled;
  const providers = data?.providers || [];
  const activeProvider = providers.find((p) => p.provider === activeTab);
  const decodedQuery = query ? decodeURIComponent(query) : '';

  // ── Share / email helpers ────────────────────────────────────────────────────
  async function getShareUrl(): Promise<string> {
    if (shareSlug) return `${window.location.origin}/a/${shareSlug}`;
    setShareLoading(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: decodedQuery, compiled, providers, requestId }),
      });
      const json = await res.json();
      if (json.slug) {
        setShareSlug(json.slug);
        return `${window.location.origin}/a/${json.slug}`;
      }
    } catch { /* fall through */ }
    finally { setShareLoading(false); }
    return window.location.href;
  }

  async function handleCopyLink() {
    const url = await getShareUrl();
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleSendEmail(type: 'self' | 'friend') {
    const to = type === 'self' ? emailSelf : emailFriend;
    if (!to || !to.includes('@')) return;
    setEmailStatus('sending');
    try {
      const shareUrl = await getShareUrl();
      const res = await fetch('/api/email-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, query: decodedQuery, compiled, shareUrl, type, note: emailNote }),
      });
      setEmailStatus(res.ok ? 'sent' : 'error');
    } catch {
      setEmailStatus('error');
    }
  }

  function handleFollowUp() {
    if (!followUpText.trim()) return;
    const ctx = `Follow-up to "${decodedQuery}": ${followUpText.trim()}`;
    router.push(`/results/new?q=${encodeURIComponent(ctx)}`);
  }

  async function handleSocialShare(platform: string) {
    const url = await getShareUrl();
    const text = `I asked ChatGPT, Gemini, Claude & Grok: "${decodedQuery.slice(0, 80)}" — here's what they said:`;
    const eu = encodeURIComponent(url);
    const et = encodeURIComponent(text);
    const links: Record<string, string> = {
      twitter:  `https://twitter.com/intent/tweet?text=${et}&url=${eu}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${eu}&title=${et}`,
      whatsapp: `https://wa.me/?text=${et}%20${eu}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${eu}`,
    };
    window.open(links[platform], '_blank', 'noopener,noreferrer');
  }

  async function handleSaveSignup() {
    if (!saveEmail || !saveEmail.includes('@')) return;
    setSaveStatus('sending');
    try {
      await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: saveEmail, source: 'save_answers_cta' }),
      });
    } catch { /* silent */ }
    setSaveStatus('sent');
  }

  function openModal(id: string) {
    setActiveModal(id);
    setEmailStatus('idle');
    setSaveStatus('idle');
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream">
      {/* Progress bar */}
      {loading && (
        <div className="fixed top-0 left-0 w-full z-50 overflow-hidden" style={{ height: '3px', background: '#F0E9E1' }}>
          <div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, #F7ECF0, #9B4163, #C97A9A, #9B4163)',
              backgroundSize: '200% 100%',
              animation: 'progressSlide 1.8s ease-in-out infinite',
              width: '50%',
            }}
          />
        </div>
      )}

      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid #EDE8E3' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 transition-colors" style={{ color: '#7A6E67' }}>
            <Home size={15} />
            <div className="flex items-center gap-0.5">
              <span className="font-serif font-bold text-warm-black">AskWomens</span>
              <span className="font-serif font-bold" style={{ color: '#9B4163' }}>AI</span>
            </div>
          </button>
          {data && (
            <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: '#7A6E67' }}>
              <RotateCcw size={13} />
              New question
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {/* Question */}
        {query && (
          <div className="bg-white rounded-2xl px-5 py-4" style={{ border: '1px solid #EDE8E3' }}>
            <p className="text-xs text-warm-muted mb-1.5 font-medium uppercase tracking-widest">Your question</p>
            <p className="text-base text-warm-black font-medium leading-relaxed">{decodedQuery}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl p-5" style={{ background: '#FDF0F2', border: '1px solid #F0BECA' }}>
            <AlertCircle size={17} className="shrink-0 mt-0.5" style={{ color: '#C0394F' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#9B2035' }}>{error}</p>
              <button onClick={() => runSearch(query)} className="mt-2 text-sm underline" style={{ color: '#9B4163' }}>Try again</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <>
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
              <p className="text-xs font-medium uppercase tracking-widest text-warm-muted mb-5 text-center">Querying all four AIs simultaneously…</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {AI_CARDS.map(({ label, color, bg, border, dot, delay }) => (
                  <div key={label} className="flex flex-col items-center gap-2.5 rounded-xl py-5 px-3" style={{ background: bg, border: `1px solid ${border}` }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: dot, animation: 'aiPulse 1.4s ease-in-out infinite', animationDelay: delay }} />
                    <span className="text-sm font-semibold" style={{ color }}>{label}</span>
                    <span className="text-xs text-warm-muted">thinking…</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-warm-muted text-center">This usually takes 15–30 seconds. Please don&apos;t close this tab.</p>
            </div>
            <SkeletonCard lines={5} />
            <SkeletonCard lines={3} />
          </>
        )}

        {/* Results */}
        {compiled && (
          <>
            {data?.status === 'partial_failure' && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: '#FDF6EC', border: '1px solid #EDD8B0', color: '#7A5520' }}>
                <AlertCircle size={14} />
                One or more providers were unavailable. Results are based on the responses received.
              </div>
            )}

            {/* Best Answer */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#9B4163' }}>
                  <Sparkles size={13} style={{ color: '#fff' }} />
                </div>
                <h2 className="font-semibold text-warm-black">Best Answer</h2>
                <span className="text-xs text-warm-muted ml-auto">Synthesized from all responses</span>
              </div>
              <p className="text-sm text-warm-gray leading-relaxed whitespace-pre-wrap">{compiled.bestAnswer}</p>
            </div>

            {/* Consensus */}
            {compiled.consensus.length > 0 && (
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6EF', border: '1px solid #C2D9C0' }}>
                    <CheckCheck size={13} style={{ color: '#2F6B2B' }} />
                  </div>
                  <h2 className="font-semibold text-warm-black">Consensus</h2>
                </div>
                <ul className="space-y-2.5">
                  {compiled.consensus.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-warm-gray">
                      <span className="mt-0.5 shrink-0 text-xs" style={{ color: '#4A9645' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disagreements */}
            {compiled.disagreements.length > 0 && (
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FDF6EC', border: '1px solid #EDD8B0' }}>
                    <GitFork size={13} style={{ color: '#8A5E1A' }} />
                  </div>
                  <h2 className="font-semibold text-warm-black">Disagreements</h2>
                </div>
                <ul className="space-y-2.5">
                  {compiled.disagreements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-warm-gray">
                      <span className="mt-0.5 shrink-0" style={{ color: '#B08030' }}>≠</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {compiled.notes && (
              <p className="text-xs text-warm-muted px-1 leading-relaxed">{compiled.notes}</p>
            )}

            {/* Raw Responses */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EDE8E3' }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F3F0EC', border: '1px solid #DDD5CE' }}>
                  <AlignLeft size={13} style={{ color: '#7A6E67' }} />
                </div>
                <h2 className="font-semibold text-warm-black">Raw Responses</h2>
              </div>
              <div className="flex gap-2 mb-5 flex-wrap">
                {providers.map((p) => {
                  const active = activeTab === p.provider;
                  return (
                    <button
                      key={p.provider}
                      onClick={() => setActiveTab(p.provider)}
                      className="text-sm px-4 py-1.5 rounded-xl border font-medium transition-all"
                      style={active
                        ? { background: '#9B4163', color: '#fff', borderColor: '#9B4163' }
                        : { background: '#F7ECF0', color: '#9B4163', borderColor: '#E8C4D0' }}
                    >
                      {p.label}
                      {p.status !== 'success' && <span className="ml-1 text-xs opacity-60">(unavailable)</span>}
                    </button>
                  );
                })}
              </div>
              {activeProvider && <ProviderCard result={activeProvider} />}
            </div>

            {/* ── Action Bar ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EDE8E3' }}>
              <p className="text-xs font-medium text-warm-muted uppercase tracking-widest mb-4">What would you like to do?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <ActionBtn icon={<Mail size={14} />}        label="Email me this"     onClick={() => openModal('email-self')} />
                <ActionBtn icon={<MessageSquare size={14} />} label="Ask a follow-up"  onClick={() => { openModal('followup'); setFollowUpText(''); }} />
                <ActionBtn icon={<Users size={14} />}       label="Email a friend"    onClick={() => openModal('email-friend')} />
                <ActionBtn
                  icon={copied ? <Check size={14} /> : <Copy size={14} />}
                  label={copied ? 'Copied!' : shareLoading ? 'Generating…' : 'Copy share link'}
                  onClick={handleCopyLink}
                  active={copied}
                />
                <ActionBtn icon={<Share2 size={14} />}      label="Share on socials"  onClick={() => openModal('social')} />
                <ActionBtn icon={<BookmarkPlus size={14} />} label="Save your answers" onClick={() => openModal('save')} highlight />
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-2xl px-5 py-4 text-sm leading-relaxed" style={{ background: '#F7ECF0', border: '1px solid #E8C4D0', color: '#7A3050' }}>
              <strong>Important:</strong> These responses are from AI models for informational purposes only. They do not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making any health decisions.
            </div>
          </>
        )}
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* 1. Email me this */}
      {activeModal === 'email-self' && (
        <Modal title="Email me this answer" onClose={() => setActiveModal(null)}>
          <p className="text-sm text-warm-muted mb-4">We&apos;ll send the full answer to your inbox.</p>
          {emailStatus === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">✓</p>
              <p className="font-medium text-warm-black">Sent!</p>
              <p className="text-sm text-warm-muted mt-1">Check your inbox in a moment.</p>
              <button onClick={() => setActiveModal(null)} className="mt-4 text-sm underline" style={{ color: '#9B4163' }}>Close</button>
            </div>
          ) : (
            <>
              <label className="block text-xs font-medium text-warm-muted mb-1.5 uppercase tracking-widest">Your email</label>
              <input
                type="email" value={emailSelf} onChange={(e) => setEmailSelf(e.target.value)}
                placeholder="email@example.com" autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmail('self'); }}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4"
                style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }}
              />
              {emailStatus === 'error' && <p className="text-xs text-red-500 mb-3">Something went wrong. Please try again.</p>}
              <button onClick={() => handleSendEmail('self')} disabled={emailStatus === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#9B4163', color: '#fff', opacity: emailStatus === 'sending' ? 0.7 : 1 }}>
                {emailStatus === 'sending' ? 'Sending…' : 'Send to my inbox'}
              </button>
            </>
          )}
        </Modal>
      )}

      {/* 2. Follow-up question */}
      {activeModal === 'followup' && (
        <Modal title="Ask a follow-up" onClose={() => setActiveModal(null)}>
          <p className="text-xs text-warm-muted mb-3">
            Original: <em className="text-warm-gray">{decodedQuery.slice(0, 90)}{decodedQuery.length > 90 ? '…' : ''}</em>
          </p>
          <textarea
            rows={3} value={followUpText} onChange={(e) => setFollowUpText(e.target.value)}
            placeholder="What else would you like to know?" autoFocus
            className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none resize-none mb-4"
            style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }}
          />
          <button onClick={handleFollowUp} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#9B4163', color: '#fff' }}>
            Ask all 4 AIs →
          </button>
        </Modal>
      )}

      {/* 3. Email a friend */}
      {activeModal === 'email-friend' && (
        <Modal title="Email this to a friend" onClose={() => setActiveModal(null)}>
          <p className="text-sm text-warm-muted mb-4">Share this answer with someone who&apos;d find it useful.</p>
          {emailStatus === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">✓</p>
              <p className="font-medium text-warm-black">Sent!</p>
              <p className="text-sm text-warm-muted mt-1">Your friend should have it shortly.</p>
              <button onClick={() => setActiveModal(null)} className="mt-4 text-sm underline" style={{ color: '#9B4163' }}>Close</button>
            </div>
          ) : (
            <>
              <label className="block text-xs font-medium text-warm-muted mb-1.5 uppercase tracking-widest">Optional note</label>
              <textarea
                rows={2} value={emailNote} onChange={(e) => setEmailNote(e.target.value)}
                placeholder="Thought you&apos;d find this helpful…"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none resize-none mb-4"
                style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }}
              />
              <label className="block text-xs font-medium text-warm-muted mb-1.5 uppercase tracking-widest">Friend&apos;s email</label>
              <input
                type="email" value={emailFriend} onChange={(e) => setEmailFriend(e.target.value)}
                placeholder="friend@example.com" autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmail('friend'); }}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4"
                style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }}
              />
              {emailStatus === 'error' && <p className="text-xs text-red-500 mb-3">Something went wrong. Please try again.</p>}
              <button onClick={() => handleSendEmail('friend')} disabled={emailStatus === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#9B4163', color: '#fff', opacity: emailStatus === 'sending' ? 0.7 : 1 }}>
                {emailStatus === 'sending' ? 'Sending…' : 'Send to friend'}
              </button>
            </>
          )}
        </Modal>
      )}

      {/* 4. Share on socials */}
      {activeModal === 'social' && (
        <Modal title="Share on socials" onClose={() => setActiveModal(null)}>
          <p className="text-sm text-warm-muted mb-5">Share this answer with your network.</p>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {[
              { id: 'twitter',  label: '𝕏  Twitter / X', bg: '#000',    color: '#fff' },
              { id: 'linkedin', label: 'in  LinkedIn',    bg: '#0077B5', color: '#fff' },
              { id: 'whatsapp', label: '💬 WhatsApp',     bg: '#25D366', color: '#fff' },
              { id: 'facebook', label: 'f  Facebook',     bg: '#1877F2', color: '#fff' },
            ].map(({ id, label, bg, color }) => (
              <button key={id} onClick={() => handleSocialShare(id)}
                className="py-3 px-4 rounded-xl text-sm font-semibold transition-opacity"
                style={{ background: bg, color, opacity: shareLoading ? 0.6 : 1 }}>
                {shareLoading ? '…' : label}
              </button>
            ))}
          </div>
          <div className="pt-4" style={{ borderTop: '1px solid #EDE8E3' }}>
            <button onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#FAF7F5', color: '#4A4540', border: '1px solid #EDE8E3' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Link copied!' : 'Copy link instead'}
            </button>
          </div>
        </Modal>
      )}

      {/* 5. Save your answers */}
      {activeModal === 'save' && (
        <Modal title="Save your answers" onClose={() => setActiveModal(null)}>
          {saveStatus === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">✓</p>
              <p className="font-medium text-warm-black">You&apos;re on the list!</p>
              <p className="text-sm text-warm-muted mt-1 leading-relaxed">We&apos;ll let you know when saved history is live.</p>
              <button onClick={() => setActiveModal(null)} className="mt-4 text-sm underline" style={{ color: '#9B4163' }}>Close</button>
            </div>
          ) : (
            <>
              <div className="rounded-xl p-4 mb-5" style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}>
                <p className="text-sm font-medium" style={{ color: '#9B4163' }}>Coming soon</p>
                <p className="text-sm text-warm-gray mt-1 leading-relaxed">
                  Create a free account to save answers, build a personal history, and get smarter responses over time.
                </p>
              </div>
              <label className="block text-xs font-medium text-warm-muted mb-1.5 uppercase tracking-widest">Your email</label>
              <input
                type="email" value={saveEmail} onChange={(e) => setSaveEmail(e.target.value)}
                placeholder="email@example.com" autoFocus
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4"
                style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }}
              />
              <button onClick={handleSaveSignup} disabled={saveStatus === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#9B4163', color: '#fff', opacity: saveStatus === 'sending' ? 0.7 : 1 }}>
                {saveStatus === 'sending' ? 'Saving…' : 'Notify me when it\'s ready'}
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
