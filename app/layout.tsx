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
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'AskWomensAI',
    description: 'Your health questions, answered by every AI.',
    url: SITE_URL,
    siteName: 'AskWomensAI',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AskWomensAI \u2014 Your health questions, answered by every AI.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AskWomensAI',
    description: 'Your health questions, answered by every AI.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'AskWomensAI',
      url: 'https://www.askwomensai.com',
      description:
        'AskWomensAI queries ChatGPT, Gemini, Claude, and Grok simultaneously and compiles synthesized answers to women\'s health, fitness, wellness, and beauty questions.',
      foundingLocation: 'Michigan, USA',
      sameAs: ['https://www.linkedin.com/in/robert-bender-3b86b24a/'],
    },
    {
      '@type': 'WebSite',
      name: 'AskWomensAI',
      url: 'https://www.askwomensai.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate:
            'https://www.askwomensai.com/questions?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} font-sans antialiased bg-cream text-warm-black`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {/* Question of the Day \u2014 appears above every page */}
        <QotdBanner />
        {/* Track page views for admin dashboard */}
        <PageViewTracker />
        {children}
      </body>
    </html>
  );
}
