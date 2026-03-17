import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.askwomensai.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/questions`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/weird`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/about`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/terms`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // All curated question slugs
  const supabase = getSupabase();
  const { data } = await supabase
    .from('curated_questions')
    .select('slug, created_at')
    .order('created_at', { ascending: true })
    .limit(600);

  const questionPages: MetadataRoute.Sitemap = (data ?? []).map((q) => ({
    url: `${base}/q/${q.slug}`,
    lastModified: q.created_at ? new Date(q.created_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...questionPages];
}
