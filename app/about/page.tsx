export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream max-w-2xl mx-auto px-6 py-16">
      <a href="/" className="text-sm text-warm-muted hover:text-warm-black mb-8 inline-block transition-colors">← Back</a>
      <h1 className="font-serif text-4xl font-bold text-warm-black mb-8">About AskWomensAI</h1>

      {/* Trust block — leads the page */}
      <div
        className="rounded-2xl px-7 py-6 mb-10"
        style={{ background: '#F7ECF0', border: '1px solid #E8C4D0' }}
      >
        <p className="text-warm-black font-semibold leading-relaxed mb-3">
          AskWomensAI is a Michigan-based company utilizing the best of generative AI. We are a transparent health information provider.
        </p>
        <ul className="space-y-2 text-sm text-warm-gray leading-relaxed">
          <li>✓ &nbsp;We do not sell, share, or profit from your personal information.</li>
          <li>✓ &nbsp;We do not disclose your questions to any third party.</li>
          <li>✓ &nbsp;Your privacy is paramount to our success and will be fully maintained.</li>
        </ul>
        <p className="mt-4 text-sm font-semibold" style={{ color: '#9B4163' }}>
          This project was built by women, for women.
        </p>
      </div>

      {/* Original about copy */}
      <p className="text-warm-gray leading-relaxed mb-4">
        AskWomensAI was built because no single AI has all the answers — especially on health topics where nuance matters and uncertainty is real.
      </p>
      <p className="text-warm-gray leading-relaxed mb-4">
        By querying ChatGPT, Gemini, Claude, and Grok in parallel and synthesizing their responses, AskWomensAI helps you walk into conversations with your doctor better informed — not to replace that conversation.
      </p>
      <p className="text-warm-gray leading-relaxed mb-4">
        The synthesis layer is the product. We don&apos;t just dump four answers side-by-side. We identify what the models agree on, where they differ, and what you should consider next.
      </p>
      <p className="text-warm-gray leading-relaxed">
        AskWomensAI is built specifically with women&apos;s health in mind — a space where AI datasets have historically been incomplete, and where having multiple perspectives matters most.
      </p>
    </div>
  );
}
