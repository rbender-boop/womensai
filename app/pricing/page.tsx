import { InteriorHeader } from '@/components/interior-header';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <InteriorHeader />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-bold text-warm-black mb-8">Pricing</h1>

        {/* Free tier */}
        <div className="bg-white border border-warm-border rounded-2xl p-6 mb-4">
          <h2 className="font-semibold text-warm-black mb-1">Free</h2>
          <p className="text-3xl font-bold text-warm-black mb-4">$0</p>
          <ul className="text-sm text-warm-gray space-y-2.5">
            <li className="flex items-center gap-2"><span style={{ color: '#9B4163' }}>\u2713</span> 5 questions per day</li>
            <li className="flex items-center gap-2"><span style={{ color: '#9B4163' }}>\u2713</span> All four AI models</li>
            <li className="flex items-center gap-2"><span style={{ color: '#9B4163' }}>\u2713</span> Best Answer, Consensus, Disagreements</li>
            <li className="flex items-center gap-2"><span style={{ color: '#9B4163' }}>\u2713</span> No account required</li>
          </ul>
        </div>

        {/* Pro tier */}
        <div className="rounded-2xl p-6" style={{ background: '#9B4163' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-white">Pro</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#F7ECF0', color: '#9B4163' }}>
              Coming soon
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-4">
            $9.99<span className="text-sm font-normal opacity-60">/month</span>
          </p>
          <ul className="text-sm space-y-2.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <li className="flex items-center gap-2"><span className="opacity-100 text-white">\u2713</span> Unlimited questions</li>
            <li className="flex items-center gap-2"><span className="opacity-100 text-white">\u2713</span> Saved history</li>
            <li className="flex items-center gap-2"><span className="opacity-100 text-white">\u2713</span> Follow-up questions</li>
            <li className="flex items-center gap-2"><span className="opacity-100 text-white">\u2713</span> Faster responses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
