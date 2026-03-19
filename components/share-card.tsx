'use client';

import { Mail, Copy, Check } from 'lucide-react';

interface ShareCardProps {
  onShareSocial: (platform: string) => void;
  onEmailFriend: () => void;
  onCopyLink: () => void;
  shareLoading: boolean;
  copied: boolean;
}

const SOCIALS = [
  { id: 'twitter',  label: '\ud835\udd4f', name: 'Twitter / X', bg: '#000',    color: '#fff' },
  { id: 'whatsapp', label: '\ud83d\udcac', name: 'WhatsApp',   bg: '#25D366', color: '#fff' },
  { id: 'facebook', label: 'f',             name: 'Facebook',   bg: '#1877F2', color: '#fff' },
  { id: 'linkedin', label: 'in',            name: 'LinkedIn',   bg: '#0077B5', color: '#fff' },
];

export function ShareCard({ onShareSocial, onEmailFriend, onCopyLink, shareLoading, copied }: ShareCardProps) {
  return (
    <div className="lg:w-[180px] shrink-0 lg:sticky lg:top-20 lg:self-start">
      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #EDE8E3' }}>
        <p className="text-xs font-medium text-warm-muted uppercase tracking-widest mb-3">Share this</p>

        {/* Social row (horizontal on mobile, vertical on desktop) */}
        <div className="flex flex-row lg:flex-col gap-2">
          {SOCIALS.map(({ id, label, name, bg, color }) => (
            <button
              key={id}
              onClick={() => onShareSocial(id)}
              title={name}
              className="flex items-center justify-center lg:justify-start gap-2 rounded-xl text-xs font-semibold transition-opacity
                         w-9 h-9 lg:w-full lg:h-auto lg:py-2 lg:px-3"
              style={{ background: bg, color, opacity: shareLoading ? 0.6 : 1 }}
            >
              <span>{label}</span>
              <span className="hidden lg:inline">{name}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="my-3" style={{ borderTop: '1px solid #EDE8E3' }} />

        {/* Email a friend */}
        <button
          onClick={onEmailFriend}
          className="w-full flex items-center gap-2 text-xs font-medium py-2.5 px-3 rounded-xl transition-colors mb-2"
          style={{ background: '#F7ECF0', color: '#9B4163', border: '1px solid #E8C4D0' }}
        >
          <Mail size={12} />
          Email a friend
        </button>

        {/* Copy link */}
        <button
          onClick={onCopyLink}
          className="w-full flex items-center gap-2 text-xs font-medium py-2.5 px-3 rounded-xl transition-colors"
          style={{ background: '#FAF7F5', color: '#4A4540', border: '1px solid #EDE8E3' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
