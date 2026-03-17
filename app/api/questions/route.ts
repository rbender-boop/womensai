import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category');
  const ageGroup = searchParams.get('age_group');
  const weird = searchParams.get('weird');
  const featured = searchParams.get('featured');
  const limit = Math.min(Number(searchParams.get('limit') || 200), 600);

  let query = supabase
    .from('curated_questions')
    .select('id, slug, question, category, age_group, is_weird, is_featured')
    .order('category', { ascending: true })
    .order('question', { ascending: true })
    .limit(limit);

  if (category) query = query.eq('category', category);
  if (ageGroup) query = query.eq('age_group', ageGroup);
  if (weird === 'true') query = query.eq('is_weird', true);
  if (featured === 'true') query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions: data ?? [] });
}
