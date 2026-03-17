# Handover — 2026-03-17
## Session: Results Page Action Bar — All 6 Share/Email/Social Features

---

## What Was Built This Session

### Results Page Action Bar (`app/results/[id]/page.tsx`)
After every result, a 6-button action bar now appears. Each button opens a modal.

| Button | What it does |
|---|---|
| Email me this | Modal → user enters their email → Resend delivers formatted answer to inbox |
| Ask a follow-up | Modal → textarea pre-seeded with original question → fires new 4-AI search |
| Email a friend | Modal → optional note + friend email → same email template |
| Copy share link | Generates slug via `/api/share`, saves to `share_events`, copies `askwomensai.com/a/[slug]` to clipboard |
| Share on socials | Modal → Twitter, LinkedIn, WhatsApp, Facebook — all use the slug URL |
| Save your answers | "Coming soon" modal → captures email to `email_signups` with source `save_answers_cta` |

### New API Routes
- `app/api/share/route.ts` — POST: generates 6-char slug, inserts into `share_events` with query + result snapshot
- `app/api/email-result/route.ts` — POST: sends formatted answer email via Resend, supports `type: self | friend`

### Shareable Result Page (`app/a/[slug]/page.tsx`)
- Public route — no auth required
- Reads from `share_events` by slug
- Shows question, best answer, consensus, disagreements
- Big CTA to try AskWomensAI — every share = free acquisition
- Returns 404 if slug not found

### SQL Run This Session (Supabase — confirmed success)
```sql
ALTER TABLE public.share_events
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS query_text text,
  ADD COLUMN IF NOT EXISTS result_snapshot jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_share_events_slug
  ON public.share_events(slug)
  WHERE slug IS NOT NULL;
```

---

## Architecture Notes

- Share slugs are 6-char base-36, collision-checked up to 5 retries
- `result_snapshot` stores `{ compiled, providers }` as JSONB — no re-query needed to render shared page
- Email template is inline HTML in `app/api/email-result/route.ts` — uses existing Resend setup
- Follow-up context is prepended as `Follow-up to "[original]": [new question]` so the 4 AIs have full context
- Save answers CTA hits existing `/api/signup` with `source: save_answers_cta`

---

## Next Session Priorities

1. **UTM Capture Fix** — UTMs are read from `req.nextUrl.searchParams` on API POST but live on the page URL. Fix: pass `window.location.search` UTMs in the client-side POST body.
2. **Email → Session Link** — when user signs up, link `email_signups.email` to their `anonymous_session_id`
3. **Test share flow end-to-end** — fire a question, hit Copy share link, verify `/a/[slug]` renders correctly
4. **Test email flow** — Email me this + Email a friend, confirm Resend delivers

---

## Repo
`rbender-boop/womensai` — all changes on `main`

## Live Site
`https://www.askwomensai.com`
