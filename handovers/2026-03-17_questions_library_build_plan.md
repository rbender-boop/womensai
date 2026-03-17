# Handover — 2026-03-17
## Build Plan: Top 500 Questions Library + Weird Questions Section

---

## Product Decisions (Confirmed This Session)

1. **Click-through behavior on `/q/[slug]`** — User lands on the full results page (existing `/results/[id]` pattern) showing the synthesized Best Answer / Consensus / Disagreements / Raw Responses. The "4 AIs running" loading experience is shown even though answers hit cache instantly — users must feel the experience.
2. **Weird Questions** — Own nav link in the header (not a tab inside the Questions page).
3. **Answer generation** — Claude generates all 500+ questions, then they are run through the live system (Rob's expense, one-time cost ~$15–40). Results are saved to Supabase cache. On user click, the loading experience fires but resolves from cache — free and instant.

---

## Architecture Overview

### New DB Table: `curated_questions`
```sql
CREATE TABLE public.curated_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,                  -- URL-safe slug e.g. "can-women-take-creatine"
  question text NOT NULL,                     -- Full question text
  category text NOT NULL,                     -- e.g. "Health", "Fitness", "Relationships"
  age_group text,                             -- e.g. "20s", "30s", "40s", "50s+", "All"
  is_weird boolean DEFAULT false,             -- true = appears on /weird page
  is_featured boolean DEFAULT false,          -- future: homepage featured questions
  search_request_id uuid REFERENCES search_requests(id), -- FK to cached result
  meta_title text,                            -- SEO override
  meta_description text,                     -- SEO override
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_curated_questions_category ON public.curated_questions(category);
CREATE INDEX idx_curated_questions_age_group ON public.curated_questions(age_group);
CREATE INDEX idx_curated_questions_is_weird ON public.curated_questions(is_weird);
```

### Migration File
`supabase/migrations/007_curated_questions.sql`

---

## New Pages

### 1. `/questions` — Index Page
- Lists all 500 questions as clickable links
- Filterable by **category** (tabs or pills): Health, Fitness, Relationships, Career, Money, Sex, Parenting, Menopause, Wellness, Beauty
- Filterable by **age group**: 20s, 30s, 40s, 50s+
- Each question is a link to `/q/[slug]`
- Page is SSG (static at build time from DB) for SEO
- File: `app/questions/page.tsx`

### 2. `/q/[slug]` — Individual Question Page (SEO-Optimized)
- Statically generated at build time (`generateStaticParams`)
- Shows the question prominently
- Shows a **teaser/partial intro** (2-3 sentences from best answer) — enough for SEO indexing
- Answer is NOT fully shown — gated behind a CTA
- CTA: **"See what 4 AIs actually say →"** — fires the search (hits cache = instant, free)
- User sees the full 4-AI loading experience, then lands on `/results/[id]`
- Full SEO stack:
  - `generateMetadata()` with unique title + description per question
  - FAQ Schema JSON-LD (`{ "@type": "FAQPage" }`)
  - Canonical URL
  - OG tags for social sharing
- File: `app/q/[slug]/page.tsx`

### 3. `/weird` — Weird Questions Page
- Own nav link in header
- ~50 questions flagged `is_weird = true`
- Different visual vibe: playful, punchy, more provocative cards
- Each card has a prominent share button (Twitter/WhatsApp) for viral potential
- Same mechanic: question visible, answer requires clicking through
- File: `app/weird/page.tsx`

---

## New API / Backend

### `app/api/admin/seed-questions/route.ts`
- Protected admin endpoint (requires `ADMIN_SECRET` header)
- Reads `curated_questions` where `search_request_id IS NULL`
- For each unseeded question: fires `/api/search` internally → saves `search_request_id` back to `curated_questions`
- Runs in batches of 5 with 2s delay between batches (rate limiting)
- Returns progress JSON: `{ seeded: N, failed: M, remaining: K }`

### `app/api/questions/route.ts`
- GET: returns questions filtered by category/age_group
- Used by the `/questions` page client-side filtering

---

## Sitemap Update
- `app/sitemap.ts` — add all `/q/[slug]` URLs + `/questions` + `/weird`
- Priority: `/q/[slug]` = 0.8, `/questions` = 0.9, `/weird` = 0.7

---

## Question Categories & Distribution (500 total)

| Category | Count | Age Groups |
|---|---|---|
| Health & Body | 80 | All |
| Hormones & Menopause | 50 | 40s, 50s+ |
| Fitness & Exercise | 50 | All |
| Nutrition & Diet | 50 | All |
| Sex & Intimacy | 40 | 20s, 30s, 40s |
| Relationships | 50 | All |
| Career & Money | 40 | 20s, 30s, 40s |
| Mental Health | 40 | All |
| Parenting | 30 | 30s, 40s |
| Skin, Hair & Beauty | 30 | All |
| Pregnancy & Fertility | 40 | 20s, 30s |
| Weird/Viral | 50 | All |

---

## SEO Strategy Per `/q/[slug]` Page

```tsx
// Example for: "Can women take creatine?"
title: "Can Women Take Creatine? 4 AIs Weigh In"
description: "We asked ChatGPT, Gemini, Claude, and Grok if women should take creatine. Here's what they agreed on — and where they disagreed."
JSON-LD: FAQPage schema with question + teaser answer
Canonical: https://www.askwomensai.com/q/can-women-take-creatine
```

The teaser answer (2-3 sentences from `best_answer`) is rendered in the page HTML for Google to index — but the full answer is behind the CTA click.

---

## Build Sequence (Next Session)

### Step 1 — DB Migration
Create and run `supabase/migrations/007_curated_questions.sql`
Paste SQL in chat AND push to GitHub (per standing instruction).

### Step 2 — Generate 500 Questions
Claude generates the full question list in this format:
```json
{ "question": "Can women take creatine?", "category": "Fitness & Exercise", "age_group": "All", "is_weird": false, "slug": "can-women-take-creatine" }
```
Insert all rows into `curated_questions` (via Supabase SQL or a seed script).

### Step 3 — Seed Script
Build and run `app/api/admin/seed-questions/route.ts`
Fires each question through the live search pipeline → saves `search_request_id` back.
Run in batches. Rob approves API cost before running.

### Step 4 — `/q/[slug]` Page
Build the individual SEO question page with teaser + CTA.
Include `generateMetadata()`, JSON-LD, canonical.

### Step 5 — `/questions` Index Page
Build with category tabs + age group filter.
SSG from DB.

### Step 6 — `/weird` Page
Build with playful design, share buttons, 50 weird questions.

### Step 7 — Nav Update
Add "Questions" and "Weird" to the header nav.

### Step 8 — Sitemap
Update `app/sitemap.ts` to include all new URLs.

---

## Files To Create (Summary)

```
supabase/migrations/007_curated_questions.sql
scripts/seed-questions.ts               (optional local seed helper)
app/api/admin/seed-questions/route.ts   (protected batch seeder)
app/api/questions/route.ts              (filtered question list API)
app/questions/page.tsx                  (index page)
app/q/[slug]/page.tsx                   (individual SEO page)
app/weird/page.tsx                      (weird questions page)
```

---

## Key Technical Notes

- **Cache hit mechanic**: When a user clicks a pre-seeded question, `/api/search` checks the cache first. The 4-AI loading animation plays (~2-3s), then instantly resolves from the stored `search_request_id`. No new API cost incurred.
- **Static generation**: `/q/[slug]` pages use `generateStaticParams()` — built at deploy time. Fast, SEO-perfect, zero runtime cost per page view.
- **Teaser extraction**: Pull first 2 sentences from `best_answer` field of the cached compiled result. Store as `meta_description` in `curated_questions`.
- **Weird questions viral design**: Large question text, minimal chrome, one-tap share to Twitter/WhatsApp pre-populated with the question + URL.

---

## Repo
`rbender-boop/womensai` — all changes on `main`

## Live Site
`https://www.askwomensai.com`
