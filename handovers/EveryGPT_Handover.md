# AskWomensAI — Handover Document
Last updated: March 16, 2026

---

## Product Summary
**AskWomensAI** — a web app that fans out health questions to ChatGPT, Gemini, Claude, and Grok in parallel, then synthesizes a Best Answer, Consensus, and Disagreements.

**Target audience:** Women navigating health decisions
**Positioning:** Multiple AI perspectives on health questions, not just one

---

## Live URLs
- Production: https://askwomensai.com (DNS propagating as of today)
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
- Vercel (hosting)
- Supabase (DB — not yet configured)
- Upstash Redis (rate limiting — not yet configured)
- All 4 AI providers wired via official APIs

---

## API Keys Status
All 4 keys are in .env.local AND in Vercel environment variables:
- ANTHROPIC_API_KEY ✅
- OPENAI_API_KEY ✅
- GEMINI_API_KEY ✅
- XAI_API_KEY ✅

⚠️ NOTE: All 4 keys were shared in chat and should be regenerated ASAP.

---

## Models Configured
- OpenAI: gpt-4o-mini
- Anthropic: claude-haiku-4-5-20251001
- Gemini: gemini-2.0-flash
- xAI: grok-3-mini
- Synthesis: claude-sonnet-4-6 (via Anthropic)

---

## Domain Portfolio
- askwomensai.com ✅ Owned outright, expires Mar 16, 2028 — IN USE
- womensgpt.com ✅ Owned outright, expires Mar 16, 2028 — parked
- getwomensai.com ✅ Owned outright, expires Mar 16, 2031 — parked
- womensai.com ❌ Leased only — $10k buyout, not worth it at this stage

---

## Branding
- Product name: AskWomensAI
- Logo: "Womens" (serif, warm black) + "AI" (serif, rosewood #9B4163)
- Font: Playfair Display (headings) + DM Sans (body)
- Palette: Cream background #FBF8F5, rosewood accent #9B4163, warm borders

---

## What's Working
- Homepage with hero, search box, example prompts
- /api/search — fan-out to all 4 providers + synthesis
- Results page — Best Answer, Consensus, Disagreements, Raw tabs
- Rate limiting (IP-based, 5/day) — needs Upstash Redis to be fully active
- About, Pricing, Privacy, Terms pages
- Mobile responsive

---

## What's NOT Yet Configured
- Supabase — tables created (migration SQL ready) but no credentials in .env
- Upstash Redis — rate limiting falls back to in-memory without it
- Email (Resend) — not set up
- Stripe — not set up
- Analytics (PostHog) — not set up

---

## Pricing Plan
- Free: 5 searches/day, no account required
- Pro: $9.99/month (coming soon) — unlimited, saved history, follow-ups

---

## Next Steps (Priority Order)
1. ⚠️ Regenerate all 4 API keys (they were shared in chat)
2. Set up Supabase — run migrations/001_init.sql, add credentials to Vercel env vars
3. Set up Upstash Redis — add credentials for real rate limiting
4. Test a live search end-to-end on askwomensai.com
5. Set up PostHog analytics
6. Seed Reddit communities (r/WomensHealth, r/PCOS, r/Menopause)
7. Mobile app (React Native) — v2, after web traction

---

## Key Decisions Made — Do Not Revisit
- Niche: women's health
- Domain: askwomensai.com
- Free tier: 5/day, no account required
- Synthesis layer always runs on Claude (Anthropic)
- No ads, no vendor bias — ever
- Mobile app is v2, not v1

---

## Prompt to Resume Next Session
"Read the handover file at C:\Users\rbend\Desktop\everygpt\handovers\EveryGPT_Handover.md before we start. The app is live at askwomensai.com. Pick up from the Next Steps list."
