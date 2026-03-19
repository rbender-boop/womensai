'use client';

import { ArrowLeft, Home } from 'lucide-react';

export function InteriorHeader() {
  return (
    <header className="bg-white px-6 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid #EDE8E3' }}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: '#7A6E67' }}>
            <ArrowLeft size={14} />
            Back
          </button>
          <a href="/" className="flex items-center gap-0.5">
            <span className="font-serif font-bold text-warm-black">AskWomens</span>
            <span className="font-serif font-bold" style={{ color: '#9B4163' }}>AI</span>
          </a>
        </div>
        <a href="/" className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: '#7A6E67' }}>
          <Home size={14} />
          Home
        </a>
      </div>
    </header>
  );
}
