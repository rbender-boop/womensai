# Handover — 2026-03-30

## What was done this session

### 1. Fixed broken canonical tags (CRITICAL SEO bug)
- **Problem:** Every `/q/[slug]` page had `<link rel="canonical" href="undefined/q/...">` because `process.env.NEXT_PUBLIC_APP_URL` was undefined at build time.
- **Fix:** Added `const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.askwomensai.com'` in both `app/q/[slug]/page.tsx` and `app/layout.tsx`, matching the fallback pattern already used in `app/sitemap.ts`.
- **Files changed:** `app/q/[slug]/page.tsx`, `app/layout.tsx`
- **Impact:** This was likely the primary reason Google was only indexing 1 page. All 555 `/q/` pages now have correct canonical URLs and OG tags.

### 2. Added robots.txt
- **Problem:** `robots.txt` returned 404. Not a blocker but missing best practice.
- **Fix:** Created `app/robots.ts` using Next.js MetadataRoute convention.
- **Output:** Allows all crawlers on `/`, disallows `/admin` and `/api/`, references `https://www.askwomensai.com/sitemap.xml`.

### 3. Sitemap resubmitted
- Rob resubmitted `/sitemap.xml` in Google Search Console after the fix. Status: **Success**, 555 pages discovered.

## Current state

- Canonical tags: **fixed and deployed**
- robots.txt: **live**
- Sitemap: **resubmitted, 555 pages discovered**
- Google indexing: monitor over next 3–7 days in Search Console > Indexing > Pages

## What to do next session

1. **Monitor Google indexing** — check Search Console for indexed page count increasing from 1.
2. **UTM capture fix** — still outstanding: UTM params need to be read from client-side page URL in POST body, not server-side API URL.
3. **Link email signups to anonymous session IDs** — preserves pre-signup behavioral history.
4. **End-to-end testing** of share and email flows.
5. **Reddit growth execution** — 20-day strategy doc is built; Rob's wife is posting.

## Key reminder
- `NEXT_PUBLIC_APP_URL` may not be set in Vercel env vars at all, or may not be available during static generation. The hardcoded fallback is the reliable fix. If this env var is ever added/fixed in Vercel, the fallback still works correctly (env var takes priority via `??`).
