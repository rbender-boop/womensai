# AskWomensAI — Session Handover
**Date:** March 17, 2026
**Repo:** github.com/rbender-boop/womensai
**Live site:** askwomensai.com (Vercel, auto-deploys on push to main)

---

## What Was Built This Session

### Session A — DB Foundation ✅
- Created `supabase/migrations/007_curated_questions.sql`
- 549 curated questions across 12 categories inserted into `curated_questions` table
- Table has: slug, question, category, age_group, is_weird, is_featured, search_request_id, seeded_at, meta_title, meta_description

### Session B — Seed Pipeline ✅
- Built `app/api/admin/seed-questions/route.ts`
- Protected by `ADMIN_SECRET` header
- Processes questions in batches, skips already-cached ones
- Tracks completion via `seeded_at` column (not FK)
- **CURRENTLY RUNNING OVERNIGHT** — PowerShell loop seeding all 549 questions
- Uses `seeded_at` (not `search_request_id`) to track progress

### Session C — SEO Pages ✅
- Built `app/api/questions/route.ts` — filterable questions API
- Built `app/q/[slug]/page.tsx` — server component with generateStaticParams, generateMetadata, FAQ JSON-LD
- Built `app/q/[slug]/client.tsx` — client UI matching site design language
- Pages show: question, category, teaser from best_answer, CTA → fires search from cache

---

## Session D — What To Build Next

### Goal: Discovery pages live. Users can browse the full library.

### 1. `app/questions/page.tsx` — Questions Index
- Category filter tabs/pills (12 categories)
- Age group filter
- All 549 questions as clickable links to `/q/[slug]`
- SSG from DB at build time
- Clean card grid layout matching site design

### 2. `app/weird/page.tsx` — Weird Questions Page
- ~50 questions flagged `is_weird = true`
- Different vibe — playful, punchy
- Large question text, minimal chrome
- One-tap share buttons (Twitter/X + WhatsApp) pre-filled with question + URL
- Same answer-gate mechanic as `/q/[slug]`

### 3. Update `components/header.tsx` (or inline header in page.tsx)
- Add "Questions" link → `/questions`
- Add "Weird" link → `/weird`
- These go in the nav alongside existing links

### 4. Update `app/sitemap.ts`
- Add all `/q/[slug]` URLs
- Add `/questions` and `/weird`

---

## Key Technical Notes

- **Cache hit mechanic**: `/api/search` checks cache on every query. Pre-seeded questions resolve instantly. Loading animation still plays (~2-3s artificial minimum).
- **Static generation**: `generateStaticParams()` on `/q/[slug]` — all pages pre-built at deploy.
- **Seeder safety**: If seeder is still running, already-cached questions are skipped (checkExactCache). Safe to redeploy at any time.
- **`seeded_at` column**: Was added this session via Supabase SQL Editor. Used instead of FK to track seeding progress.

---

## Current File Structure (key new files)

```
app/
  q/[slug]/
    page.tsx        ← SSG SEO page (server component)
    client.tsx      ← Client UI component
  api/
    questions/route.ts      ← GET questions with filters
    admin/seed-questions/route.ts  ← POST seeder (batch, protected)
scripts/
  generate-questions.py    ← Generated the 549 questions + SQL
supabase/migrations/
  007_curated_questions.sql  ← Table + 549 inserts
```

---

## Supabase Notes
- `curated_questions` table exists with `seeded_at` column added
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are now set in Vercel
- `ADMIN_SECRET = afdasdfd9191asfsd` set in Vercel

---

## Design System (apply to all new pages)
- Background: `linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)`
- Font: Playfair Display (headings, `var(--font-playfair)`), DM Sans (body, `font-sans`)
- Primary color: `#9B4163` (rose/plum)
- Text: `#1C1714` (headings), `#7A6E67` (body), `#AFA8A2` (muted)
- Cards: `rgba(255,255,255,0.80)` + `backdropFilter: blur(12px)` + `border: 1px solid rgba(212,167,185,0.35)`
- Buttons: `linear-gradient(135deg, #9B4163 0%, #7A3050 100%)` + `boxShadow: 0 4px 18px rgba(139,48,88,0.32)`
- Border accent: `rgba(212,167,185,0.35)`
- Animations: `floatIn` keyframe (opacity 0→1, translateY 18px→0)

---

## Repo
`rbender-boop/womensai` — all on `main`
Last commit: `feat: Session C — /q/[slug] SEO pages + questions API`
