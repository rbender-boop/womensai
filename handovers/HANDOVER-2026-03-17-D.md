# AskWomensAI — Session Handover
**Date:** March 17, 2026 — Session D/E (full day)
**Repo:** github.com/rbender-boop/womensai
**Live site:** https://www.askwomensai.com
**Hosting:** Vercel (auto-deploys on push to main)
**DB:** Supabase (project: ptwbencantiparwuwnvb)
**Last commit:** SEO hidden content + Google Search Console verification

---

## Git State
Local and remote are fully in sync. Working tree is clean.

### Recent commits (newest first)
```
seo: render full best answer hidden in HTML for Google crawling
chore: add Google Search Console verification file
docs: session E handover
fix: welcome email — better and more personalized copy
fix: tighten hero paragraph widths for cleaner line breaks
fix: welcome email copy — anonymous profile, remove health history language
Session D: questions index, weird page, sitemap, footer SEO links, signup copy update
```

---

## What Was Built Today (Full Summary)

### 1. Questions Index — `app/questions/page.tsx` + `client.tsx`
- Server component, fetches all non-weird questions at build time (`revalidate = 86400`)
- Client: 12-category filter pills + age group chips
- 3-col responsive glassmorphism card grid → each links to `/q/[slug]`
- Full SEO metadata + canonical URL
- **Footer-only link — NOT in main nav**

### 2. Weird Questions Page — `app/weird/page.tsx` + `client.tsx`
- Fetches `is_weird = true` questions only
- Large Playfair text list, playful vibe
- Twitter/X + WhatsApp share buttons on every card, pre-filled text + URL
- **Footer-only link — NOT in main nav**

### 3. Sitemap — `app/sitemap.ts`
- All 549 `/q/[slug]` URLs + `/questions` + `/weird` + static pages
- Live at: `https://www.askwomensai.com/sitemap.xml`
- **Already submitted to Google Search Console ✅**

### 4. Google Search Console
- Verified via HTML file method
- Verification file: `public/google98d83013f2627f1b.html`
- **DO NOT delete this file — it keeps the property verified**
- Sitemap submitted — Google is crawling

### 5. SEO: Full Answer Hidden in HTML — `app/q/[slug]/page.tsx` + `client.tsx`
- `page.tsx` now fetches full `best_answer`, `consensus`, `disagreements` from Supabase
- Server passes all fields to client as props
- Client renders them in a visually-hidden div (`position: absolute; left: -9999px`)
- Google crawls the full answer — users never see it
- JSON-LD structured data updated to use full best answer (strongest SEO signal)
- **Zero visual change for users**

### 6. Homepage copy (`app/page.tsx`)
- Signup section: "the smarter and more personalized your answers get"
- Added: "Your questions always remain anonymous"
- Hero paragraph maxWidth tightened for cleaner line breaks

### 7. Welcome Email (`lib/email.ts`)
- Removed "health history" language (permanent rule — never use this phrase)
- Added "Your profile is anonymous." as italic subheading
- Body: "The more you ask, the smarter and more personalized your answers get — and your questions always remain anonymous."
- Last line: "Keep asking. The more context we have, the better and more personalized your answers get."
- Subject: "You're in — your profile is anonymous"

### 8. Curated Questions Seeding — COMPLETE ✅
- All 549 questions seeded overnight via PowerShell loop
- Every `/q/[slug]` page now has a real answer teaser + hidden full answer
- `seeded_at` is populated for all 549 rows

---

## Permanent Product Rules (never break these)

- **Never use "health history" language** — always use "the more you ask, the smarter it gets"
- **Questions/Weird pages are footer-only** — never add to main nav
- **Anonymous framing is non-negotiable** — always reinforce questions are anonymous
- **Answer gate on `/q/[slug]`** — teaser shown visually, full answer hidden for Google only, CTA fires live search
- **Loading animation always plays** even on cache hits (~2–3s minimum)
- **Design:** Vogue editorial. Glassmorphism cards, rose/plum palette, Playfair Display headings, DM Sans body

---

## Design System (apply to all new pages)

```
Background:   linear-gradient(160deg, #FDF5F8 0%, #FBF8F5 45%, #F6EFF9 100%)
Font heading: var(--font-playfair)
Font body:    font-sans (DM Sans)
Primary:      #9B4163
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

Header:
  backdropFilter: blur(12px)
  background: rgba(253,245,248,0.82)
  border-bottom: 1px solid rgba(212,167,185,0.25)
  sticky, zIndex: 40
```

---

## Full File Structure

```
app/
  page.tsx                          ← Homepage
  layout.tsx                        ← Fonts: Playfair Display + DM Sans
  globals.css                       ← Color tokens, keyframe animations
  about/page.tsx
  q/[slug]/
    page.tsx                        ← SSG server: fetches full compiled result
    client.tsx                      ← Teaser visible, full answer hidden for SEO
  questions/
    page.tsx                        ← SSG server component
    client.tsx                      ← Category + age filters, card grid
  weird/
    page.tsx                        ← SSG server component
    client.tsx                      ← Large text list, share buttons
  sitemap.ts                        ← /sitemap.xml — 549 q pages + static
  api/
    search/route.ts                 ← Main search orchestration
    questions/route.ts              ← GET filterable questions
    signup/route.ts                 ← POST signup → Supabase + Resend
    followup-questions/route.ts     ← AI clarifying questions
    admin/
      seed-questions/route.ts       ← POST seeder (admin-protected)
  public/
    google98d83013f2627f1b.html     ← Google Search Console verification (DO NOT DELETE)

components/
  signup-prompt.tsx
  qotd-banner.tsx

hooks/
  use-signup-trigger.ts

lib/
  ai/providers/ openai.ts / anthropic.ts / gemini.ts / grok.ts
  synthesize.ts
  cache.ts
  db.ts
  email.ts                          ← Welcome + admin notification + QOTD emails
  rate-limit.ts
  validations.ts

supabase/migrations/
  001_init.sql
  002_cache.sql
  003_qotd.sql
  004_data_layer.sql
  005_aggregation.sql
  007_curated_questions.sql
  008_age_range.sql
  20260316_email_signups.sql
```

---

## Supabase Tables

| Table | Purpose |
|---|---|
| search_requests | Every search: query, status, latency, ip_hash |
| provider_results | Per-provider response per search |
| compiled_results | best_answer, consensus, disagreements, notes |
| query_cache | Exact + vector cache |
| email_signups | Signup emails |
| curated_questions | 549 questions — all seeded ✅ |
| usage_limits | IP-based rate limit counters |

---

## Environment Variables (all in Vercel)

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

## Next Session Priorities

1. **"Send me this result" email capture** on results page — light capture after answer loads
2. **Personalization layer** — inject signed-in user's past questions into synthesis prompt
3. **Saved results / history** for signed-in users
4. **Monetization tiers** — Free (5/day) → Free account (10/day + history) → Pro ($7–9/mo)
5. **SEO pillar pages** — 3–5 longer-form pages targeting high-volume terms (perimenopause, PCOS, etc.)

---

## How to Work From the Laptop (no local folder access)

Since you'll be on a laptop without access to `C:\Users\rbend\Desktop\womensai`:

1. Claude can edit files directly via GitHub API or you can clone the repo:
   ```
   git clone https://github.com/rbender-boop/womensai.git
   ```
2. All code is in the GitHub repo — fully up to date as of this handover
3. Vercel auto-deploys on every push to `main`
4. Tell Claude: "work from the GitHub repo at github.com/rbender-boop/womensai"
   and provide this handover as context at the start of the session
