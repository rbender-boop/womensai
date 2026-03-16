export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto px-6 py-16">
      <a href="/" className="text-sm text-zinc-400 hover:text-zinc-700 mb-8 inline-block">← Back</a>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-400 mb-8">Last updated: March 2025</p>
      <div className="space-y-6 text-zinc-600 leading-relaxed text-sm">
        <section>
          <h2 className="font-semibold text-zinc-900 mb-2">What we collect</h2>
          <p>We log the questions submitted to AskWomensAI, your IP address (hashed), and basic usage metadata (response times, provider availability). We do not collect names, emails, or any personally identifiable information in v1.</p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900 mb-2">How we use it</h2>
          <p>Usage data is used to enforce rate limits, improve the product, and monitor system health. We do not sell or share your query data with third parties for advertising purposes.</p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900 mb-2">Third-party AI providers</h2>
          <p>Your questions are sent to OpenAI, Google, Anthropic, and xAI to generate responses. Each provider has its own privacy policy governing how they process API requests.</p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900 mb-2">Health information</h2>
          <p>AskWomensAI is not a HIPAA-covered entity. Please do not submit personally identifying health information (your name, date of birth, specific diagnoses, etc.).</p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900 mb-2">Contact</h2>
          <p>For privacy questions, contact us at privacy@AskWomensAI.com.</p>
        </section>
      </div>
    </div>
  );
}
