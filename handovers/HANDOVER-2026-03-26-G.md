# HANDOVER — Session G (March 26, 2026)

## Session Focus
Two tracks: (1) Marketing tooling + Reddit content creation, (2) Critical bug fix for question logging.

---

## Critical Bug Fix: Questions Never Persisted

### The Problem
Admin dashboard showed 177 page views but 0 questions, despite Rob actively asking questions on the site. The dashboard wasn't broken — **no question had EVER been written to the database.**

### Root Cause
`search_requests.id` is a `uuid` column in Postgres, but the code used `nanoid()` which generates short random strings (e.g., `V1StGXR8_Z5jdHi6B-myT`) — not valid UUIDs. Every `persistSearch()` call silently failed because Postgres rejected the non-UUID value. The `.catch(console.error)` swallowed the error server-side, so users still got answers — they just never got logged.

Same issue affected `anonymous_sessions.id` (also a UUID column).

### The Fix (committed & pushed)
**Commit:** `0226a77` — `fix: use randomUUID instead of nanoid for database IDs`

Changes in `app/api/search/route.ts`:
- `requestId` now uses `crypto.randomUUID()` instead of `nanoid()`
- `sessionId` now uses `crypto.randomUUID()` instead of `nanoid()`
- Added UUID format validation for existing session cookies — old nanoid cookies from prior visitors are detected and replaced with fresh UUIDs

### Prior Commit (also this session)
**Commit:** `6a912ad` — `fix: log cache hits to search_requests so admin dashboard counts all questions`

Added `persistCacheHit()` to `lib/db.ts` — a lightweight function that writes to `search_requests` for cache hits. Both exact and semantic cache hit paths in the search route now call this.

### Verification Needed
Rob should ask a question on askwomensai.com and confirm it appears in the admin dashboard at `/admin`. If it still shows 0, check Vercel function logs for Supabase errors.

---

## Marketing: Claude Code + /last30days Skill

### Setup Complete
- Claude Code v2.1.83 installed at `C:\Users\rbend\.local\bin\claude.exe`
- `/last30days` skill cloned to `C:\Users\rbend\.claude\skills\last30days`
- API keys loaded in `C:\Users\rbend\.config\last30days\.env` (OpenAI + xAI)
- **Both keys were exposed in chat and MUST be rotated:**
  - OpenAI: platform.openai.com → API keys
  - xAI: xAI console
- Claude Code authentication still needed (Rob must run `claude` in PowerShell and sign in via browser)

### Research Completed (3 topics)
All saved to `C:\Users\rbend\Documents\Last30Days\`:
1. `womens-hormonal-health-issues-raw.md` — stress, perimenopause, PCOS, thyroid, birth control
2. `cortisol-face-debunked-raw.md` — myth debunking, BBC segment, real vs. fake claims
3. `seed-cycling-hormone-balance-women-raw.md` — evidence gap, individual seed benefits, PMC case study

### Reddit Post Documents Created (3 topic packs, 11 total posts)
Downloaded from Claude.ai (not in repo):

1. **AskWomensAI-Reddit-Launch-Playbook.docx** — 5 posts covering hormonal health
   - Post 1: r/PCOS — PCOS metabolic vs. reproductive
   - Post 2: r/Menopause — FDA removing HRT boxed warnings
   - Post 3: r/WomensHealth — Stress as #1 hormonal disruptor
   - Post 4: r/SkincareAddiction — Thyroid-acne connection
   - Post 5: r/XXFitness — Birth control + progesterone suppression
   - Includes full instructions page, golden rules, posting order, cheat sheet

2. **AskWomensAI-Cortisol-Face-Topic-Pack.docx** — 3 posts
   - Post 1: r/SkincareAddiction — Myth vs. reality
   - Post 2: r/WomensHealth — BBC debunking angle
   - Post 3: r/TheGirlSurvivalGuide — Practical puffiness tips

3. **AskWomensAI-Seed-Cycling-Topic-Pack.docx** — 3 posts
   - Post 1: r/PCOS — Seed cycling for PCOS
   - Post 2: r/WomensHealth — Evidence breakdown
   - Post 3: r/XXFitness — Real vs. hype fitness angle

All posts are written in first-person casual voice (for Rob's wife to post from her account). Each includes: exact title, full body copy, understated site mention as last line, and comment strategy for handling replies.

---

## Local Repo Status
- **Path:** `C:\Users\rbend\Desktop\Claude Creations - Master Folder\everygpt`
- **Branch:** `main`
- **Status:** Clean, up to date with GitHub
- **Latest commit:** `0226a77` (UUID fix)

---

## Pending Items (Carried Forward)

### Immediate Priority
- **Verify UUID fix works** — ask a question on the site, check admin dashboard
- **Rotate exposed API keys** — OpenAI and xAI keys shared in chat today
- **Authenticate Claude Code** — Rob needs to run `claude` in PowerShell and sign in

### AskWomensAI Product
- UTM capture fix (client-side → POST body)
- Linking email signups to anonymous session IDs
- End-to-end testing of share and email flows
- QOTD system: SQL migration, CRON_SECRET env var, redeploy

### FortisGPT
- 301 redirects from related domains (GoDaddy)
- Copy rewrite for `letter.html`
- Supabase integration for contact form

### Growth
- Reddit posting begins once wife's account has 2-3 days of organic commenting history (10:1 rule)
- More `/last30days` topics to run: ozempic + PCOS, magnesium for anxiety, protein intake women, postpartum anxiety
- Quora seeding (similar format, different platform)
