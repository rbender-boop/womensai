# Handover — 2026-03-17
## Session: Data Monetization Layer + Tagging Pipeline

---

## Context & Strategic Direction

This session was focused entirely on building the **data infrastructure** for AskWomensAI.

The strategic decision made:
- **No affiliate links. No sponsored answers. No doctor endorsements.**
- The only future monetization path is the **data asset itself** — anonymized trend reports, API licensing, research partnerships.
- Every question asked today must be captured correctly or the data is lost forever.
- The schema was designed to compound in value with every question asked.

---

## What Was Built This Session

### 1. Full Data Schema — 7 new tables

Run via Supabase SQL Editor in chunks. All migrations are in `supabase/migrations/`.

| Table | Purpose |
|---|---|
| `anonymous_sessions` | UUID cookie set on first visit. Root identity for all behavioral data. |
| `users` | Future accounts. Links back to `anonymous_session_id` to preserve pre-signup history. |
| `search_requests` | Existing table — extended with 20+ new columns for tagging, sessions, chain tracking, engagement. |
| `provider_results` | One row per AI provider per question. |
| `compiled_results` | Synthesized output per question. |
| `share_events` | Every share action by channel. Shareable slugs live here. |
| `usage_limits` | Rate limiting by session/user/IP + date bucket. |
| `topic_trends` | **The monetizable layer.** Nightly aggregation by topic + week. |

**Migration files:**
- `supabase/migrations/004_data_layer.sql` — all tables + indexes
- `supabase/migrations/005_aggregation.sql` — `aggregate_topic_trends()` function

### 2. Nightly Aggregation Cron

- `aggregate_topic_trends()` PostgreSQL function live in Supabase
- pg_cron enabled, job scheduled: **2:00 AM UTC daily**
- Confirmed via `SELECT * FROM cron.job` — jobid 1, active: true
- Populates `topic_trends` with question counts, engagement, demographic breakdowns, WoW growth, trending flag

### 3. Anonymous Session Tracking

- Cookie: `wai_session` (HttpOnly, SameSite=Strict, 1-year expiry)
- Set on first visit via `app/api/search/route.ts`
- `upsertAnonSession()` in `lib/db.ts` — creates row on first visit, updates `last_seen_at` on return
- Session ID written to every `search_requests` row
- `increment_session_question_count()` RPC increments behavioral counter on session

### 4. Auto-Tagging Pipeline

- **File:** `lib/ai/tag-question.ts`
- Fires after every search response is sent (fire-and-forget, never blocks user)
- Uses **Claude Haiku** — ~$0.001 per question
- Tags written back to `search_requests` row:
  - `topic_tags[]` — up to 5 from canonical taxonomy
  - `primary_topic` — single top tag
  - `life_stage` — teen / reproductive / perimenopause / menopause / postmenopause / unknown
  - `category` — health / fitness / wellness / beauty / nutrition / mental_health / other
  - `sentiment` — concerned / curious / urgent / informational

**Canonical taxonomy:** 60+ stable tags (PCOS, endometriosis, hormones, fertility, perimenopause, HRT, etc.)
**Rule: never rename existing tags — only append new ones. Renames break trend continuity.**

### 5. Homepage Copy Update

Added one sentence below the subheadline:
> *See how the AIs agree — or if they disagree on certain key points — in 60 seconds or less.*

### 6. "How It Works" Moved to Standalone Page

- Removed section from homepage
- Created `/app/how-it-works/page.tsx` — full standalone page with same design system
- Nav link updated from `#how-it-works` anchor to `/how-it-works`

---

## Files Changed This Session

```
supabase/migrations/004_data_layer.sql     NEW — core schema
supabase/migrations/005_aggregation.sql    NEW — nightly aggregation function
lib/ai/tag-question.ts                     NEW — Haiku tagging pipeline
lib/db.ts                                  UPDATED — upsertAnonSession(), tagAndUpdateSearch(), persistSearch() extended
app/api/search/route.ts                    UPDATED — session cookie, upsertAnonSession(), tagAndUpdateSearch() wired
app/how-it-works/page.tsx                  NEW — standalone How It Works page
app/page.tsx                               UPDATED — removed How It Works section, updated nav link, added copy line
```

---

## Supabase SQL Run This Session

All run successfully via SQL Editor:
- Chunk 1: Extensions + `anonymous_sessions`
- Chunk 2: `users`
- Chunk 3: `search_requests` (created fresh — was not in production)
- Chunk 4: `share_events`, `usage_limits`, `topic_trends`
- Chunk 5: All indexes
- Chunk 6: `aggregate_topic_trends()` function
- Chunk 7: Self-referencing FK constraints on `search_requests`
- Chunk 8: `provider_results`, `compiled_results`
- pg_cron enabled + scheduled
- `increment_session_question_count()` RPC created

---

## What's NOT Done Yet (Next Session Priorities)

### Priority 1 — Shareable Links
`share_events` table is ready. Need:
- Slug generation on every result page (`nanoid` short slug)
- Public route: `/a/[slug]` renders compiled answer
- "Copy link" button on results page
- Writes to `share_events` with `share_channel: 'link'`

### Priority 2 — Follow-Up Questions
`parent_request_id`, `chain_depth`, `chain_root_id` columns are ready. Need:
- "Ask a follow-up" button on results page
- Pre-fills search input with prior question as context
- Passes `parent_request_id` to API route
- Route writes chain fields on insert

### Priority 3 — Email Capture → Session Link
`anonymous_sessions` has no email field yet. When a user signs up:
- Link `email_signups.email` to their `anonymous_session_id`
- Enables future: "users who asked about PCOS also asked about..."

### Priority 4 — UTM Capture on First Visit
The session upsert in `route.ts` reads UTM params from `req.nextUrl.searchParams`.
These only get captured if the UTM params are passed to the `/api/search` POST.
Actually need to capture UTMs on the **page load**, not the API call.
Fix: pass UTMs from client-side `window.location.search` in the search POST body.

---

## Important Architecture Notes for Next Claude

1. **`search_requests` is the core fact table.** Every question ever asked lives here. All tagging, session, chain, and engagement data hangs off this table.

2. **`topic_trends` is the data product.** It's populated nightly by `aggregate_topic_trends()`. Don't query `search_requests` for trend data — query `topic_trends`.

3. **Tag taxonomy is in `lib/ai/tag-question.ts`.** `TOPIC_TAXONOMY` array is the source of truth. Never rename — only append.

4. **Tagging is fire-and-forget.** It runs after the response is sent. Never await it in the request path.

5. **Session ID is a UUID nanoid stored in cookie `wai_session`.** It's also stored in `anonymous_sessions.id` — same value, used as PK.

6. **`users` table exists but has no auth yet.** Future account creation should link `anonymous_session_id` to the new user row so pre-signup history is preserved.

---

## Repo
`rbender-boop/womensai` — all changes on `main`

## Live Site
`https://www.askwomensai.com`
