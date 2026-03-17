export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-sm mb-8 inline-block" style={{ color: '#9B4163' }}>← Back</a>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 700, color: '#1C1714', marginBottom: '8px' }}>Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: '#AFA8A2' }}>Last updated: March 2026</p>
        <div className="space-y-8" style={{ color: '#7A6E67', lineHeight: 1.8, fontSize: '15px' }}>
          <section>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, color: '#1C1714', fontSize: '18px', marginBottom: '8px' }}>What we collect</h2>
            <p>We log the questions you submit, your IP address (hashed), and basic usage metadata such as response times and provider availability. If you sign up, we store your email address. We do not collect your name or any other personally identifiable information.</p>
          </section>
          <section>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, color: '#1C1714', fontSize: '18px', marginBottom: '8px' }}>How we use it</h2>
            <p>Usage data is used to enforce rate limits, improve the product, and monitor system health. Your email, if provided, is used only to send product updates you requested. We do not sell or share your data with third parties for advertising purposes.</p>
          </section>
          <section>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, color: '#1C1714', fontSize: '18px', marginBottom: '8px' }}>Third-party AI providers</h2>
            <p>Your questions are sent to OpenAI, Google, Anthropic, and xAI to generate responses. Each provider has its own privacy policy governing how they handle API requests.</p>
          </section>
          <section>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, color: '#1C1714', fontSize: '18px', marginBottom: '8px' }}>Health information</h2>
            <p>AskWomensAI is not a HIPAA-covered entity. Please do not submit personally identifying health information such as your name, date of birth, or specific diagnoses.</p>
          </section>
          <section>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, color: '#1C1714', fontSize: '18px', marginBottom: '8px' }}>Contact</h2>
            <p>For privacy questions, contact us at <a href="mailto:privacy@askwomensai.com" style={{ color: '#9B4163' }}>privacy@askwomensai.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
