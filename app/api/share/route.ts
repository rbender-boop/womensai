import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function makeSlug(len = 6): string {
  return Math.random().toString(36).slice(2, 2 + len);
}

export async function POST(req: NextRequest) {
  try {
    const { query, compiled, providers, requestId } = await req.json();

    const supabase = getClient();
    if (!supabase) {
      return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    // Generate unique slug (retry up to 5 times on collision)
    let slug = makeSlug();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data } = await supabase
        .from('share_events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!data) break;
      slug = makeSlug();
    }

    const { error } = await supabase.from('share_events').insert({
      search_request_id: requestId ?? null,
      share_channel: 'link',
      slug,
      query_text: query,
      result_snapshot: { compiled, providers },
    });

    if (error) {
      console.error('Share insert error:', error);
      return NextResponse.json({ error: 'Failed to save share' }, { status: 500 });
    }

    return NextResponse.json({ slug });
  } catch (err) {
    console.error('Share route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
