'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles, CheckCheck, GitFork, AlignLeft, AlertCircle,
  RotateCcw, Home, Mail, X, Copy, Check, BookmarkPlus,
  ChevronDown, ChevronRight, Send, Share2, ArrowLeft,
} from 'lucide-react';
import type { ProviderResult, CompiledResult } from '@/types/search';
import { AuthGateModal } from '@/components/auth-gate-modal';

interface ThreadEntry {
  id: string;
  displayQuestion: string;
  providers: ProviderResult[];
  rawStream: string;
  bestAnswer: string;
  consensus: string[];
  disagreements: string[];
  notes: string;
  status: 'loading' | 'streaming' | 'done' | 'error';
  error?: string;
  requestId?: string;
  cached?: boolean;
}

function emptyEntry(id: string, dq: string): ThreadEntry {
  return { id, displayQuestion: dq, providers: [], rawStream: '', bestAnswer: '', consensus: [], disagreements: [], notes: '', status: 'loading' };
}

function extractBestAnswer(raw: string): string {
  let t = raw;
  const p = t.match(/^BEST_ANSWER:\s*/i);
  if (p) t = t.slice(p[0].length);
  const s = t.match(/\n(?:CONSENSUS|DISAGREEMENTS|NOTES):/i);
  if (s && s.index !== undefined) t = t.slice(0, s.index);
  return t.trim();
}

function FormattedAnswer({ text, streaming }: { text: string; streaming?: boolean }) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => {
        const parts = p.split(/(\*\*[^*]+\*\*)/);
        return (
          <p key={i} className="text-sm leading-relaxed" style={{ color: '#7A6E67' }}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="font-semibold" style={{ color: '#1C1714' }}>{part.slice(2, -2)}</strong>
                : part
            )}
            {streaming && i === paragraphs.length - 1 && (
              <span className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom" style={{ background: '#9B4163', animation: 'blink 1s step-end infinite' }} />
            )}
          </p>
        );
      })}
      {paragraphs.length === 0 && streaming && (
        <p className="text-sm" style={{ color: '#7A6E67' }}>
          <span className="inline-block w-0.5 h-4 align-text-bottom" style={{ background: '#9B4163', animation: 'blink 1s step-end infinite' }} />
        </p>
      )}
    </div>
  );
}

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

const SOCIALS = [
  { id: 'twitter',  label: '\ud835\udd4f', name: 'Twitter / X', bg: '#000',    color: '#fff' },
  { id: 'whatsapp', label: '\ud83d\udcac', name: 'WhatsApp',   bg: '#25D366', color: '#fff' },
  { id: 'facebook', label: 'f',             name: 'Facebook',   bg: '#1877F2', color: '#fff' },
  { id: 'linkedin', label: 'in',            name: 'LinkedIn',   bg: '#0077B5', color: '#fff' },
];

function Collapsible({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div style={{ borderTop: '1px solid #EDE8E3' }}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 w-full py-3.5 text-sm font-medium" style={{ color: '#4A4540' }}>
        {open ? <ChevronDown size={14} style={{ color: '#9B4163' }} /> : <ChevronRight size={14} style={{ color: '#AFA8A2' }} />}
        {icon}
        <span>{title}</span>
        <span className="text-xs" style={{ color: '#AFA8A2' }}>({count})</span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function RawResponses({ providers }: { providers: ProviderResult[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(() => providers.find(p => p.status === 'success')?.provider || 'chatgpt');
  const active = providers.find(p => p.provider === tab);
  const successCount = providers.filter(p => p.status === 'success').length;
  if (successCount === 0) return null;
  return (
    <div style={{ borderTop: '1px solid #EDE8E3' }}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 w-full py-3.5 text-sm font-medium" style={{ color: '#4A4540' }}>
        {open ? <ChevronDown size={14} style={{ color: '#9B4163' }} /> : <ChevronRight size={14} style={{ color: '#AFA8A2' }} />}
        <AlignLeft size={13} style={{ color: '#7A6E67' }} />
        <span>Raw Responses</span>
        <span className="text-xs" style={{ color: '#AFA8A2' }}>({successCount})</span>
      </button>
      {open && (
        <div className="pb-4">
          <div className="flex gap-2 mb-3 flex-wrap">
            {providers.map((p) => (
              <button
                key={p.provider}
                onClick={() => setTab(p.provider)}
                className="text-xs px-3 py-1 rounded-lg border font-medium transition-all"
                style={tab === p.provider
                  ? { background: '#9B4163', color: '#fff', borderColor: '#9B4163' }
                  : { background: '#F7ECF0', color: '#9B4163', borderColor: '#E8C4D0' }}
              >
                {p.label}
                {p.status !== 'success' && <span className="ml-1 opacity-60">(n/a)</span>}
              </button>
            ))}
          </div>
          {active && active.status === 'success' ? (
            <div className="rounded-xl p-4" style={{ background: '#FAF7F5', border: '1px solid #EDE8E3' }}>
              <div className="flex items-center gap-2 mb-2">
                {(() => { const s = PROVIDER_STYLES[active.provider]; return s ? <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} /> : null; })()}
                <span className="text-xs font-medium" style={{ color: PROVIDER_STYLES[active.provider]?.text || '#7A6E67' }}>{active.label}</span>
                <span className="text-xs" style={{ color: '#AFA8A2' }}>{active.model}</span>
                {active.latencyMs && <span className="text-xs ml-auto" style={{ color: '#AFA8A2' }}>{(active.latencyMs / 1000).toFixed(1)}s</span>}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#7A6E67' }}>{active.text}</p>
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: '#AFA8A2' }}>This provider was unavailable.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(30,20,25,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6 relative shadow-xl" style={{ border: '1px solid #EDE8E3' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: '#1C1714' }}>{title}</h3>
          <button onClick={onClose} style={{ color: '#AFA8A2' }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get('q') || '';
  const displayQuery = params.get('dq') ? decodeURIComponent(params.get('dq')!) : query ? decodeURIComponent(query) : '';

  const [thread, setThread] = useState<ThreadEntry[]>([]);
  const [followUp, setFollowUp] = useState('');
  const initialized = useRef(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [user, setUser] = useState<{ id: string; firstName: string; email: string } | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [emailSelf, setEmailSelf] = useState('');
  const [emailFriend, setEmailFriend] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [saveEmail, setSaveEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    try { const s = localStorage.getItem('wai_user'); if (s) setUser(JSON.parse(s)); } catch {}
  }, []);

  const addEntry = useCallback(async (q: string, dq: string) => {
    const entryId = crypto.randomUUID();
    setThread((prev) => [...prev, emptyEntry(entryId, dq)]);
    setShareSlug(null);

    const update = (changes: Partial<ThreadEntry>) =>
      setThread((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...changes } : e)));

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, stream: true }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({ error: 'Something went wrong.' }));
        update({ error: json.error || 'Something went wrong.', status: 'error' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop()!;

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'cached') {
              update({
                providers: data.providers,
                bestAnswer: data.compiled.bestAnswer,
                consensus: data.compiled.consensus,
                disagreements: data.compiled.disagreements,
                notes: data.compiled.notes || '',
                status: 'done',
                requestId: data.requestId,
                cached: true,
              });
            } else if (data.type === 'providers') {
              update({ providers: data.providers, requestId: data.requestId, status: 'streaming' });
            } else if (data.type === 'text') {
              setThread((prev) =>
                prev.map((e) =>
                  e.id === entryId ? { ...e, rawStream: e.rawStream + data.delta } : e
                )
              );
            } else if (data.type === 'done') {
              update({
                bestAnswer: data.compiled.bestAnswer,
                consensus: data.compiled.consensus,
                disagreements: data.compiled.disagreements,
                notes: data.compiled.notes || '',
                requestId: data.requestId,
                status: 'done',
              });
            } else if (data.type === 'error') {
              update({ error: data.error, status: 'error' });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      update({ error: 'Network error \u2014 please check your connection.', status: 'error' });
    }
  }, []);

  useEffect(() => {
    if (query && !initialized.current) {
      initialized.current = true;
      addEntry(query, displayQuery);
    }
  }, [query, displayQuery, addEntry]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread]);

  function handleFollowUp() {
    const t = followUp.trim();
    if (!t || t.length < 8) return;
    addEntry(t, t);
    setFollowUp('');
  }

  const latestDone = [...thread].reverse().find((e) => e.status === 'done');

  async function getShareUrl(): Promise<string> {
    if (shareSlug) return `${window.location.origin}/a/${shareSlug}`;
    if (!latestDone) return window.location.href;
    setShareLoading(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: latestDone.displayQuestion,
          compiled: { bestAnswer: latestDone.bestAnswer, consensus: latestDone.consensus, disagreements: latestDone.disagreements, notes: latestDone.notes },
          providers: latestDone.providers,
          requestId: latestDone.requestId,
        }),
      });
      const json = await res.json();
      if (json.slug) { setShareSlug(json.slug); return `${window.location.origin}/a/${json.slug}`; }
    } catch {} finally { setShareLoading(false); }
    return window.location.href;
  }

  async function handleCopyLink() {
    const url = await getShareUrl();
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement('textarea'); el.value = url; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleSocialShare(platform: string) {
    const url = await getShareUrl();
    const dq = latestDone?.displayQuestion || displayQuery;
    const text = `I asked ChatGPT, Gemini, Claude & Grok: "${dq.slice(0, 80)}" \u2014 here\u2019s what they said:`;
    const eu = encodeURIComponent(url);
    const et = encodeURIComponent(text);
    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${et}&url=${eu}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${eu}&title=${et}`,
      whatsapp: `https://wa.me/?text=${et}%20${eu}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${eu}`,
    };
    window.open(links[platform], '_blank', 'noopener,noreferrer');
  }

  async function handleSendEmail(type: 'self' | 'friend') {
    const to = type === 'self' ? emailSelf : emailFriend;
    if (!to || !to.includes('@')) return;
    setEmailStatus('sending');
    try {
      const shareUrl = await getShareUrl();
      const compiled = latestDone ? { bestAnswer: latestDone.bestAnswer, consensus: latestDone.consensus, disagreements: latestDone.disagreements, notes: latestDone.notes } : null;
      const res = await fetch('/api/email-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, query: latestDone?.displayQuestion || displayQuery, compiled, shareUrl, type, note: emailNote }),
      });
      setEmailStatus(res.ok ? 'sent' : 'error');
    } catch { setEmailStatus('error'); }
  }

  function handleEmailFriendClick() {
    if (!user) { setPendingAction('email-friend'); setShowAuthGate(true); return; }
    openModal('email-friend');
  }
  function handleAuthSuccess(u: { id: string; firstName: string; email: string }) {
    setUser(u); setShowAuthGate(false);
    if (pendingAction === 'email-friend') openModal('email-friend');
    setPendingAction(null);
  }
  async function handleSaveSignup() {
    if (!saveEmail || !saveEmail.includes('@')) return;
    setSaveStatus('sending');
    try { await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: saveEmail, source: 'save_answers_cta' }) }); } catch {}
    setSaveStatus('sent');
  }
  function openModal(id: string) { setActiveModal(id); setEmailStatus('idle'); setSaveStatus('idle'); }

  const anyLoading = thread.some((e) => e.status === 'loading' || e.status === 'streaming');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FBF8F5' }}>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {anyLoading && (
        <div className="fixed top-0 left-0 w-full z-50 overflow-hidden" style={{ height: '3px', background: '#F0E9E1' }}>
          <div className="h-full" style={{ background: 'linear-gradient(90deg, #F7ECF0, #9B4163, #C97A9A, #9B4163)', backgroundSize: '200% 100%', animation: 'progressSlide 1.8s ease-in-out infinite', width: '50%' }} />
        </div>
      )}

      {/* Header with back button */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid #EDE8E3' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: '#7A6E67', background: '#FAF7F5', border: '1px solid #EDE8E3' }}>
              <ArrowLeft size={14} />
              Back
            </button>
            <button onClick={() => router.push('/')} className="flex items-center gap-0.5">
              <span className="font-serif font-bold" style={{ color: '#1C1714' }}>AskWomens</span>
              <span className="font-serif font-bold" style={{ color: '#9B4163' }}>AI</span>
            </button>
          </div>
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm" style={{ color: '#7A6E67' }}>
            <RotateCcw size={13} /> New question
          </button>
        </div>
      </header>

      {/* Thread */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full space-y-5">
        {thread.map((entry, idx) => {
          const isLatest = idx === thread.length - 1;
          const displayBa = entry.status === 'done' ? entry.bestAnswer : extractBestAnswer(entry.rawStream);

          return (
            <div key={entry.id} className="space-y-3">
              {/* Question bubble */}
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-md px-5 py-3 max-w-[85%]" style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}>
                  <p className="text-sm font-medium" style={{ color: '#1C1714' }}>{entry.displayQuestion}</p>
                </div>
              </div>

              {/* Loading */}
              {entry.status === 'loading' && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EDE8E3' }}>
                  <p className="text-xs font-medium uppercase tracking-widest mb-4 text-center" style={{ color: '#AFA8A2' }}>Querying all four AIs\u2026</p>
                  <div className="grid grid-cols-4 gap-2">
                    {AI_CARDS.map(({ label, color, bg, border, dot, delay }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2" style={{ background: bg, border: `1px solid ${border}` }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: dot, animation: 'aiPulse 1.4s ease-in-out infinite', animationDelay: delay }} />
                        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center mt-3" style={{ color: '#AFA8A2' }}>Usually 15\u201330 seconds</p>
                </div>
              )}

              {/* Error */}
              {entry.status === 'error' && (
                <div className="flex items-start gap-3 rounded-2xl p-5" style={{ background: '#FDF0F2', border: '1px solid #F0BECA' }}>
                  <AlertCircle size={17} className="shrink-0 mt-0.5" style={{ color: '#C0394F' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#9B2035' }}>{entry.error}</p>
                    <button onClick={() => { setThread(p => p.filter(e => e.id !== entry.id)); addEntry(query, entry.displayQuestion); }} className="mt-2 text-sm underline" style={{ color: '#9B4163' }}>Try again</button>
                  </div>
                </div>
              )}

              {/* Answer card */}
              {(entry.status === 'streaming' || entry.status === 'done') && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EDE8E3' }}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#9B4163' }}>
                      <Sparkles size={12} style={{ color: '#fff' }} />
                    </div>
                    <h2 className="font-semibold text-sm" style={{ color: '#1C1714' }}>Best Answer</h2>
                    <span className="text-xs ml-auto" style={{ color: '#AFA8A2' }}>
                      {entry.status === 'streaming' ? 'Synthesizing\u2026' : 'Synthesized from all responses'}
                    </span>
                  </div>

                  <FormattedAnswer text={displayBa} streaming={entry.status === 'streaming'} />

                  {entry.status === 'done' && (
                    <div className="mt-4">
                      <Collapsible
                        title="Consensus"
                        icon={<CheckCheck size={13} style={{ color: '#2F6B2B' }} />}
                        count={entry.consensus.length}
                      >
                        <ul className="space-y-2">
                          {entry.consensus.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#7A6E67' }}>
                              <span className="mt-0.5 shrink-0 text-xs" style={{ color: '#4A9645' }}>{'\u2713'}</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Collapsible>

                      <Collapsible
                        title="Disagreements"
                        icon={<GitFork size={13} style={{ color: '#8A5E1A' }} />}
                        count={entry.disagreements.length}
                      >
                        <ul className="space-y-2">
                          {entry.disagreements.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#7A6E67' }}>
                              <span className="mt-0.5 shrink-0" style={{ color: '#B08030' }}>{'\u2260'}</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Collapsible>

                      <RawResponses providers={entry.providers} />

                      {entry.notes && (
                        <p className="text-xs pt-3 leading-relaxed" style={{ color: '#AFA8A2', borderTop: '1px solid #EDE8E3' }}>{entry.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Share & Actions card (prominent, separate card below answer) */}
              {entry.status === 'done' && isLatest && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EDE8E3' }}>
                  <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#9B4163', letterSpacing: '2px' }}>Share this answer</p>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {SOCIALS.map(({ id, label, name, bg, color }) => (
                      <button
                        key={id}
                        onClick={() => handleSocialShare(id)}
                        className="flex items-center gap-2 rounded-xl text-xs font-semibold py-2.5 px-4 transition-opacity"
                        style={{ background: bg, color, opacity: shareLoading ? 0.6 : 1 }}
                      >
                        <span>{label}</span>
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleEmailFriendClick} className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl" style={{ background: '#F7ECF0', color: '#9B4163', border: '1px solid #E8C4D0' }}>
                      <Mail size={14} /> Email a friend
                    </button>
                    <button onClick={() => openModal('email-self')} className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl" style={{ background: '#FAF7F5', color: '#4A4540', border: '1px solid #EDE8E3' }}>
                      <Mail size={14} /> Email me this
                    </button>
                    <button onClick={handleCopyLink} className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl" style={{ background: '#FAF7F5', color: '#4A4540', border: '1px solid #EDE8E3' }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <button onClick={() => openModal('save')} className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl" style={{ background: '#F7ECF0', color: '#9B4163', border: '1px solid #E8C4D0' }}>
                      <BookmarkPlus size={14} /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {latestDone && (
          <div className="rounded-2xl px-5 py-3 text-xs leading-relaxed" style={{ background: '#F7ECF0', border: '1px solid #E8C4D0', color: '#7A3050' }}>
            <strong>Important:</strong> AI responses are for informational purposes only. Not medical advice. Always consult a qualified healthcare provider.
          </div>
        )}

        <div ref={threadEndRef} />
      </main>

      {/* Follow-up input */}
      {latestDone && (
        <div className="sticky bottom-0 z-10" style={{ background: 'linear-gradient(transparent, #FBF8F5 30%)' }}>
          <div className="max-w-3xl mx-auto px-4 pb-5 pt-8">
            <div className="bg-white rounded-2xl flex items-center gap-2 px-4 py-2.5" style={{ border: '1.5px solid #E8C4D0', boxShadow: '0 4px 24px rgba(139,48,88,0.08)' }}>
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFollowUp(); }}
                placeholder="Ask a follow-up\u2026"
                disabled={anyLoading}
                className="flex-1 text-sm bg-transparent outline-none disabled:opacity-50"
                style={{ color: '#1C1714' }}
              />
              <button
                onClick={handleFollowUp}
                disabled={followUp.trim().length < 8 || anyLoading}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors"
                style={{ background: '#9B4163', color: '#fff' }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthGate && (
        <AuthGateModal
          onClose={() => { setShowAuthGate(false); setPendingAction(null); }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {activeModal === 'email-self' && (
        <Modal title="Email me this answer" onClose={() => setActiveModal(null)}>
          {emailStatus === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">{'\u2713'}</p>
              <p className="font-medium" style={{ color: '#1C1714' }}>Sent!</p>
              <p className="text-sm mt-1" style={{ color: '#AFA8A2' }}>Check your inbox.</p>
              <button onClick={() => setActiveModal(null)} className="mt-4 text-sm underline" style={{ color: '#9B4163' }}>Close</button>
            </div>
          ) : (
            <>
              <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#AFA8A2' }}>Your email</label>
              <input type="email" value={emailSelf} onChange={(e) => setEmailSelf(e.target.value)} placeholder="email@example.com" autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmail('self'); }}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4" style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }} />
              {emailStatus === 'error' && <p className="text-xs text-red-500 mb-3">Something went wrong.</p>}
              <button onClick={() => handleSendEmail('self')} disabled={emailStatus === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#9B4163', color: '#fff', opacity: emailStatus === 'sending' ? 0.7 : 1 }}>
                {emailStatus === 'sending' ? 'Sending\u2026' : 'Send to my inbox'}
              </button>
            </>
          )}
        </Modal>
      )}

      {activeModal === 'email-friend' && (
        <Modal title="Email this to a friend" onClose={() => setActiveModal(null)}>
          {emailStatus === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">{'\u2713'}</p>
              <p className="font-medium" style={{ color: '#1C1714' }}>Sent!</p>
              <button onClick={() => setActiveModal(null)} className="mt-4 text-sm underline" style={{ color: '#9B4163' }}>Close</button>
            </div>
          ) : (
            <>
              <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#AFA8A2' }}>Optional note</label>
              <textarea rows={2} value={emailNote} onChange={(e) => setEmailNote(e.target.value)} placeholder="Thought you'd find this helpful\u2026"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none resize-none mb-4" style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }} />
              <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#AFA8A2' }}>Friend&apos;s email</label>
              <input type="email" value={emailFriend} onChange={(e) => setEmailFriend(e.target.value)} placeholder="friend@example.com" autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmail('friend'); }}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4" style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }} />
              {emailStatus === 'error' && <p className="text-xs text-red-500 mb-3">Something went wrong.</p>}
              <button onClick={() => handleSendEmail('friend')} disabled={emailStatus === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#9B4163', color: '#fff', opacity: emailStatus === 'sending' ? 0.7 : 1 }}>
                {emailStatus === 'sending' ? 'Sending\u2026' : 'Send to friend'}
              </button>
            </>
          )}
        </Modal>
      )}

      {activeModal === 'save' && (
        <Modal title="Save your answers" onClose={() => setActiveModal(null)}>
          {saveStatus === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">{'\u2713'}</p>
              <p className="font-medium" style={{ color: '#1C1714' }}>You&apos;re on the list!</p>
              <p className="text-sm mt-1" style={{ color: '#AFA8A2' }}>We&apos;ll let you know when saved history is live.</p>
              <button onClick={() => setActiveModal(null)} className="mt-4 text-sm underline" style={{ color: '#9B4163' }}>Close</button>
            </div>
          ) : (
            <>
              <div className="rounded-xl p-4 mb-5" style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}>
                <p className="text-sm font-medium" style={{ color: '#9B4163' }}>Coming soon</p>
                <p className="text-sm mt-1" style={{ color: '#7A6E67' }}>Save answers, build history, get smarter responses.</p>
              </div>
              <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#AFA8A2' }}>Your email</label>
              <input type="email" value={saveEmail} onChange={(e) => setSaveEmail(e.target.value)} placeholder="email@example.com" autoFocus
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4" style={{ border: '1px solid #EDE8E3', background: '#FAF7F5' }} />
              <button onClick={handleSaveSignup} disabled={saveStatus === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#9B4163', color: '#fff', opacity: saveStatus === 'sending' ? 0.7 : 1 }}>
                {saveStatus === 'sending' ? 'Saving\u2026' : "Notify me when it's ready"}
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
