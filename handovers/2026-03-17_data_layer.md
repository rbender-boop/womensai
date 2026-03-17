# Handover — 2026-03-17
## Session: Data Monetization Layer + Tagging Pipeline + Homepage Cleanup

---

## Strategic Direction Set This Session

- **No affiliates. No sponsored answers. No doctor endorsements.**
- The only future monetization path is the **data asset** — anonymized trend reports, API licensing, research partnerships.
- Every question asked must be fully captured from day one or the data is lost forever.
- Schema designed to compound in value with every question asked.
- Always paste SQL migration code directly in chat AND push to GitHub.

---

## What Was Built This Session

### 1. Full Data Schema — 7 tables (supabase/migrations/004_data_layer.sql)

| Table | Purpose |
|---|---|
| `anonymous_sessions` | UUID cookie set on first visit. Root behavioral identity. |
| `users` | Future accounts. Links to `anonymous_session_id` to preserve pre-signup history. |
| `search_requests` | Existing table — extended with 20+ columns for tagging, session, chain, engagement. |
| `provider_results` | One row per AI provider per question. |
| `compiled_results` | Synthesized output per question. |
| `share_events` | Every share action by channel. Slugs live here. |
| `usage_limits` | Rate limiting by session/user/IP + date bucket. |
| `topic_trends` | Nightly aggregation by topic + week. The monetizable layer. |

### 2. Nightly Aggregation (supabase/migrations/005_aggregation.sql)
- `aggregate_topic_trends()` PostgreSQL function live in Supabase
- pg_cron enabled, job ID 1, active: true, schedule: `0 2 * * *` (2AM UTC daily)
- Populates `topic_trends` with question counts, engagement, demographic breakdowns, WoW % change, trending flag

### 3. Anonymous Session Tracking
- Cookie: `wai_session` (HttpOnly, SameSite=Strict, 1-year expiry)
- Set/read in `app/api/search/route.ts` on every request
- `upsertAnonSession()` in `lib/db.ts` creates row on first visit, updates `last_seen_at` on return
- Session ID written to every `search_requests` row
- `increment_session_question_count()` RPC keeps behavioral counter current

### 4. Auto-Tagging Pipeline (lib/ai/tag-question.ts)
- Fires after every search response is sent — fire-and-forget, never blocks user
- Uses Claude Haiku (~$0.001/question)
- Tags written back to `search_requests`:
  - `topic_tags[]` — up to 5 from canonical taxonomy
  - `primary_topic` — single top tag
  - `life_stage` — teen / reproductive / perimenopause / menopause / postmenopause / unknown
  - `category` — health / fitness / wellness / beauty / nutrition / mental_health / other
  - `sentiment` — concerned / curious / urgent / informational
- **NEVER rename existing taxonomy tags — only append. Renames break trend continuity.**

### 5. Homepage Updates (app/page.tsx)
- Added sentence below subheadline: *"See how the AIs agree — or if they disagree on certain key points — in 60 seconds or less."*
- Removed "How It Works" section from homepage entirely
- Nav link updated: `#how-it-works` → `/how-it-works`

### 6. Standalone How It Works Page (app/how-it-works/page.tsx)
- Full page at `/how-it-works` with same design system
- CTA at bottom links back to homepage to ask a question

---

## Files Changed This Session

```
supabase/migrations/004_data_layer.sql     NEW — all tables + indexes
supabase/migrations/005_aggregation.sql    NEW — nightly aggregation function
lib/ai/tag-question.ts                     NEW — Haiku tagging pipeline + TOPIC_TAXONOMY
lib/db.ts                                  UPDATED — upsertAnonSession(), tagAndUpdateSearch(), persistSearch() extended with sessionId
app/api/search/route.ts                    UPDATED — session cookie read/set, upsertAnonSession(), tagAndUpdateSearch() wired
app/how-it-works/page.tsx                  NEW — standalone How It Works page
app/page.tsx                               UPDATED — new copy line, How It Works removed, nav link fixed
handovers/2026-03-17_data_layer.md         NEW — this file
```

---

## Supabase SQL Run This Session (All Confirmed Success)

- Chunk 1: Extensions + `anonymous_sessions`
- Chunk 2: `users`
- Chunk 3: `search_requests` created fresh (was not in production DB)
- Chunk 4: `share_events`, `usage_limits`, `topic_trends`
- Chunk 5: All indexes
- Chunk 6: `aggregate_topic_trends()` function
- Chunk 7: Self-referencing FK constraints on `search_requests`
- Chunk 8: `provider_results`, `compiled_results`
- pg_cron enabled + job scheduled (jobid: 1, active: true)
- `increment_session_question_count()` RPC created

---

## Critical Architecture Notes for Next Claude

1. **All changes go directly to GitHub via API. Never write locally.**

2. **`search_requests` is the core fact table.** Every question lives here. All tagging, session, chain, and engagement data hangs off it.

3. **`topic_trends` is the data product.** Populated nightly by `aggregate_topic_trends()`. Always query `topic_trends` for trend data — never raw `search_requests`.

4. **Tag taxonomy is in `lib/ai/tag-question.ts` — `TOPIC_TAXONOMY` array.** Never rename — only append new tags at the bottom.

5. **Tagging is fire-and-forget.** Called after response is sent. Never await it in the request path.

6. **Session ID = UUID stored in cookie `wai_session` = PK in `anonymous_sessions.id`.** Same value used throughout.

7. **`users` table exists but has no auth yet.** Future account creation must link `anonymous_session_id` to preserve pre-signup history.

8. **Always paste SQL in chat AND push to GitHub** (per Rob's standing instruction).

---

## Next Session Priorities (in order)

### 1. Shareable Links (HIGHEST PRIORITY per build plan)
`share_events` table is ready. Need:
- Slug generation on every result page (nanoid short slug, e.g. `abc123`)
- Public route: `/a/[slug]` renders compiled answer
- "Copy link" button on results page
- Writes to `share_events` with `share_channel: 'link'`
- Every shared link = free acquisition

### 2. Follow-Up Questions
`parent_request_id`, `chain_depth`, `chain_root_id` columns are ready. Need:
- "Ask a follow-up" button on results page
- Pre-fills search with prior question as context
- Passes `parent_request_id` to API route
- Route writes chain fields on insert

### 3. UTM Capture Fix
Currently UTMs are read from `req.nextUrl.searchParams` on the API POST — but UTMs live on the page URL, not the API call. Fix: pass UTMs from `window.location.search` in the client-side search POST body.

### 4. Email → Session Link
When a user signs up, link `email_signups.email` to their `anonymous_session_id` so behavioral history carries forward.

---

## Repo
`rbender-boop/womensai` — all changes on `main`

## Live Site
`https://www.askwomensai.com`
