# Handover — 2026-03-17
## Session Summary: Gemini Fix, Follow-Up Questions, Age Capture

---

## ✅ COMPLETED THIS SESSION

### 1. Gemini Fixed (fully working)
- Migrated from deprecated `@google/generative-ai` (EOL Nov 30, 2025) to `@google/genai` (current official SDK)
- Model updated to `gemini-2.5-flash` (Google's current stable model)
- Provider timeout increased from 30s → 60s (Gemini 2.5-flash needs more time)
- Safety settings properly typed with `HarmCategory` / `HarmBlockThreshold` enums from new SDK
- TypeScript build error fixed (string literals → typed enums)
- **Gemini is now live and returning answers**

### 2. Female Context Injection
- All queries sent to the 4 AI providers are automatically enriched with `(I am a woman)`
- Smart detection — skips injection if query already contains female language
- User never sees the enrichment — only the clean original question is displayed
- Lives in `lib/ai/prompts.ts` as `enrichQueryForWoman()`

### 3. AI-Powered Follow-Up Questions
- New endpoint: `app/api/followup-questions/route.ts`
- Uses `gpt-4o-mini` (~$0.001/call) to generate 2-3 intelligent, contextual follow-up questions
- Appears inline below search box after user hits "Ask all AIs"
- Loading spinner: "Personalizing your questions…"
- All questions skippable — user can always skip and go straight to results
- Fails silently — if API errors, skips straight to results
- Answers woven into enriched query sent to 4 AIs
- User always sees clean original question on results page (`dq` param)

### 4. Age Range Chips + DB Capture
- Age question auto-injected as FIRST follow-up when topic is age-relevant (50+ keyword triggers)
- Renders as clickable pill chips: `Under 18`, `18–24`, `25–29`, `30–34`, `35–39`, `40–44`, `45–49`, `50–54`, `55–59`, `60+`
- One-tap select/deselect — fast, non-intrusive, feels like a quiz not a form
- Age stored in `search_requests.age_range` on every qualifying search
- SQL migration run and confirmed: `supabase/migrations/008_age_range.sql`
- Indexed for fast segmentation queries: `idx_search_requests_age_range`
- Age also woven into enriched query (`Age range: 35–39`) so AIs factor it into answers
- **Primary purpose: user segmentation and future monetization**

---

## 📦 FILES CHANGED THIS SESSION

```
lib/ai/providers/gemini.ts          — full rewrite with new SDK + safety enums
lib/ai/prompts.ts                   — added enrichQueryForWoman()
lib/ai/types.ts                     — timeout 30s → 60s
lib/db.ts                           — added age_range param to persistSearch()
app/api/search/route.ts             — reads ageRange from body, passes to persistSearch()
app/api/followup-questions/route.ts — NEW: AI-generated follow-up questions endpoint
app/page.tsx                        — follow-up panel, age chips, enriched query nav
app/results/[id]/page.tsx           — reads dq param, shows clean display query
package.json                        — @google/generative-ai → @google/genai
supabase/migrations/008_age_range.sql — NEW: age_range column on search_requests
```

---

## 🗤️ CURRENT STATE OF THE SITE

- **Live at:** https://www.askwomensai.com
- All 4 AI providers working (ChatGPT, Gemini, Claude, Grok)
- Female context injected on every query
- Follow-up question panel live on homepage
- Age range chips appear for health/wellness queries
- Age data capturing to Supabase on every search
- Action bar on results page: email, follow-up, share link, socials, save
- QOTD banner in header
- Email signups capturing to Supabase + notification to kelly@askwomensai.com

---

## ⏭️ UP NEXT — 500 QUESTIONS LIBRARY (HIGHEST PRIORITY)

**This is the next build. Start Session A immediately.**

Full build plan is in: `handovers/2026-03-17_questions_library_build_plan.md`

### Quick Summary
- **Session A:** DB migration + Claude generates all 500 questions + insert into Supabase
- **Session B:** Build seed pipeline + run all 500 through live AI system (~$15-40 one-time cost)
- **Session C:** Build 500 individual SEO pages at `/q/[slug]`
- **Session D:** `/questions` index page + `/weird` page + nav links + sitemap

### Key decisions already made:
- Click-through lands on full results page (`/results/[id]`) with 4-AI loading experience
- Weird Questions = own nav link in header
- Answer generation = one-time cost at Rob's expense, cached forever after
- Age relevance already built — the follow-up question system will naturally enrich seeded questions too

### Starting prompt for next session:
> "Read the latest handover in rbender-boop/womensai and start Session A of the 500 questions build."

---

## 🔧 ARCHITECTURE NOTES FOR FUTURE CLAUDE

- **Never rebuild from scratch** — the app is live and deployed
- **Always read existing files before editing** — repo has evolved significantly
- **SQL migrations:** Always paste SQL in chat AND push to GitHub
- **Display query vs enriched query:** `q` param = full enriched query sent to API. `dq` param = clean original shown to user. Always use `dq` for display.
- **Age range:** Stored in `search_requests.age_range`. Passed as `ar` URL param from homepage to results page. Results page reads `ar` and passes as `ageRange` in the search POST body.
- **Female enrichment:** Happens in `lib/ai/prompts.ts` — `enrichQueryForWoman()`. Never do this on the client side.
- **Gemini model:** `gemini-2.5-flash` via `@google/genai` SDK. Do NOT revert to old SDK.
- **Timeout:** 60s for all providers. Do not lower.

---

## Repo
`rbender-boop/womensai` — all changes on `main`

## Live Site
`https://www.askwomensai.com`
