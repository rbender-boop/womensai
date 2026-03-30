import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { QotdBanner } from '@/components/qotd-banner';
import { PageViewTracker } from '@/components/page-view-tracker';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.askwomensai.com';

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
  title: 'AskWomensAI \u2014 Your health questions, answered by every AI.',
  description:
    'AskWomensAI asks ChatGPT, Gemini, Claude, and Grok at the same time \u2014 then compiles the clearest answer, highlights where they agree, and flags where they differ.',
  openGraph: {
    title: 'AskWomensAI',
    description: 'Your health questions, answered by every AI.',
    url: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} font-sans antialiased bg-cream text-warm-black`}
      >
        {/* Question of the Day \u2014 appears above every page */}
        <QotdBanner />
        {/* Track page views for admin dashboard */}
        <PageViewTracker />
        {children}
      </body>
    </html>
  );
}
