export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream max-w-2xl mx-auto px-6 py-16">
      <a href="/" className="text-sm text-warm-muted hover:text-warm-black mb-8 inline-block transition-colors">← Back</a>
      <h1 className="font-serif text-4xl font-bold text-warm-black mb-5">About AskWomensAI</h1>
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
