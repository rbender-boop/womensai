# EveryGPT — Session Handover

## What Was Built / Decided This Session

### Product
- **EveryGPT** — an app that sends one question to ChatGPT, Gemini, Claude, and Grok in parallel, then synthesizes the results into: Best Answer, Consensus, Disagreements, and Raw Responses.
- Full build plan is in the project file: `everygpt_v1_claude_build_plan.md`

### Positioning (Locked)
- **Target audience:** Women in America navigating health decisions
- **Core value prop:** "The AI health advisor that shows you what multiple AIs actually think — not just one."
- **Distribution ignition:** Reddit communities — r/WomensHealth, r/PCOS, r/Menopause, r/TryingForABaby, r/pregnant
- **Tone:** Warm, practical, credible, no hype. "Use this to walk into your appointment better informed."
- **Key trust requirement:** Strong but empowering disclaimer copy baked into the product voice, not buried fine print. Hard guardrails on crisis/self-harm content.

### Monetization (Locked)
- **Model:** Freemium
- **Free tier:** 5 searches/day
- **Paid tier:** $9.99/month — unlimited searches, saved history, follow-up questions
- **Launch promo:** $0.99 first month, auto-renews at $9.99
- **Do NOT monetize the synthesis layer** — all revenue comes from around the product, never from influencing results

### Tech Stack (From Build Plan)
- **Frontend:** Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js route handlers
- **DB/Auth:** Supabase
- **Hosting:** Vercel
- **Rate limiting:** Upstash Redis
- **AI APIs:** OpenAI, Anthropic, Google Gemini, xAI (Grok)
- **Analytics:** PostHog or Plausible
- **Errors:** Sentry

---

## Environment

- **Machine:** Windows (PowerShell)
- **Node:** v24.13.1
- **npm:** v11.8.0
- **Project folder:** Create fresh at `C:\Users\rbend\Desktop\EveryGPT`
- **Domain:** everygpt.com (hosted on GoDaddy — will point to Vercel)
- **User's other stack:** Supabase + Vercel already in use on other projects

---

## Where to Start Next Session

### Step 1 — Scaffold the app
**IMPORTANT:** npm does not allow capital letters in project names. Create the folder manually in Windows Explorer as `EveryGPT`, then run this from inside it:

```powershell
Set-Location "C:\Users\rbend\Desktop\EveryGPT"
npx create-next-app@latest . --typescript --tailwind --app --no-eslint --no-src-dir --import-alias "@/*" --yes
```

If that still fails due to the folder name, run from Desktop and use lowercase, then rename:
```powershell
Set-Location "C:\Users\rbend\Desktop"
npx create-next-app@latest everygpt --typescript --tailwind --app --no-eslint --no-src-dir --import-alias "@/*" --yes
```
Then rename the folder to EveryGPT in Explorer — it won't break anything on Windows.

### Step 2 — Install additional dependencies
```powershell
npm install @anthropic-ai/sdk openai @google/generative-ai @supabase/supabase-js @upstash/ratelimit @upstash/redis zod react-hook-form framer-motion lucide-react
npx shadcn@latest init
```

### Step 3 — Create `.env.local`
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
XAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
GEMINI_MODEL=gemini-2.0-flash
XAI_MODEL=grok-3-mini
SYNTHESIS_PROVIDER=anthropic
SYNTHESIS_MODEL=claude-sonnet-4-6
FREE_DAILY_LIMIT=5
ENABLE_OPENAI=true
ENABLE_GEMINI=true
ENABLE_ANTHROPIC=true
ENABLE_XAI=true
```

### Step 4 — Build in this order
1. Provider abstraction layer (`/lib/ai/`)
2. `/api/search` route handler
3. Synthesis engine
4. Homepage with search box
5. Results page
6. Rate limiting
7. Supabase logging tables

---

## Key Decisions Already Made — Do Not Revisit
- Niche: women's health (not B2B software, not teenagers, not broad)
- Freemium at $9.99/month
- Free tier = 5 searches/day
- Launch promo = $0.99 first month
- Synthesis layer must stay 100% unbiased — no pay-to-influence ever
- Launch free first, introduce paid at month 3–6

---

## Prompt to Start the Next Session
Paste this to the new Claude:

"Read this handover file and the build plan file `everygpt_v1_claude_build_plan.md` in the project. We are ready to start building. The folder is at C:\Users\rbend\Desktop\EveryGPT. Scaffold the Next.js app, install dependencies, and start with the provider abstraction layer and the /api/search route."
