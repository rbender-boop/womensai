# AskWomensAI — Handover Document
Last updated: March 16, 2026

---

## Product Summary
**AskWomensAI** — a web app that fans out health questions to ChatGPT, Gemini, Claude, and Grok in parallel, then synthesizes a Best Answer, Consensus, and Disagreements.

**Target audience:** Women navigating health decisions
**Positioning:** Multiple AI perspectives on health questions, not just one

---

## Live URLs
- Production: https://askwomensai.com (live — DNS propagated)
- Vercel fallback: https://womensai.vercel.app
- GitHub repo: https://github.com/rbender-boop/womensai

---

## Local Dev
- Folder: C:\Users\rbend\Desktop\everygpt
- Run: npm run dev
- Local URL: http://localhost:3000

---

## Tech Stack
- Next.js 16 + TypeScript + Tailwind CSS
- Fonts: Playfair Display (headings) + DM Sans (body)
- Vercel (hosting — auto-deploys on every git push to main)
- Supabase (DB + pgvector cache — fully configured and live)
- All 4 AI providers wired via official APIs

---

## API Keys Status
⚠️ ALL 4 KEYS WERE EXPOSED IN CHAT THIS SESSION — REGENERATE IMMEDIATELY:
- ANTHROPIC_API_KEY ⚠️ regenerate
- OPENAI_API_KEY ⚠️ regenerate
- GEMINI_API_KEY ⚠️ regenerate
- XAI_API_KEY ⚠️ regenerate

---

## Models Configured (.env.local)
- OpenAI: gpt-4o-mini
- Anthropic: claude-haiku-4-5-20251001
- Gemini: gemini-2.0-flash
- xAI: grok-3-mini
- Synthesis: claude-sonnet-4-6 (via Anthropic)

---

## Supabase — FULLY CONFIGURED ✅
- Project: womensai
- URL: https://ptwbencantiparwuwnvb.supabase.co
- SUPABASE_URL ✅ in .env.local and Vercel
- SUPABASE_ANON_KEY ✅ in .env.local and Vercel
- SUPABASE_SERVICE_ROLE_KEY ✅ in .env.local and Vercel
- Migration 001_init.sql ✅ run (search_requests, provider_results, compiled_results tables)
- Migration 002_cache.sql ✅ run (query_cache table + pgvector + RPCs)

---

## Domain Portfolio
- askwomensai.com ✅ Owned, expires Mar 16, 2028 — LIVE, DNS pointing to Vercel
- womensgpt.com ✅ Owned, expires Mar 16, 2028 — parked
- getwomensai.com ✅ Owned, expires Mar 16, 2031 — parked
- womensai.com ❌ Leased only — $10k buyout, not worth it

---

## Branding
- Product name: AskWomensAI
- Logo: "AskWomens" (serif, warm black) + "AI" (serif, rosewood #9B4163)
- Font: Playfair Display (headings) + DM Sans (body)
- Background: cream #FBF8F5
- Accent: rosewood #9B4163
- Warm borders: #EDE8E3

---

## Homepage Copy (current)
- Headline: "Your health questions, answered by every AI, from one search."
- "every AI" underlined in rosewood
- Subheadline: "Stop trusting one AI with your health. AskWomensAI asks ChatGPT, Gemini, Claude, and Grok simultaneously..."
- Breathing tagline (above search box, 18px, italic serif, rosewood, slow opacity pulse):
  "Because one AI's opinion isn't enough for decisions that matter."

---

## Example Questions (homepage) — ALL PRE-CACHED ✅
1. What are the best natural ways to manage PCOS symptoms?
2. Is it safe to take melatonin every night long-term?
3. What are signs of perimenopause vs regular PMS?
4. How do I talk to my doctor about getting my hormones tested?
5. What are the early warning signs of breast cancer I should watch for?
6. What body changes are normal for girls going through puberty?

---

## Cache System — LIVE ✅
Two-layer query cache built in lib/cache.ts:
- Layer 1: Exact hash match (SHA-256 of normalized query) → Supabase query_cache table
- Layer 2: Semantic similarity (pgvector cosine, threshold 0.92) → same table
- Embeddings: OpenAI text-embedding-3-small (near-zero cost)
- All 6 homepage example questions pre-seeded → $0 cost on repeat clicks
- Every new real query auto-saves to cache going forward
- Re-seed anytime: npx tsx scripts/seed-cache.ts

---

## What's Working
- Homepage with hero, search box, breathing tagline, example prompts
- /api/search — fan-out to all 4 providers + synthesis
- Results page — Best Answer, Consensus, Disagreements, Raw tabs
- Prominent loading state with progress bar + AI status cards
- 2-layer Supabase cache (exact + semantic) — live and seeded
- Rate limiting (IP-based, 5/day) — in-memory fallback only (no Upstash)
- About, Pricing, Privacy, Terms pages
- Mobile responsive
- Auto-deploys to Vercel on git push

---

## What's NOT Yet Done
- Upstash Redis — rate limiting falls back to in-memory (low priority, works fine for now)
- Email (Resend) — not set up
- Stripe — not set up
- Analytics (PostHog) — not set up
- Native mobile app — planned for v2

---

## Pricing Plan
- Free: 5 searches/day, no account required
- Pro: $9.99/month (coming soon) — unlimited, saved history, follow-ups

---

## Next Steps (Priority Order)
1. ⚠️ Regenerate all 4 API keys (exposed in chat this session)
2. Test a live search end-to-end on askwomensai.com
3. Set up PostHog analytics (NEXT_PUBLIC_POSTHOG_KEY) → add to Vercel + .env.local
4. Set up Upstash Redis for persistent rate limiting (low priority)
5. Seed launch communities: r/WomensHealth, r/PCOS, r/Menopause, r/TryingForABaby
6. Mobile app (React Native) — v2 after web traction

---

## Key Decisions — Do Not Revisit
- Niche: women's health
- Domain: askwomensai.com
- Free tier: 5/day, no account required
- Synthesis always runs on Claude (Anthropic)
- Cache layer: Supabase only (no Redis needed)
- No ads, no vendor bias — ever
- Mobile app is v2

---

## How to Resume Next Session
Tell Claude:
"Read the handover file at C:\Users\rbend\Desktop\everygpt\handovers\AskWomensAI_Handover_2026-03-16.md before we start.
The app is live at askwomensai.com. Pick up from the Next Steps list."
