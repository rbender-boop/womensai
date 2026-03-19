'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, MessageSquare, Share2, Eye, LogOut,
  Search, ChevronLeft, ChevronRight, ArrowUpDown, TrendingUp,
  Globe, Lock, RefreshCw,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
type KPI = { total: number; period: number };
type StatsData = {
  kpis: { pageViews: KPI; questions: KPI; shares: KPI; signups: KPI };
  daily: {
    questions: Record<string, number>;
    views: Record<string, number>;
    shares: Record<string, number>;
    signups: Record<string, number>;
  };
  categoryBreakdown: Record<string, number>;
  topTopics: { topic: string; count: number }[];
  sharesByChannel: Record<string, number>;
  recentQuestions: {
    id: string;
    created_at: string;
    query_text: string;
    category: string;
    primary_topic: string;
    life_stage: string;
    age_range: string;
    status: string;
  }[];
  topPaths: { path: string; count: number }[];
  range: number;
};

type UserRow = {
  id: string;
  email: string;
  signedUpAt: string;
  source: string;
  userId: string | null;
  ageRange: string | null;
  lifeStage: string | null;
  tier: string;
  questionCount: number;
  questionCategories: Record<string, number>;
};

type UsersData = {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
};

// ============================================================
// Category colors
// ============================================================
const CAT_COLORS: Record<string, string> = {
  health: '#9B4163',
  fitness: '#3B82F6',
  wellness: '#10B981',
  beauty: '#EC4899',
  nutrition: '#F59E0B',
  mental_health: '#8B5CF6',
  other: '#6B7280',
};

const CHANNEL_LABELS: Record<string, string> = {
  email_self: 'Email to Self',
  email_friend: 'Email to Friend',
  link: 'Copy Link',
  x: 'X / Twitter',
  facebook: 'Facebook',
  instagram: 'Instagram',
  native_share: 'Native Share',
};

// ============================================================
// Sparkline component (pure CSS)
// ============================================================
function Sparkline({ data, color = '#9B4163' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-sm min-w-[3px] flex-1 transition-all"
          style={{
            height: `${Math.max((v / max) * 100, 4)}%`,
            background: v > 0 ? color : 'rgba(0,0,0,0.06)',
            opacity: i === data.length - 1 ? 1 : 0.7,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Bar chart component
// ============================================================
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 text-right shrink-0" style={{ color: '#7A6E67' }}>{label}</span>
      <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, 1)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold w-10" style={{ color: '#1C1714' }}>{value}</span>
    </div>
  );
}

// ============================================================
// Login Screen
// ============================================================
function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        onAuth();
      } else {
        setErr('Invalid password');
      }
    } catch {
      setErr('Connection error');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>
      <div
        className="w-full max-w-sm p-8 rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.85)',
          border: '1.5px solid rgba(212,167,185,0.4)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 40px rgba(139,48,88,0.08)',
        }}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F7ECF0, #EDD5E2)', border: '1px solid #DCA8C0' }}>
            <Lock size={18} style={{ color: '#8B3058' }} />
          </div>
        </div>
        <h1 className="text-center text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)', color: '#1C1714' }}>Admin Portal</h1>
        <p className="text-center text-xs mb-6" style={{ color: '#AFA8A2' }}>AskWomensAI Dashboard</p>
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full text-sm px-4 py-3 rounded-xl mb-3 focus:outline-none"
          style={{ background: 'rgba(253,245,248,0.8)', border: '1px solid rgba(212,167,185,0.4)', color: '#1C1714' }}
          autoFocus
        />
        {err && <p className="text-xs mb-3" style={{ color: '#C0394F' }}>{err}</p>}
        <button
          onClick={handleLogin}
          disabled={loading || !pw}
          className="w-full text-sm font-semibold py-3 rounded-xl disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #9B4163, #7A3050)', color: '#fff', boxShadow: '0 4px 18px rgba(139,48,88,0.28)' }}
        >
          {loading ? 'Checking...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Dashboard
// ============================================================
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState<'overview' | 'questions' | 'sharing' | 'users' | 'traffic'>('overview');
  const [range, setRange] = useState(7);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UsersData | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already authed via cookie
  useEffect(() => {
    fetch('/api/admin/stats?range=7')
      .then((r) => { if (r.ok) { setAuthed(true); } })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${range}`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {}
    setLoading(false);
  }, [range]);

  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(userPage), limit: '50', search: userSearch });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {}
  }, [userPage, userSearch]);

  useEffect(() => {
    if (authed) loadStats();
  }, [authed, loadStats]);

  useEffect(() => {
    if (authed && tab === 'users') loadUsers();
  }, [authed, tab, loadUsers]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#9B4163', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onAuth={() => { setAuthed(true); }} />;
  }

  const kpis = stats?.kpis;
  const daily = stats?.daily;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'questions' as const, label: 'Questions', icon: MessageSquare },
    { id: 'sharing' as const, label: 'Sharing', icon: Share2 },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'traffic' as const, label: 'Traffic', icon: Globe },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>

      {/* Top bar */}
      <header className="sticky top-0 z-40" style={{ borderBottom: '1px solid rgba(212,167,185,0.25)', backdropFilter: 'blur(12px)', background: 'rgba(253,245,248,0.82)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700, color: '#1C1714' }}>AskWomens</span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700, color: '#8B3058', fontStyle: 'italic' }}>AI</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(155,65,99,0.08)', color: '#9B4163', border: '1px solid rgba(155,65,99,0.15)' }}>Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Range selector */}
            <select
              value={range}
              onChange={(e) => setRange(parseInt(e.target.value))}
              className="text-xs px-3 py-1.5 rounded-lg focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(212,167,185,0.3)', color: '#4A4540' }}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={loadStats} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: '#7A6E67' }} />
            </button>
            <a href="/" className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <LogOut size={14} style={{ color: '#7A6E67' }} />
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(212,167,185,0.2)' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-xl flex-1 justify-center transition-all"
              style={tab === id ? {
                background: 'rgba(255,255,255,0.9)',
                color: '#9B4163',
                boxShadow: '0 2px 8px rgba(139,48,88,0.08)',
                border: '1px solid rgba(212,167,185,0.3)',
              } : {
                color: '#7A6E67',
                background: 'transparent',
                border: '1px solid transparent',
              }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* ==================== OVERVIEW ==================== */}
        {tab === 'overview' && kpis && daily && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Page Views', kpi: kpis.pageViews, spark: Object.values(daily.views), color: '#3B82F6', icon: Eye },
                { label: 'Questions', kpi: kpis.questions, spark: Object.values(daily.questions), color: '#9B4163', icon: MessageSquare },
                { label: 'Shares', kpi: kpis.shares, spark: Object.values(daily.shares), color: '#10B981', icon: Share2 },
                { label: 'Signups', kpi: kpis.signups, spark: Object.values(daily.signups), color: '#F59E0B', icon: Users },
              ].map(({ label, kpi: k, spark, color, icon: Icon }) => (
                <div
                  key={label}
                  className="p-5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)', backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} style={{ color }} />
                    <span className="text-xs font-medium" style={{ color: '#7A6E67' }}>{label}</span>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#1C1714' }}>{k.period.toLocaleString()}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#AFA8A2' }}>{k.total.toLocaleString()} total</p>
                    </div>
                    <div className="w-20">
                      <Sparkline data={spark} color={color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Category + Topics side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1714' }}>Questions by Category</h3>
                <div className="space-y-2.5">
                  {Object.entries(stats?.categoryBreakdown || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <HBar
                        key={cat}
                        label={cat.replace('_', ' ')}
                        value={count}
                        max={Math.max(...Object.values(stats?.categoryBreakdown || {}))}
                        color={CAT_COLORS[cat] || '#6B7280'}
                      />
                    ))}
                  {Object.keys(stats?.categoryBreakdown || {}).length === 0 && (
                    <p className="text-xs" style={{ color: '#AFA8A2' }}>No category data yet</p>
                  )}
                </div>
              </div>

              {/* Top Topics */}
              <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1714' }}>Trending Topics</h3>
                <div className="space-y-2">
                  {(stats?.topTopics || []).slice(0, 10).map(({ topic, count }, i) => (
                    <div key={topic} className="flex items-center gap-3">
                      <span className="text-xs w-5 text-right font-mono" style={{ color: '#AFA8A2' }}>{i + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(155,65,99,0.06)', color: '#9B4163', border: '1px solid rgba(155,65,99,0.12)' }}>
                        {topic.replace(/_/g, ' ')}
                      </span>
                      <span className="ml-auto text-xs font-semibold" style={{ color: '#1C1714' }}>{count}</span>
                    </div>
                  ))}
                  {(stats?.topTopics || []).length === 0 && (
                    <p className="text-xs" style={{ color: '#AFA8A2' }}>No topics tagged yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== QUESTIONS ==================== */}
        {tab === 'questions' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(212,167,185,0.15)' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#1C1714' }}>Recent Questions</h3>
              <span className="text-xs" style={{ color: '#AFA8A2' }}>{(stats?.recentQuestions || []).length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(253,245,248,0.5)' }}>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Time</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Question</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Category</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Topic</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Life Stage</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Age</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentQuestions || []).map((q) => (
                    <tr key={q.id} className="border-t" style={{ borderColor: 'rgba(212,167,185,0.1)' }}>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: '#AFA8A2' }}>
                        {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                        {new Date(q.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 max-w-[300px] truncate" style={{ color: '#1C1714' }}>{q.query_text}</td>
                      <td className="px-4 py-2.5">
                        {q.category && (
                          <span className="px-2 py-0.5 rounded-full" style={{ background: `${CAT_COLORS[q.category] || '#6B7280'}15`, color: CAT_COLORS[q.category] || '#6B7280', fontSize: '10px' }}>
                            {q.category.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: '#7A6E67' }}>{q.primary_topic?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-2.5" style={{ color: '#7A6E67' }}>{q.life_stage || '—'}</td>
                      <td className="px-4 py-2.5" style={{ color: '#7A6E67' }}>{q.age_range || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full" style={{
                          fontSize: '10px',
                          background: q.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: q.status === 'success' ? '#10B981' : '#EF4444',
                        }}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(stats?.recentQuestions || []).length === 0 && (
                <p className="text-center text-xs py-8" style={{ color: '#AFA8A2' }}>No questions yet</p>
              )}
            </div>
          </div>
        )}

        {/* ==================== SHARING ==================== */}
        {tab === 'sharing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1714' }}>Shares by Channel</h3>
              <div className="space-y-2.5">
                {Object.entries(stats?.sharesByChannel || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([ch, count]) => (
                    <HBar
                      key={ch}
                      label={CHANNEL_LABELS[ch] || ch}
                      value={count}
                      max={Math.max(...Object.values(stats?.sharesByChannel || {}), 1)}
                      color="#10B981"
                    />
                  ))}
                {Object.keys(stats?.sharesByChannel || {}).length === 0 && (
                  <p className="text-xs" style={{ color: '#AFA8A2' }}>No shares yet</p>
                )}
              </div>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1714' }}>Daily Shares</h3>
              <div className="h-40">
                <Sparkline data={Object.values(stats?.daily?.shares || {})} color="#10B981" />
              </div>
              <div className="flex justify-between mt-2">
                {Object.keys(stats?.daily?.shares || {}).length > 0 && (
                  <>
                    <span className="text-[10px]" style={{ color: '#AFA8A2' }}>{Object.keys(stats?.daily?.shares || {})[0]}</span>
                    <span className="text-[10px]" style={{ color: '#AFA8A2' }}>{Object.keys(stats?.daily?.shares || {}).slice(-1)[0]}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== USERS ==================== */}
        {tab === 'users' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(212,167,185,0.15)' }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#1C1714' }}>Registered Users</h3>
                <p className="text-xs mt-0.5" style={{ color: '#AFA8A2' }}>{users?.total || 0} total</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#AFA8A2' }} />
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    className="text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none"
                    style={{ background: 'rgba(253,245,248,0.8)', border: '1px solid rgba(212,167,185,0.3)', color: '#1C1714', width: '200px' }}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(253,245,248,0.5)' }}>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Email</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Signed Up</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>ID</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Age</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Life Stage</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Questions</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: '#7A6E67' }}>Top Categories</th>
                  </tr>
                </thead>
                <tbody>
                  {(users?.users || []).map((u) => (
                    <tr key={u.id} className="border-t" style={{ borderColor: 'rgba(212,167,185,0.1)' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#1C1714' }}>{u.email}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: '#AFA8A2' }}>
                        {new Date(u.signedUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: '#AFA8A2', fontSize: '9px' }}>{u.id?.slice(0, 8)}...</td>
                      <td className="px-4 py-2.5" style={{ color: '#7A6E67' }}>{u.ageRange || '—'}</td>
                      <td className="px-4 py-2.5" style={{ color: '#7A6E67' }}>{u.lifeStage || '—'}</td>
                      <td className="px-4 py-2.5 font-semibold" style={{ color: '#1C1714' }}>{u.questionCount}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(u.questionCategories)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([cat, cnt]) => (
                              <span key={cat} className="px-1.5 py-0.5 rounded" style={{
                                fontSize: '9px',
                                background: `${CAT_COLORS[cat] || '#6B7280'}12`,
                                color: CAT_COLORS[cat] || '#6B7280',
                              }}>
                                {cat.replace('_', ' ')} ({cnt})
                              </span>
                            ))}
                          {Object.keys(u.questionCategories).length === 0 && (
                            <span style={{ color: '#AFA8A2' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(users?.users || []).length === 0 && (
                <p className="text-center text-xs py-8" style={{ color: '#AFA8A2' }}>No users found</p>
              )}
            </div>
            {/* Pagination */}
            {users && users.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(212,167,185,0.15)' }}>
                <button
                  onClick={() => setUserPage(Math.max(1, userPage - 1))}
                  disabled={userPage === 1}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg disabled:opacity-30"
                  style={{ color: '#7A6E67', background: 'rgba(253,245,248,0.5)' }}
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <span className="text-xs" style={{ color: '#AFA8A2' }}>Page {userPage} of {users.totalPages}</span>
                <button
                  onClick={() => setUserPage(Math.min(users.totalPages, userPage + 1))}
                  disabled={userPage === users.totalPages}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg disabled:opacity-30"
                  style={{ color: '#7A6E67', background: 'rgba(253,245,248,0.5)' }}
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TRAFFIC ==================== */}
        {tab === 'traffic' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1714' }}>Top Pages</h3>
              <div className="space-y-2.5">
                {(stats?.topPaths || []).map(({ path, count }) => (
                  <HBar
                    key={path}
                    label={path === '/' ? 'Homepage' : path.length > 18 ? path.slice(0, 18) + '...' : path}
                    value={count}
                    max={Math.max(...(stats?.topPaths || []).map((p) => p.count), 1)}
                    color="#3B82F6"
                  />
                ))}
                {(stats?.topPaths || []).length === 0 && (
                  <p className="text-xs" style={{ color: '#AFA8A2' }}>No page view data yet</p>
                )}
              </div>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,167,185,0.25)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1714' }}>Daily Page Views</h3>
              <div className="h-40">
                <Sparkline data={Object.values(stats?.daily?.views || {})} color="#3B82F6" />
              </div>
              <div className="flex justify-between mt-2">
                {Object.keys(stats?.daily?.views || {}).length > 0 && (
                  <>
                    <span className="text-[10px]" style={{ color: '#AFA8A2' }}>{Object.keys(stats?.daily?.views || {})[0]}</span>
                    <span className="text-[10px]" style={{ color: '#AFA8A2' }}>{Object.keys(stats?.daily?.views || {}).slice(-1)[0]}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#9B4163', borderTopColor: 'transparent' }} />
          </div>
        )}
      </main>
    </div>
  );
}
