import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7';
  const days = parseInt(range, 10) || 7;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  try {
    // KPIs
    const [pvAll, pvRange, questionsAll, questionsRange, sharesAll, sharesRange, signupsAll, signupsRange] = await Promise.all([
      supabase.from('page_views').select('id', { count: 'exact', head: true }),
      supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('search_requests').select('id', { count: 'exact', head: true }),
      supabase.from('search_requests').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('share_events').select('id', { count: 'exact', head: true }),
      supabase.from('share_events').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('email_signups').select('id', { count: 'exact', head: true }),
      supabase.from('email_signups').select('id', { count: 'exact', head: true }).gte('signed_up_at', since),
    ]);

    // Daily breakdown
    const dailyQuestions: Record<string, number> = {};
    const dailyViews: Record<string, number> = {};
    const dailyShares: Record<string, number> = {};
    const dailySignups: Record<string, number> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      dailyQuestions[d] = 0;
      dailyViews[d] = 0;
      dailyShares[d] = 0;
      dailySignups[d] = 0;
    }

    const { data: qByDay } = await supabase.from('search_requests').select('created_at').gte('created_at', since).order('created_at', { ascending: true });
    (qByDay || []).forEach((r: { created_at: string }) => { const d = r.created_at.slice(0, 10); if (dailyQuestions[d] !== undefined) dailyQuestions[d]++; });

    const { data: vByDay } = await supabase.from('page_views').select('created_at').gte('created_at', since).order('created_at', { ascending: true });
    (vByDay || []).forEach((r: { created_at: string }) => { const d = r.created_at.slice(0, 10); if (dailyViews[d] !== undefined) dailyViews[d]++; });

    const { data: sByDay } = await supabase.from('share_events').select('created_at').gte('created_at', since).order('created_at', { ascending: true });
    (sByDay || []).forEach((r: { created_at: string }) => { const d = r.created_at.slice(0, 10); if (dailyShares[d] !== undefined) dailyShares[d]++; });

    const { data: suByDay } = await supabase.from('email_signups').select('signed_up_at').gte('signed_up_at', since).order('signed_up_at', { ascending: true });
    (suByDay || []).forEach((r: { signed_up_at: string }) => { const d = r.signed_up_at.slice(0, 10); if (dailySignups[d] !== undefined) dailySignups[d]++; });

    // Category breakdown
    const { data: catData } = await supabase.from('search_requests').select('category').gte('created_at', since).not('category', 'is', null);
    const categoryBreakdown: Record<string, number> = {};
    (catData || []).forEach((r: { category: string }) => { categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1; });

    // Top topics
    const { data: topicData } = await supabase.from('search_requests').select('primary_topic').gte('created_at', since).not('primary_topic', 'is', null);
    const topicCounts: Record<string, number> = {};
    (topicData || []).forEach((r: { primary_topic: string }) => { topicCounts[r.primary_topic] = (topicCounts[r.primary_topic] || 0) + 1; });
    const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([topic, count]) => ({ topic, count }));

    // Shares by channel
    const { data: shareChannelData } = await supabase.from('share_events').select('share_channel').gte('created_at', since);
    const sharesByChannel: Record<string, number> = {};
    (shareChannelData || []).forEach((r: { share_channel: string }) => { sharesByChannel[r.share_channel] = (sharesByChannel[r.share_channel] || 0) + 1; });

    // Recent email shares with sender/recipient
    const { data: recentEmailShares } = await supabase
      .from('share_events')
      .select('id, created_at, share_channel, sender_email, recipient_email, query_text')
      .not('recipient_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    // Recent questions
    const { data: recentQuestions } = await supabase
      .from('search_requests')
      .select('id, created_at, query_text, category, primary_topic, life_stage, age_range, status')
      .order('created_at', { ascending: false })
      .limit(50);

    // Traffic by path
    const { data: pathData } = await supabase.from('page_views').select('path').gte('created_at', since);
    const pathCounts: Record<string, number> = {};
    (pathData || []).forEach((r: { path: string }) => { pathCounts[r.path] = (pathCounts[r.path] || 0) + 1; });
    const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([path, count]) => ({ path, count }));

    return NextResponse.json({
      kpis: {
        pageViews:  { total: pvAll.count || 0, period: pvRange.count || 0 },
        questions:  { total: questionsAll.count || 0, period: questionsRange.count || 0 },
        shares:     { total: sharesAll.count || 0, period: sharesRange.count || 0 },
        signups:    { total: signupsAll.count || 0, period: signupsRange.count || 0 },
      },
      daily: { questions: dailyQuestions, views: dailyViews, shares: dailyShares, signups: dailySignups },
      categoryBreakdown,
      topTopics,
      sharesByChannel,
      recentEmailShares: recentEmailShares || [],
      recentQuestions: recentQuestions || [],
      topPaths,
      range: days,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
