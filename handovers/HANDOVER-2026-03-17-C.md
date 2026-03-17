# AskWomensAI — Session Handover
**Date:** March 17, 2026 — Session E (evening)
**Repo:** github.com/rbender-boop/womensai
**Live site:** https://www.askwomensai.com
**Last commit:** `4bb5716` — fix: welcome email — better and more personalized copy

---

## What Was Built This Session

### 1. `app/questions/page.tsx` + `app/questions/client.tsx`
- Server component fetches all non-weird questions at build time (`revalidate = 86400`)
- Client: 12-category filter pills + age group chips (All ages / 18–24 / 25–34 / 35–44 / 45–54 / 55+)
- 3-col responsive glassmorphism card grid → each card links to `/q/[slug]`
- Full SEO metadata + canonical URL
- **NOT in main nav** — footer-only link (hidden from casual users, fully indexable by Google)

### 2. `app/weird/page.tsx` + `app/weird/client.tsx`
- Server component fetches `is_weird = true` questions only
- Playful large-text Playfair list layout
- Twitter/X + WhatsApp share buttons on every card, pre-filled with question text + URL
- Full SEO metadata + canonical URL
- **NOT in main nav** — footer-only link

### 3. `app/sitemap.ts`
- Dynamically fetches all 549 `/q/[slug]` URLs from Supabase at build time
- Includes `/questions` (priority 0.8), `/weird` (priority 0.7), and all static pages
- Accessible at `https://www.askwomensai.com/sitemap.xml` — ready for Search Console submission

### 4. Footer updates
- `app/page.tsx` footer: added Questions + Weird Questions links
- `app/q/[slug]/client.tsx` footer: added Questions + Weird Questions links (internal linking for SEO crawl)
- Both `app/questions/client.tsx` and `app/weird/client.tsx` footers include full link set

### 5. Homepage copy fix (`app/page.tsx`)
- Signup section italic line: "the smarter and more personalized your answers get."
- Subtext: "Your questions always remain anonymous. No credit card. No commitment."
- Hero paragraph `maxWidth` tightened (500px → 440px / 380px) for cleaner line breaks

### 6. Welcome email copy fix (`lib/email.ts`)
- Removed "health history" language (permanent product decision — never use this phrase)
- Added "Your profile is anonymous." as italic rose-colored subheading under "You're in."
- Body copy: "The more you ask, the smarter and more personalized your answers get — and your questions always remain anonymous."
- Last line: "Keep asking. The more context we have, the better and more personalized your answers get."
- Subject line changed to: "You're in — your profile is anonymous"

---

## Current Git State
- Local and remote (`origin/main`) are fully in sync
- Working tree is clean — nothing pending

### Recent commits (newest first)
```
4bb5716  fix: welcome email — better and more personalized copy
f596c13  fix: tighten hero paragraph widths for cleaner line breaks
3245390  fix: welcome email copy — anonymous profile, remove health history language
0a0fc4d  Session D: questions index, weird page, sitemap, footer SEO links, signup copy update
27860cf  Session D: questions index, weird page, sitemap, footer SEO links
```

---

## Seeding Status (as of this session)

The PowerShell seeder was accidentally closed mid-run. It is safe to restart —
the seeder skips questions where `seeded_at IS NOT NULL`.

### To check progress:
```sql
SELECT
  COUNT(*) FILTER (WHERE seeded_at IS NOT NULL) AS done,
  COUNT(*) FILTER (WHERE seeded_at IS NULL) AS remaining
FROM curated_questions;
```

### To restart the seeder:
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

### Do NOT submit sitemap to Google Search Console until seeding is 100% complete.
The `/q/[slug]` pages use the seeded cache to show a real answer teaser.
Submitting before seeding = Google crawls thin/empty pages on first visit.

---

## Permanent Product Decisions (never break these)

- **Never use "health history" language** — use "the more you ask, the smarter it gets"
- **Questions/Weird pages are footer-only** — not in main nav
- **Anonymous framing is core** — always reinforce that questions are anonymous
- **Answer gate on `/q/[slug]`** — teaser shown, full answer requires clicking CTA → fires from cache
- **Loading animation always plays** even on cache hits (~2–3s minimum) so users feel the 4-AI experience
- **Design:** Vogue editorial clean. Glassmorphism cards, rose/plum palette, Playfair Display headings

---

## Next Session Priorities (in order)

1. **Submit sitemap to Google Search Console** — manual step, do after seeding completes
   → `https://www.askwomensai.com/sitemap.xml`

2. **"Send me this result" email capture** — light-touch email capture on results page after answer loads

3. **Personalization layer** — inject signed-in user's past question history into synthesis prompt

4. **Saved results / history** — for signed-in users

5. **Monetization tiers** — Free (5/day) → Free account (10/day + history) → Pro ($7–9/mo, unlimited)

---

## Key File Locations

```
app/
  page.tsx                        ← Homepage (hero copy, signup section, footer)
  questions/
    page.tsx                      ← SSG server component
    client.tsx                    ← Category + age filters, card grid
  weird/
    page.tsx                      ← SSG server component
    client.tsx                    ← Large text list, share buttons
  sitemap.ts                      ← /sitemap.xml (549 q pages + static)
  q/[slug]/
    page.tsx                      ← SSG SEO page
    client.tsx                    ← Answer gate UI, footer with SEO links
lib/
  email.ts                        ← Welcome email, signup notification, QOTD email
```

---

## Environment Variables (all live in Vercel)
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
