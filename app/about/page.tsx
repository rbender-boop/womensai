import type { Metadata } from 'next';
import { InteriorHeader } from '@/components/interior-header';

export const metadata: Metadata = {
  title: 'About AskWomensAI | Built by Women, For Women',
  description:
    'AskWomensAI was built by Michigan-based entrepreneurs Robert and Kelly Bender to give women better answers to the most important questions in their lives.',
  alternates: {
    canonical: 'https://www.askwomensai.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <InteriorHeader />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-bold text-warm-black mb-8">About AskWomensAI</h1>

        {/* Trust block */}
        <div
          className="rounded-2xl px-7 py-6 mb-10"
          style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}
        >
          <p className="text-warm-black font-semibold leading-relaxed mb-3">
            AskWomensAI is a Michigan-based company utilizing the best of generative AI. We are a transparent health information provider.
          </p>
          <ul className="space-y-2 text-sm text-warm-gray leading-relaxed">
            <li>{'\u2713'}&nbsp;&nbsp;We do not sell, share, or profit from your personal information.</li>
            <li>{'\u2713'}&nbsp;&nbsp;We do not disclose your questions to any third party.</li>
            <li>{'\u2713'}&nbsp;&nbsp;Your privacy is paramount to our success and will be fully maintained.</li>
          </ul>
          <p className="mt-4 text-sm font-semibold" style={{ color: '#9B4163' }}>
            This project was built by women, for women.
          </p>
        </div>

        <p className="text-warm-gray leading-relaxed mb-4">
          AskWomensAI was built because no single AI has all the answers{' \u2014 '}especially on health topics where nuance matters and uncertainty is real.
        </p>
        <p className="text-warm-gray leading-relaxed mb-4">
          By querying ChatGPT, Gemini, Claude, and Grok in parallel and synthesizing their responses, AskWomensAI helps you walk into conversations with your doctor better informed{' \u2014 '}not to replace that conversation.
        </p>
        <p className="text-warm-gray leading-relaxed mb-4">
          The synthesis layer is the product. We don&apos;t just dump four answers side-by-side. We identify what the models agree on, where they differ, and what you should consider next.
        </p>
        <p className="text-warm-gray leading-relaxed mb-10">
          AskWomensAI is built specifically with women&apos;s health in mind{' \u2014 '}a space where AI datasets have historically been incomplete, and where having multiple perspectives matters most.
        </p>

        {/* Founders section */}
        <div
          className="rounded-2xl px-7 py-6 mb-10"
          style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(212,167,185,0.35)' }}
        >
          <h2 className="font-serif text-2xl font-bold text-warm-black mb-3">Who Built This</h2>
          <p className="text-warm-gray leading-relaxed mb-4">
            <strong className="text-warm-black">Robert &amp; Kelly Bender</strong> are Michigan-based entrepreneurs who built AskWomensAI to give women better answers to the most important questions in their lives.
          </p>
          <a
            href="https://www.linkedin.com/in/robert-bender-3b86b24a/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: '#9B4163' }}
          >
            LinkedIn &rarr;
          </a>
        </div>

        {/* Editorial approach */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-warm-black mb-3">Our Editorial Approach</h2>
          <p className="text-warm-gray leading-relaxed mb-3">
            Questions are curated to reflect the real health, fitness, wellness, and beauty questions women ask most. Every answer is synthesized from four AI models{' \u2014 '}ChatGPT, Gemini, Claude, and Grok{' \u2014 '}in parallel.
          </p>
          <p className="text-warm-gray leading-relaxed">
            AskWomensAI does not accept affiliate fees, sponsored placements, or advertiser influence. Answers are never modified for commercial purposes. Always consult a qualified healthcare provider for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
