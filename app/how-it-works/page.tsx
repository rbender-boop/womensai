import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works | AskWomensAI',
  description:
    'AskWomensAI queries ChatGPT, Gemini, Claude, and Grok in parallel and compiles a synthesized answer in under 60 seconds. One question, four AIs, one clear answer.',
  alternates: { canonical: 'https://www.askwomensai.com/how-it-works' },
  openGraph: {
    title: 'How It Works | AskWomensAI',
    description: 'One question. Four AIs. One compiled answer in under 60 seconds.',
    url: 'https://www.askwomensai.com/how-it-works',
    images: [{ url: 'https://www.askwomensai.com/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | AskWomensAI',
    description: 'One question. Four AIs. One compiled answer in under 60 seconds.',
    images: ['https://www.askwomensai.com/opengraph-image'],
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>

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
          <a href="/" className="flex items-center">
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 700, color: '#1C1714' }}>AskWomens</span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 700, color: '#8B3058', fontStyle: 'italic' }}>AI</span>
          </a>
          <nav className="hidden sm:flex items-center gap-7 text-sm" style={{ color: '#7A6E67' }}>
            <a href="/#why-different">Why us</a>
            <a href="/how-it-works" style={{ color: '#8B3058', fontWeight: 600 }}>How it works</a>
            <a href="/about">About</a>
            <a
              href="/"
              className="text-sm font-semibold px-5 py-2.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)',
                color: '#fff',
                boxShadow: '0 2px 14px rgba(139,48,88,0.28)',
              }}
            >
              Ask a question
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#9B4163', letterSpacing: '3.5px' }}>The process</p>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 700,
            color: '#1C1714',
            lineHeight: 1.1,
          }}>
            How it works
          </h1>
          <p className="mt-5 mx-auto" style={{ color: '#7A6E67', fontSize: '16px', maxWidth: '480px', lineHeight: 1.8 }}>
            One question. Four AIs. One compiled answer &#8212; in 60 seconds or less.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Ask once',
              desc: 'Type your question one time. No need to open four browser tabs or wonder which AI to trust.',
            },
            {
              num: '02',
              title: 'All four AIs answer',
              desc: 'ChatGPT, Gemini, Claude, and Grok all respond in parallel &#8212; usually in under 30 seconds.',
            },
            {
              num: '03',
              title: 'Get a compiled answer',
              desc: 'See what they agree on, where they differ, and a synthesized best answer to guide your next step.',
            },
          ].map(({ num, title, desc }) => (
            <div key={num} className="flex flex-col gap-4 rounded-3xl p-8" style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(212,167,185,0.35)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 12px rgba(139,48,88,0.06)',
            }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '52px', fontWeight: 700, color: 'rgba(155,65,99,0.16)', lineHeight: 1 }}>{num}</div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700, color: '#1C1714' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#7A6E67' }} dangerouslySetInnerHTML={{ __html: desc }} />
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl p-10 text-center" style={{
          background: 'linear-gradient(145deg, rgba(155,65,99,0.07) 0%, rgba(122,48,80,0.10) 100%)',
          border: '1.5px solid rgba(212,167,185,0.4)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 700, color: '#1C1714', marginBottom: '12px' }}>
            Ready to try it?
          </h2>
          <p style={{ color: '#7A6E67', fontSize: '15px', marginBottom: '28px' }}>
            5 free questions per day. No account required.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-3.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #9B4163 0%, #7A3050 100%)',
              color: '#fff',
              boxShadow: '0 4px 18px rgba(139,48,88,0.32)',
            }}
          >
            Ask your first question &#8594;
          </a>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid rgba(212,167,185,0.25)', background: 'rgba(253,245,248,0.7)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#7A6E67' }}>
          <div className="flex items-center">
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#1C1714' }}>AskWomens</span>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#8B3058', fontStyle: 'italic' }}>AI</span>
            <span className="ml-2 text-xs" style={{ color: '#AFA8A2' }}>&#169; 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" style={{ fontSize: '12px' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: '12px' }}>Terms</a>
            <a href="/about" style={{ fontSize: '12px' }}>About</a>
          </div>
          <p className="text-xs" style={{ color: '#AFA8A2', maxWidth: '280px', lineHeight: 1.6 }}>
            For research only. Always consult a qualified healthcare provider.
          </p>
        </div>
      </footer>
    </div>
  );
}
