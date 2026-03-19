'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const AGE_RANGES = ['18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65+'];

interface AuthGateModalProps {
  onClose: () => void;
  onSuccess: (user: { id: string; firstName: string; email: string }) => void;
}

const inputStyle = { border: '1px solid #EDE8E3', background: '#FAF7F5' };

export function AuthGateModal({ onClose, onSuccess }: AuthGateModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup() {
    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your name.'); return; }
    if (!ageRange) { setError('Please select your age range.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), ageRange, email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      localStorage.setItem('wai_user', JSON.stringify(data.user));
      localStorage.setItem('wai_signed_up', '1');
      onSuccess(data.user);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email.includes('@') || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid credentials.'); return; }
      localStorage.setItem('wai_user', JSON.stringify(data.user));
      localStorage.setItem('wai_signed_up', '1');
      onSuccess(data.user);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(to: 'signup' | 'login') {
    setMode(to);
    setError('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(30,20,25,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl p-6 relative shadow-xl" style={{ border: '1px solid #EDE8E3' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-warm-black">
            {mode === 'signup' ? 'Create your free account' : 'Welcome back'}
          </h3>
          <button onClick={onClose} className="text-warm-muted hover:text-warm-gray transition-colors">
            <X size={16} />
          </button>
        </div>

        {mode === 'signup' ? (
          <>
            <p className="text-sm text-warm-muted mb-4">Share answers with friends and get a personalized experience.</p>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-warm-muted mb-1 uppercase tracking-widest">First name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none" style={inputStyle} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-warm-muted mb-1 uppercase tracking-widest">Last name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none" style={inputStyle} />
              </div>
            </div>
            <label className="block text-xs font-medium text-warm-muted mb-1 uppercase tracking-widest">Age range</label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-3"
              style={{ ...inputStyle, color: ageRange ? '#1C1714' : '#AFA8A2' }}
            >
              <option value="" disabled>Select your age range</option>
              {AGE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="block text-xs font-medium text-warm-muted mb-1 uppercase tracking-widest">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-3" style={inputStyle} />
            <label className="block text-xs font-medium text-warm-muted mb-1 uppercase tracking-widest">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSignup(); }}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4" style={inputStyle}
            />
            {error && <p className="text-xs mb-3" style={{ color: '#C0394F' }}>{error}</p>}
            <button onClick={handleSignup} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#9B4163', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account\u2026' : 'Create free account'}
            </button>
            <p className="text-center text-xs text-warm-muted mt-3">
              Already have an account?{' '}
              <button onClick={() => switchMode('login')} className="underline" style={{ color: '#9B4163' }}>Log in</button>
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-warm-muted mb-4">Log in to share answers and access your account.</p>
            <label className="block text-xs font-medium text-warm-muted mb-1 uppercase tracking-widest">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoFocus className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-3" style={inputStyle} />
            <label className="block text-xs font-medium text-warm-muted mb-1 uppercase tracking-widest">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none mb-4" style={inputStyle}
            />
            {error && <p className="text-xs mb-3" style={{ color: '#C0394F' }}>{error}</p>}
            <button onClick={handleLogin} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#9B4163', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Logging in\u2026' : 'Log in'}
            </button>
            <p className="text-center text-xs text-warm-muted mt-3">
              Don&apos;t have an account?{' '}
              <button onClick={() => switchMode('signup')} className="underline" style={{ color: '#9B4163' }}>Sign up free</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
