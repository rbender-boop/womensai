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
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'signed_up_at';
  const sortDir = searchParams.get('dir') === 'asc' ? true : false;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('email_signups')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: signups, count } = await query
      .order(sortBy, { ascending: sortDir })
      .range(offset, offset + limit - 1);

    const enriched = await Promise.all(
      (signups || []).map(async (signup: Record<string, unknown>) => {
        const { data: userRow } = await supabase
          .from('users')
          .select('id, age_range, life_stage, question_count, tier, anonymous_session_id')
          .eq('email', signup.email as string)
          .maybeSingle();

        let questionCategories: Record<string, number> = {};
        let questionCount = 0;

        if (userRow?.anonymous_session_id) {
          const { data: qs } = await supabase
            .from('search_requests')
            .select('category')
            .eq('anonymous_session_id', userRow.anonymous_session_id)
            .not('category', 'is', null);
          
          (qs || []).forEach((q: { category: string }) => {
            questionCategories[q.category] = (questionCategories[q.category] || 0) + 1;
          });
          questionCount = (qs || []).length;
        }

        return {
          id: signup.id,
          email: signup.email,
          signedUpAt: signup.signed_up_at,
          source: signup.source,
          userId: userRow?.id || null,
          ageRange: userRow?.age_range || null,
          lifeStage: userRow?.life_stage || null,
          tier: userRow?.tier || 'free',
          questionCount: userRow?.question_count || questionCount,
          questionCategories,
        };
      })
    );

    return NextResponse.json({
      users: enriched,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Delete from email_signups
    const { error: signupErr } = await supabase
      .from('email_signups')
      .delete()
      .eq('email', email);

    if (signupErr) {
      console.error('Delete signup error:', signupErr);
    }

    // Delete from users table if exists
    const { error: userErr } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (userErr) {
      console.error('Delete user error:', userErr);
    }

    return NextResponse.json({ ok: true, deleted: email });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
