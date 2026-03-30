# AskWomensAI — SEO & GEO Session Handover
**Date:** March 30, 2026
**Session focus:** Full SEO/GEO technical implementation + answer pipeline fix

---

## What was accomplished this session

### 1. SEO/GEO Technical Fixes (Commit 1)
All pushed to `rbender-boop/womensai` main branch in one commit.

| File | Change |
|------|--------|
| `app/robots.ts` | Added explicit allow rules for GPTBot, ClaudeBot, PerplexityBot, GoogleOther |
| `public/llms.txt` | Created — AI-readable site description for GEO (Perplexity, ChatGPT citations) |
| `app/layout.tsx` | Added canonical tag, Organization + WebSite JSON-LD on every page, og:image + twitter:card summary_large_image |
| `app/opengraph-image.tsx` | Created — server-generated branded OG image (edge runtime, no PNG needed) |
| `app/q/[slug]/opengraph-image.tsx` | Created — per-question dynamic OG image with question text from Supabase |
| `app/q/[slug]/page.tsx` | Added breadcrumb JSON-LD, improved meta description template, og:image wired to dynamic route |
| `app/q/[slug]/client.tsx` | Removed aria-hidden from hidden answer div, replaced -9999px hack with proper sr-only clip style |
| `app/about/page.tsx` | Fixed unicode rendering (\u2713, \u2014), added metadata export with canonical, added Robert & Kelly Bender founder section + LinkedIn, added Editorial Approach section |

### 2. SEO Pass 2 (Commit 2)
Remaining pages that had zero metadata:

| File | Change |
|------|--------|
| `app/privacy/page.tsx` | Added metadata export with title, description, canonical |
| `app/terms/page.tsx` | Added metadata export with title, description, canonical |
| `app/how-it-works/page.tsx` | Added metadata export with title, description, canonical, og:image |
| `app/questions/page.tsx` | Added og:image and twitter:card |
| `app/weird/page.tsx` | Added og:image and twitter:card |
| `app/sitemap.ts` | Added `/how-it-works` to static pages, fixed priorities, hardcoded base URL |

### 3. Critical Answer Pipeline Fix
**Root cause discovered:** 549 curated questions had `search_request_id = NULL` — meaning no answers were linked to the `/q/[slug]` pages. The AI pipeline had been run previously and answers existed in `query_cache`, but the pipeline never wrote back to `curated_questions.search_request_id`.

**Fix applied:** SQL migration run directly in Supabase SQL Editor:
```sql
DO $$
DECLARE
  r RECORD;
  new_request_id UUID;
BEGIN
  FOR r IN
    SELECT cq.id AS cq_id, qc.compiled, qc.query_text
    FROM curated_questions cq
    JOIN query_cache qc
      ON LOWER(TRIM(qc.query_text)) = LOWER(TRIM(cq.question))
    WHERE cq.search_request_id IS NULL
  LOOP
    new_request_id := gen_random_uuid();

    INSERT INTO search_requests (
      id, query_text, query_normalized,
      ip_hash, status,
      total_latency_ms, success_provider_count, failed_provider_count,
      provider_success_count
    ) VALUES (
      new_request_id,
      r.query_text,
      LOWER(TRIM(r.query_text)),
      'seeded',
      'success',
      0, 4, 0, 4
    );

    INSERT INTO compiled_results (
      search_request_id,
      best_answer,
      consensus,
      disagreements,
      notes,
      synthesis_model
    ) VALUES (
      new_request_id,
      r.compiled->>'bestAnswer',
      r.compiled->'consensus',
      r.compiled->'disagreements',
      r.compiled->>'notes',
      r.compiled->>'synthesisModel'
    );

    UPDATE curated_questions
    SET search_request_id = new_request_id
    WHERE id = r.cq_id;

  END LOOP;
END $$;
```

**Result:** All 549 questions linked (linked: 549, still_empty: 0).

### 4. Verification
- Google Rich Results Test on `/q/why-do-i-get-so-tired-before-my-period` returned **2 valid items: FAQPage + Breadcrumbs** ✅
- Sitemap shows **555 pages discovered, processed successfully** as of 3/30/26 ✅
- Manual indexing requested on ~10 high-value URLs in Google Search Console ✅

---

## Current state of the DB

| Table | Count |
|-------|-------|
| curated_questions | 549 (all linked to search_request_id) |
| compiled_results | 549+ |
| query_cache | 549+ (source of truth for answers) |
| search_requests | 549+ (seeded rows with ip_hash = 'seeded') |

---

## What still needs to happen

### Immediate (next 1-7 days)
- **Monitor GSC** — check Indexing → Pages daily. Should climb from 1 indexed page toward 100+ within a week as Google processes the sitemap crawl.
- **Verify Vercel redeploy** fired after the SEO commits. If not, trigger manually in Vercel dashboard → Deployments → Redeploy.

### Short term
- **Social profiles** — create Twitter/X `@askwomensai` and LinkedIn company page, then add those URLs to the `sameAs` array in `layout.tsx` Organization schema. This connects the brand to Google's Knowledge Graph.
- **Backlinks** — one editorial mention from a DA50+ health site (Healthline, Byrdie, Well+Good) will do more than any further technical fixes.
- **UTM capture fix** — must read from client-side page URL in POST body, not server-side API URL (known issue, deferred).
- **Link email signups to anonymous session IDs** — preserve pre-signup behavioral history (known issue, deferred).

### Future
- Reddit growth strategy (20-day plan built, wife posting)
- Native mobile app

---

## Key files changed this session
```
app/robots.ts
app/layout.tsx
app/opengraph-image.tsx
app/q/[slug]/opengraph-image.tsx
app/q/[slug]/page.tsx
app/q/[slug]/client.tsx
app/about/page.tsx
app/privacy/page.tsx
app/terms/page.tsx
app/how-it-works/page.tsx
app/questions/page.tsx
app/weird/page.tsx
app/sitemap.ts
public/llms.txt
```

---

## Notes for next Claude session
- Always run `git pull origin main` before reading local files — local copy at `C:\Users\rbend\Desktop\Claude Creations - Master Folder\everygpt` may be behind remote.
- Supabase migrations are manual — always paste SQL in chat AND push to repo. Rob runs manually in Supabase SQL Editor.
- The `query_cache` table is the source of truth for compiled answers. `compiled_results` is now populated from it via the migration above.
- Do NOT re-run the bulk answer generation script — answers are already in the DB.
