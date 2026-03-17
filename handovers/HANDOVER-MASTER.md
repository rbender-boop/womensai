# AskWomensAI — Master Handover
**Last Updated:** March 17, 2026 — Session D complete
**Repo:** github.com/rbender-boop/womensai
**Live site:** https://www.askwomensai.com
**Hosting:** Vercel (auto-deploys on push to main)
**DB:** Supabase (project: ptwbencantiparwuwnvb)

---

## What The App Is

AskWomensAI is a Next.js web app for women's health, fitness, wellness, and beauty questions.
Users ask one question and get answers compiled from ChatGPT, Gemini, Claude, and Grok in parallel —
synthesized into: Best Answer, Consensus, Disagreements, and Raw Responses.

---

## Current Production State

The app is fully live and functional. Here is everything that has been built:

### Core Search Engine
- POST `/api/search` — fans out to all 4 AI providers in parallel
- 2-layer Supabase cache: exact hash match + pgvector semantic similarity (0.92 threshold)
- Synthesis via a 5th AI call that produces Best Answer / Consensus / Disagreements / Notes
- Partial failure handling: works if at least 2 providers succeed
- IP-based rate limiting: 5 free searches/day
- Full persistence: search_requests, provider_results, compiled_results tables

### Homepage Design (Feminine Redesign — live on main)
- Background: blush-to-lavender gradient
- Sticky frosted-glass header
- Playfair Display headlines, DM Sans body
- Glassmorphism cards with rose borders
- Gradient pill buttons (rose → deep plum)
- Staggered floatIn animations on load
- Breathing tagline animation
- Search box: frosted glass with rose glow
- Example prompts: 6 clickable pills

### AI-Powered Follow-up Questions
- Before running search, calls `/api/followup-questions`
- Generates 1-2 personalized clarifying questions (age range chip + optional text)
- Age range injected into synthesis prompt as context
- Skip option always available

### Habit-First Signup System
- Question 3 → soft dismissable bottom banner
- Question 5 (limit hit) → modal
- 3rd return session → "Welcome back" modal
- Signed up → all prompts stop permanently
- localStorage keys: `wai_q_count`, `wai_sessions`, `wai_last_session`, `wai_dismissed`, `wai_signed_up`

### Email Signup + Welcome Email
- POST `/api/signup` → upserts to Supabase `email_signups` table
- Welcome email via Resend from `kelly@askwomensai.com`
- Subject: "You're in — your answers just got personal"
- Duplicate signups handled gracefully (no duplicate emails)

### About Page
- Trust-first: Michigan-based, no data selling, built by women for women
- Leads with privacy commitments before product features

---

## Curated Questions Library (549 Questions)

### What Was Built (Sessions A–C, March 17)

**Session A — DB:**
- `supabase/migrations/007_curated_questions.sql` — table + all 549 inserts
- Run in Supabase SQL Editor ✅
- `seeded_at` column added manually via SQL Editor ✅

**Session B — Seeder:**
- `app/api/admin/seed-questions/route.ts`
- Protected by `x-admin-secret` header
- Processes in batches of 1, skips already-cached questions
- Tracks completion via `seeded_at` column
- **SEEDING IS RUNNING OVERNIGHT** via PowerShell loop
- To check progress: query `SELECT COUNT(*) FROM curated_questions WHERE seeded_at IS NULL`
- To restart if interrupted:
```powershell
$secret = "afdasdfd9191asfsd"
$remaining = 999; $round = 0
while ($remaining -gt 0) {
  $round++
  try {
    $r = Invoke-WebRequest -Uri "https://www.askwomensai.com/api/admin/seed-questions" -Method POST -Headers @{"x-admin-secret"=$secret} -ContentType "application/json" -Body '{"limit":5}' -UseBasicParsing
    $json = $r.Content | ConvertFrom-Json
    $remaining = $json.remaining
    Write-Host "Round $round — seeded: $($json.seeded), failed: $($json.failed), remaining: $remaining"
    if ($json.seeded -eq 0 -and $json.failed -eq 0) { break }
  } catch { Write-Host "Round $round failed, retrying..."; Start-Sleep -Seconds 10; continue }
  Start-Sleep -Seconds 3
}
Write-Host "All done!"
```

**Session C — SEO Pages:**
- `app/q/[slug]/page.tsx` — SSG server component, generateStaticParams, generateMetadata, FAQ JSON-LD
- `app/q/[slug]/client.tsx` — client UI: question heading, teaser, blur gate, CTA → fires from cache
- `app/api/questions/route.ts` — GET filterable questions (category, age_group, weird, featured)

### Question Categories (549 total)
| Category | Count |
|---|---|
| Health & Body | 79 |
| Hormones & Menopause | 50 |
| Fitness & Exercise | 50 |
| Nutrition & Diet | 50 |
| Relationships | 50 |
| Weird/Viral | 50 |
| Sex & Intimacy | 40 |
| Mental Health | 40 |
| Career & Money | 40 |
| Pregnancy & Fertility | 40 |
| Parenting | 30 |
| Skin, Hair & Beauty | 30 |

---

## Session D — COMPLETED (March 17, 2026)

### ✅ `app/questions/page.tsx` + `app/questions/client.tsx`
- Server component fetches all non-weird questions at build time (`revalidate = 86400`)
- Client component: category filter (12 categories) + age group chips
- 3-col responsive grid of glassmorphism cards → `/q/[slug]`
- Full SEO metadata + canonical URL
- **Not in main nav** — footer-linked only (hidden from casual users, indexable by Google)

### ✅ `app/weird/page.tsx` + `app/weird/client.tsx`
- Server component fetches `is_weird = true` questions
- Playful large-text list layout with Playfair headings
- Twitter/X + WhatsApp share buttons on every card, pre-filled with question + URL
- Full SEO metadata + canonical URL
- **Not in main nav** — footer-linked only

### ✅ `app/sitemap.ts`
- All 549 `/q/[slug]` URLs (priority 0.7, monthly)
- `/questions` (priority 0.8), `/weird` (priority 0.7)
- Static pages: `/`, `/about`, `/privacy`, `/terms`
- Accessible at `/sitemap.xml` after deploy

### ✅ Footer updates
- `app/page.tsx` footer: added Questions + Weird Questions links
- `app/q/[slug]/client.tsx` footer: added Questions + Weird Questions links (internal linking for SEO)

### Post-deploy action required
- Submit `https://www.askwomensai.com/sitemap.xml` to Google Search Console

---

## Design System

Apply consistently to all new pages:

```
Background:   linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)
Font heading: var(--font-playfair) — Playfair Display
Font body:    font-sans — DM Sans
Primary:      #9B4163 (rose/plum)
Text dark:    #1C1714
Text body:    #7A6E67
Text muted:   #AFA8A2

Cards:
  background: rgba(255,255,255,0.80)
  backdropFilter: blur(12px)
  border: 1px solid rgba(212,167,185,0.35)
  boxShadow: 0 4px 30px rgba(139,48,88,0.07)
  borderRadius: 24px

Buttons (primary):
  background: linear-gradient(135deg, #9B4163 0%, #7A3050 100%)
  color: #fff
  boxShadow: 0 4px 18px rgba(139,48,88,0.32)
  borderRadius: 100px

Border accent: rgba(212,167,185,0.35)

Animations:
  floatIn: opacity 0→1, translateY 18px→0, 0.7s ease
  cardLift: translateY 0→-5px, shadow grow, 4s infinite
```

---

## Full File Structure

```
app/
  page.tsx                          ← Homepage (feminine redesign)
  layout.tsx                        ← Fonts: Playfair Display + DM Sans
  globals.css                       ← Color tokens, keyframe animations
  about/page.tsx                    ← Trust-first about page
  q/[slug]/
    page.tsx                        ← SSG SEO page (server component)
    client.tsx                      ← Client UI for question pages
  questions/
    page.tsx                        ← SSG server component, fetches non-weird questions
    client.tsx                      ← Category + age filters, 3-col card grid
  weird/
    page.tsx                        ← SSG server component, fetches is_weird=true
    client.tsx                      ← Large text list, Twitter/X + WhatsApp share buttons
  sitemap.ts                        ← 549 /q/[slug] + static pages → /sitemap.xml
  api/
    search/route.ts                 ← Main search orchestration
    questions/route.ts              ← GET filterable questions
    signup/route.ts                 ← POST signup → Supabase + Resend
    followup-questions/route.ts     ← AI-generated clarifying questions
    admin/
      seed-questions/route.ts       ← POST seeder (admin-protected)

components/
  signup-prompt.tsx                 ← Banner/modal/return signup variants
  qotd-banner.tsx                   ← Question of the day banner

hooks/
  use-signup-trigger.ts             ← Signup trigger logic (localStorage)

lib/
  ai/
    providers/
      openai.ts / anthropic.ts / gemini.ts / grok.ts
    synthesize.ts                   ← Synthesis prompt + parser
    prompts.ts
    normalize.ts
    tag-question.ts
  cache.ts                          ← Exact + semantic cache (Supabase)
  db.ts                             ← Supabase persistence
  email.ts                          ← Resend welcome email
  rate-limit.ts                     ← IP-based rate limiting
  validations.ts

scripts/
  generate-questions.py             ← Generated 549 questions + SQL
  seed-cache.ts                     ← Earlier seed script (superseded)

supabase/migrations/
  001_init.sql
  002_cache.sql
  003_qotd.sql
  004_data_layer.sql
  005_aggregation.sql
  007_curated_questions.sql         ← 549 curated questions
  008_age_range.sql
  20260316_email_signups.sql

types/
  search.ts                         ← ProviderResult, CompiledResult, etc.

handovers/                          ← Session handover docs
```

---

## Supabase Tables

| Table | Purpose |
|---|---|
| search_requests | Every search: query, status, latency, ip_hash, session_id |
| provider_results | Per-provider response for each search |
| compiled_results | Synthesis output: best_answer, consensus, disagreements, notes |
| query_cache | Exact + vector cache (query_hash, embedding, compiled, providers) |
| email_signups | Signup emails (id, email unique, signed_up_at, source) |
| curated_questions | 549 curated questions (slug, category, age_group, is_weird, seeded_at) |
| anon_sessions | Anonymous session tracking |
| usage_limits | IP-based rate limit counters |

---

## Environment Variables (all set in Vercel)

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
XAI_API_KEY
NEXT_PUBLIC_APP_URL
ADMIN_SECRET
```

---

## Product Decisions (Permanent)

- **Design:** Vogue editorial clean. Feminine but credible. Not pastel overload.
- **Scope:** Health, fitness, wellness, beauty — not health-only.
- **Copy:** Never use "health history" language. Use "the more you ask, the smarter it gets."
- **Signup:** Habit-first. Earn the ask over 5–10 questions across 2–3 sessions.
- **Nav:** No pricing link until users are hooked.
- **Trust:** About page leads with privacy, not features.
- **Questions:** Answer is always gated — user must click CTA to fire real search (loads from cache).
- **Loading:** Even cache hits play the loading animation (~2-3s minimum) so users feel the 4-AI experience.

---

## Product Roadmap (Post-Session D) — Next Up

### Session E priorities (in order):
1. **Personalization layer** — inject past question history into synthesis prompt for signed-in users
2. **"Send me this result" email capture** — on results page, light-touch capture after seeing answer
3. **Saved results / history** — for signed-in users, accessible from account
4. **Sitemap submission** — submit `/sitemap.xml` to Google Search Console (manual step, not code)
5. **SEO blog content engine** — long-tail women's health query pages (separate from curated questions)
6. **Monetization tiers** — Free (5/day) → Free account (10/day + history) → Pro ($7–9/mo, unlimited)
