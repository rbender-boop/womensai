'use client';

import { useState } from 'react';

export default function CronTestPage() {
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function trigger() {
    if (!secret) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/cron/qotd', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif', maxWidth: 540, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>QOTD Cron Test</h1>
      <p style={{ fontSize: 14, color: '#7A6E67', marginBottom: 28 }}>
        Paste your <code>CRON_SECRET</code> and click Run. This generates today&apos;s Question of the Day and sends it to all subscribers.
      </p>

      <input
        type="password"
        placeholder="Paste your CRON_SECRET here"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 14,
          border: '1.5px solid #DCA8C0',
          borderRadius: 10,
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      <button
        onClick={trigger}
        disabled={loading || !secret}
        style={{
          background: 'linear-gradient(135deg, #9B4163, #7A3050)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '11px 28px',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          opacity: !secret ? 0.5 : 1,
        }}
      >
        {loading ? 'Running...' : 'Run QOTD Cron'}
      </button>

      {result && (
        <pre style={{
          marginTop: 24,
          background: '#FAF7F5',
          border: '1px solid #EDE8E3',
          borderRadius: 10,
          padding: 16,
          fontSize: 13,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {result}
        </pre>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: '#AFA8A2' }}>
        Delete or protect this page before going fully public.
      </p>
    </div>
  );
}
