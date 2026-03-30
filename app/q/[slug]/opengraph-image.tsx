import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('curated_questions')
    .select('question')
    .eq('slug', params.slug)
    .single();

  const question = data?.question ?? "Women's health, answered by every AI.";
  const fontSize = question.length > 90 ? '38px' : question.length > 60 ? '44px' : '52px';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #FDF0EF 0%, #FBF8F5 50%, #F6EFF9 100%)',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '26px', fontWeight: 700, color: '#1C1714', fontFamily: 'serif' }}>
            AskWomens
          </span>
          <span style={{ fontSize: '26px', fontWeight: 700, color: '#8B3058', fontStyle: 'italic', fontFamily: 'serif' }}>
            AI
          </span>
        </div>
        <div
          style={{
            fontSize,
            fontWeight: 700,
            color: '#1C1714',
            lineHeight: 1.2,
            maxWidth: '1000px',
            fontFamily: 'serif',
          }}
        >
          {question}
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '20px', color: '#9B4163' }}>
          <span>ChatGPT</span>
          <span style={{ color: '#C9A0B0' }}>&#183;</span>
          <span>Gemini</span>
          <span style={{ color: '#C9A0B0' }}>&#183;</span>
          <span>Claude</span>
          <span style={{ color: '#C9A0B0' }}>&#183;</span>
          <span>Grok</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
