# Handover — 2026-03-17
## Session: Signup Notifications + Question of the Day

---

## What was built this session

### 1. Signup notifications → kelly@askwomensai.com
Every time someone signs up (via the existing `/api/signup` route), an email is now automatically sent to `kelly@askwomensai.com` with the user's email, timestamp, and source.

**Files changed:**
- `lib/email.ts` — added `sendSignupNotification()` function (existing `sendWelcomeEmail` untouched)
- `app/api/signup/route.ts` — now calls `sendSignupNotification()` for new signups only

---

### 2. Question of the Day (QOTD)
A daily AI-generated women's health question + answer that appears in a collapsible banner at the top of every page, above the existing header.

**How it works end-to-end:**
```
7:00 AM ET daily
  → Vercel cron hits /api/cron/qotd
  → Calls Claude API to generate a women's health question + answer (JSON)
  → Stores in Supabase question_of_the_day table
  → Fetches all emails from email_signups table
  → Sends daily email to all subscribers via Resend

User visits site
  → layout.tsx renders <QotdBanner /> above every page
  → Banner fetches /api/qotd (cached 1hr)
  → Shows collapsed: "Question of the Day · [question text]"
  → Click to expand → full answer + two CTAs:
      1. "Ask all AIs this question →" (pre-fills search)
      2. Inline email subscribe form → posts to /api/signup with source: 'qotd_banner'
  → Dismiss button hides banner for rest of day (localStorage)
```

**Files added:**
- `lib/qotd.ts` — `getTodayQotd()`, `generateAndStoreQotd()`, `getQotdSubscribers()`
- `app/api/qotd/route.ts` — public GET, cached 1hr
- `app/api/cron/qotd/route.ts` — Vercel cron endpoint (auth: CRON_SECRET)
- `components/qotd-banner.tsx` — collapsible banner, matches rosewood/cream design system
- `app/layout.tsx` — updated to render `<QotdBanner />` above `{children}`
- `vercel.json` — cron schedule: `0 12 * * *` (noon UTC = 7am ET)
- `supabase/migrations/003_qotd.sql` — creates `question_of_the_day` table

**Files changed:**
- `lib/email.ts` — added `sendDailyQotdEmail()` for batch sending to subscriber list

---

### 3. Browser-based cron test page
Since the repo is not on this machine, added a UI to test the cron without needing a terminal.

**File added:**
- `app/admin/cron-test/page.tsx` — paste CRON_SECRET, click Run, see JSON response

---

## What still needs to be done before testing

### Step 1 — Run the SQL migration
Paste into **Supabase Dashboard → SQL Editor** and run:

```sql
create table if not exists public.question_of_the_day (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  question text not null,
  answer text not null,
  category text,
  model_used text,
  generated_at timestamptz default now()
);

create index if not exists idx_qotd_date on public.question_of_the_day(date desc);

alter table public.question_of_the_day enable row level security;

create policy "QOTD public read"
  on public.question_of_the_day for select
  using (true);

alter table public.email_signups
  add column if not exists source text default 'unknown';
```

### Step 2 — Add CRON_SECRET to Vercel
1. Vercel dashboard → project → **Settings → Environment Variables**
2. Add: `CRON_SECRET` = any random string (e.g. `wai_cron_k9x2mP7qLnRt4vBz`)
3. Save + redeploy

### Step 3 — Test via browser
1. After redeploy, go to: `https://www.askwomensai.com/admin/cron-test`
2. Paste the CRON_SECRET
3. Click **Run QOTD Cron**
4. Expected response: `{ "ok": true, "date": "...", "subscribers": 0, "sent": 0 }`
5. Check Supabase → `question_of_the_day` table — should have a row
6. Visit the homepage — QOTD banner should appear at the top

### Step 4 — Confirm signup notification
1. Sign up with a test email on the site
2. Check kelly@askwomensai.com inbox — notification email should arrive within ~30 seconds

---

## How to see all signups
- **Supabase dashboard:** Project → Table Editor → `email_signups`
- **Direct URL:** `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor`

---

## Design notes
- QOTD banner uses the existing rosewood/cream design system (`#9B4163`, `#FAF7F5`, Playfair serif)
- Banner is dismissed per-day via localStorage key `qotd_dismissed`
- Subscribe form in banner reuses `/api/signup` with `source: 'qotd_banner'`
- No new dependencies added — uses existing Resend setup in `lib/email.ts`

---

## Known TODOs / nice to have later
- Delete or password-protect `/admin/cron-test` before going fully public
- Add unsubscribe page at `/unsubscribe` (linked in QOTD emails)
- Vercel Cron Jobs tab (in dashboard) should show the job after first redeploy — verify it's listed
- Consider seeding a few QOTD entries manually in Supabase if you want the banner live before the first cron fires

---

## Repo
`rbender-boop/womensai` — all changes on `main`
