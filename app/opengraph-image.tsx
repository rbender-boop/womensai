import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AskWomensAI \u2014 Your health questions, answered by every AI.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #FDF0EF 0%, #FBF8F5 50%, #F6EFF9 100%)',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#1C1714',
              letterSpacing: '-1px',
              fontFamily: 'serif',
            }}
          >
            AskWomens
          </span>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#8B3058',
              fontStyle: 'italic',
              letterSpacing: '-1px',
              fontFamily: 'serif',
            }}
          >
            AI
          </span>
        </div>
        <div
          style={{
            fontSize: '32px',
            color: '#3A342F',
            textAlign: 'center',
            maxWidth: '820px',
            marginBottom: '40px',
            lineHeight: 1.4,
          }}
        >
          Your health questions, answered by every AI.
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '20px', color: '#9B4163' }}>
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
