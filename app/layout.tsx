import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'WomensAI — Your health questions, answered by every AI.',
  description:
    'WomensAI asks ChatGPT, Gemini, Claude, and Grok at the same time — then compiles the clearest answer, highlights where they agree, and flags where they differ.',
  openGraph: {
    title: 'WomensAI',
    description: 'Your health questions, answered by every AI.',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} font-sans antialiased bg-cream text-warm-black`}
      >
        {children}
      </body>
    </html>
  );
}
