# EveryGPT

Ask once. Get every AI's answer. Built for women navigating health decisions.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (Postgres + optional auth)
- **Upstash Redis** (rate limiting)
- **OpenAI, Anthropic, Google Gemini, xAI** (provider APIs)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.local` and fill in your API keys:
```bash
cp .env.local .env.local
```

Required keys:
| Key | Source |
|-----|--------|
| `OPENAI_API_KEY` | platform.openai.com |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `GEMINI_API_KEY` | aistudio.google.com |
| `XAI_API_KEY` | console.x.ai |
| `SUPABASE_URL` | supabase.com project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com project settings |
| `UPSTASH_REDIS_REST_URL` | console.upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | console.upstash.com |

> Supabase and Upstash are optional in development — the app will skip persistence and rate limiting if not configured.

### 3. Set up Supabase (optional but recommended)
Run the migration in `supabase/migrations/001_init.sql` against your Supabase project via the SQL editor.

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How it works

1. User submits a question on the homepage
2. `/api/search` fans out to all 4 providers in parallel
3. Responses are synthesized into Best Answer / Consensus / Disagreements
4. Results are displayed and optionally persisted to Supabase

## Rate limiting

Default: 5 searches/day per IP. Configurable via `FREE_DAILY_LIMIT` env var. Requires Upstash Redis. In dev without Redis, rate limiting is bypassed.

## Provider models (configurable via env)

| Provider | Default model |
|----------|--------------|
| OpenAI | gpt-4o-mini |
| Anthropic | claude-haiku-4-5-20251001 |
| Gemini | gemini-2.0-flash |
| xAI | grok-3-mini |
| Synthesis | claude-sonnet-4-6 (Anthropic) |

## Deploy

Push to GitHub and connect to Vercel. Add all env vars in Vercel project settings. Point `NEXT_PUBLIC_APP_URL` to your production domain.
