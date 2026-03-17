# Handover — 2026-03-17
## Build Plan: Top 500 Questions Library + Weird Questions Section

---

## Product Decisions (Confirmed This Session)

1. **Click-through on `/q/[slug]`** — User lands on the full existing results page (`/results/[id]`) showing Best Answer / Consensus / Disagreements / Raw Responses. The "4 AIs running" loading animation plays even though the answer resolves from cache instantly — users must feel the experience.
2. **Weird Questions** — Own nav link in the header (not a tab inside the Questions page).
3. **Answer generation** — Claude generates all 500+ questions, they are run through the live system once at Rob's expense (~$15–40 one-time). Results saved to Supabase cache. All subsequent user clicks are free + instant.

---

## Architecture Overview

### New DB Table: `curated_questions`
```sql
CREATE TABLE public.curated_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  question text NOT NULL,
  category text NOT NULL,
  age_group text,
  is_weird boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  search_request_id uuid REFERENCES search_requests(id),
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_curated_questions_category ON public.curated_questions(category);
CREATE INDEX idx_curated_questions_age_group ON public.curated_questions(age_group);
CREATE INDEX idx_curated_questions_is_weird ON public.curated_questions(is_weird);
```

### Question Categories & Distribution (500 total)

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

```
title: "Can Women Take Creatine? 4 AIs Weigh In"
description: "We asked ChatGPT, Gemini, Claude, and Grok if women should take creatine. Here's what they agreed on — and where they disagreed."
JSON-LD: FAQPage schema with question + teaser answer snippet
Canonical: https://www.askwomensai.com/q/can-women-take-creatine
```

Teaser = first 2-3 sentences of `best_answer` rendered in HTML for Google.
Full answer is gated — user must click "See what 4 AIs actually say →" to fire the search.

---

## SESSION-BY-SESSION BUILD PLAN

---

### SESSION A — Foundation
**Goal: DB + question data ready. Nothing visible to users yet.**

1. Create and run `supabase/migrations/007_curated_questions.sql` (paste SQL in chat + push to GitHub)
2. Claude generates all 500 questions in JSON format (batched by category)
3. Insert all 500 rows into `curated_questions` via Supabase SQL editor
4. Verify rows are in DB with correct slugs, categories, age_groups, is_weird flags

**Deliverable:** 500 rows in `curated_questions`, all with `search_request_id = NULL`
**No user-facing changes yet.**

---

### SESSION B — Seed Pipeline
**Goal: All 500 questions run through the live AI system and cached.**

1. Build `app/api/admin/seed-questions/route.ts`
   - Protected by `ADMIN_SECRET` header
   - Reads all rows where `search_request_id IS NULL`
   - Fires each through `/api/search` internally in batches of 5 (2s delay between batches)
   - Writes `search_request_id` back to `curated_questions` on success
   - Returns `{ seeded: N, failed: M, remaining: K }`
2. Review estimated cost with Rob before running
3. Run the seeder — all 500 questions get answers cached in Supabase
4. Verify: spot-check 10 questions, confirm `search_request_id` is populated

**Deliverable:** All 500 questions have cached answers. Zero ongoing AI cost for user clicks.
**No user-facing changes yet.**

---

### SESSION C — Individual Question Pages (`/q/[slug]`)
**Goal: SEO pages live for all 500 questions.**

1. Build `app/q/[slug]/page.tsx`
   - `generateStaticParams()` — pre-renders all 500 at deploy time
   - `generateMetadata()` — unique title + description per question
   - FAQ JSON-LD structured data
   - Canonical URL + OG tags
   - Shows: question heading + teaser (2-3 sentences from best_answer)
   - CTA button: "See what 4 AIs actually say →" — fires search, resolves from cache, shows loading experience
2. Build `app/api/questions/route.ts` (GET, filtered by category/age_group)
3. Deploy and verify 3-5 pages render correctly with correct metadata

**Deliverable:** 500 SEO-optimized pages live at `/q/[slug]`

---

### SESSION D — Questions Index + Weird Page + Nav
**Goal: Discovery pages live. Users can browse the full library.**

1. Build `app/questions/page.tsx`
   - Category filter tabs/pills
   - Age group filter
   - All 500 questions as clickable links to `/q/[slug]`
   - SSG from DB
2. Build `app/weird/page.tsx`
   - ~50 questions flagged `is_weird = true`
   - Playful, punchy card design (different vibe from main Questions page)
   - Prominent one-tap share buttons (Twitter + WhatsApp) pre-filled with question + URL
   - Same answer-gated mechanic
3. Update header nav: add "Questions" and "Weird" links
4. Update `app/sitemap.ts` — add all `/q/[slug]`, `/questions`, `/weird` URLs

**Deliverable:** Full questions library browsable. Weird section live with share buttons. Sitemap updated for Google.

---

## Files To Create (by session)

```
SESSION A:
  supabase/migrations/007_curated_questions.sql

SESSION B:
  app/api/admin/seed-questions/route.ts

SESSION C:
  app/q/[slug]/page.tsx
  app/api/questions/route.ts

SESSION D:
  app/questions/page.tsx
  app/weird/page.tsx
  app/sitemap.ts (update)
  components/header.tsx (update — add nav links)
```

---

## Key Technical Notes

- **Cache hit mechanic**: `/api/search` checks cache on every query. Pre-seeded questions resolve instantly. Loading animation still plays (~2-3s artificial minimum) so users feel the 4-AI experience.
- **Static generation**: `generateStaticParams()` on `/q/[slug]` — all pages pre-built at deploy. Fast, SEO-perfect, zero runtime cost per page view.
- **Seeder safety**: Run in batches of 5 with delay to avoid hammering provider APIs. If a question fails, it stays `search_request_id = NULL` and can be re-run.
- **Weird questions**: Designed for screenshotting and sharing. Large question text, minimal chrome, one-tap share pre-populated with question + URL.

---

## Repo
`rbender-boop/womensai` — all changes on `main`

## Live Site
`https://www.askwomensai.com`
