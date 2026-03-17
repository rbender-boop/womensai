# AskWomensAI — Session Handover B
**Date:** March 16, 2026 (second session)
**Repo:** github.com/rbender-boop/womensai
**Live site:** askwomensai.com (Vercel, auto-deploys on push to main)
**Branch:** main (production) + `feminine-redesign` (kept for reference)

---

## Current State of the App

The site is a fully functional Next.js app deployed on Vercel. The homepage has been completely redesigned this session. Everything below reflects the current production state.

---

## What Was Built / Changed This Session

### 1. Feminine Redesign — Now Live on Main
The entire homepage was redesigned on a `feminine-redesign` branch and then promoted to main.

**Key design changes from old → new:**
- **Background:** Flat cream → blush-to-lavender gradient (`linear-gradient(160deg, #FDF5F8, #FBF8F5, #F6EFF9)`)
- **Header:** Static → sticky frosted glass (stays at top while scrolling)
- **Logo:** Plain → italic *AI* suffix in Playfair Display
- **Headline:** "Your health questions, answered by every AI" → "Your questions. *Every AI.* One answer." (larger, Playfair, more editorial)
- **Cards:** White flat cards → glassmorphism (frosted translucent, rose borders)
- **Buttons:** Flat rose rectangles → gradient pill buttons (rose to deep plum with glow shadow)
- **How It Works:** Icon cards → large Playfair numerals 01/02/03
- **Dividers:** Hard border lines → soft gradient fades
- **Hero:** Static → staggered fade-up animation on load (`floatIn` keyframes)
- **Search box:** Flat white → frosted glass with soft rose border and glow shadow

### 2. Search Bar Placeholder Updated
Now reads: *"Ask a health, fitness, wellness, or beauty question…"*
Expanded from health-only to include fitness, wellness, beauty.

### 3. Example Questions Updated
Replaced "What body changes are normal for girls going through puberty?" with "Best skincare routine for hormonal acne?" to better reflect the expanded scope.

### 4. Section Order Changed
- **Before:** How it works → Why we're different
- **After:** Why we're different → How it works
Rationale: hook on the *why* before explaining the *how*.

### 5. "Why we're different" — Card 1 Replaced
Old: "We ask 4 AIs, not 1" (redundant with How It Works)
New: **"Built for women. Not just adapted for them."**
> Most AI health tools are built for everyone — which means they're optimized for no one. Purpose-built for women's health, fitness, wellness, and beauty.

### 6. Card 4 Copy Fixed
"I get smarter" → **"It gets smarter every time you ask"**
Body: "The more questions you ask, the smarter it gets — and the more personalized your responses become."

### 7. Pricing Removed from Nav
Nav now: Why us · How it works · About · Sign up free
No cost signals shown to anonymous visitors.

### 8. About Page — Trust Block Added
About page now leads with a pink trust block containing:
- Michigan-based company
- Does not sell/share/profit from personal info
- Does not disclose questions to third parties
- Privacy is paramount
- *"This project was built by women, for women."*

### 9. Signup Prompt System (from previous session — still active)
Three-phase habit-first signup flow:
- Question 3 → soft bottom banner
- Question 5 → modal ("You've used today's free questions")
- 3rd return session → "Welcome back" modal
- Signed up → all prompts stop

**Hook copy:** "Sign up free — the more you ask, the smarter your answers get."

### 10. Welcome Email via Resend
From: `Kelly at AskWomensAI <kelly@askwomensai.com>`
Subject: "You're in — your answers just got personal"
Sends automatically on new signup. Duplicate signups handled gracefully.

---

## Current File Structure (Key Files)

```
app/
  page.tsx              ← Homepage (feminine redesign, NOW ON MAIN)
  layout.tsx            ← Playfair Display + DM Sans fonts loaded
  globals.css           ← Color tokens, keyframe animations
  about/page.tsx        ← Trust-first about page
  api/
    signup/route.ts     ← POST /api/signup → Supabase + Resend email
    search/route.ts     ← Main search orchestration
  results/[id]/         ← Results page

components/
  signup-prompt.tsx     ← Banner / modal / return variants

hooks/
  use-signup-trigger.ts ← localStorage-based trigger logic

lib/
  email.ts              ← Resend welcome email
  db.ts                 ← Supabase persistence
  rate-limit.ts         ← IP-based rate limiting
  cache.ts              ← Query caching

supabase/migrations/
  20260316_email_signups.sql  ← Run this in Supabase SQL Editor if not done
```

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
```

---

## Supabase Tables

### email_signups
```sql
id uuid primary key default gen_random_uuid(),
email text not null unique,
signed_up_at timestamptz not null default now(),
source text default 'signup_prompt'
```
**Status:** Migration run, table confirmed created.

### search_requests, provider_results, compiled_results
Standard search persistence tables from original build. See first handover for schema.

---

## Resend Setup
- Both `womensai.com` and `askwomensai.com` verified in Resend
- Sends outbound from `kelly@askwomensai.com`
- No inbox required — Resend handles outbound only
- To receive replies: needs Google Workspace or Zoho Mail (not set up)

---

## Branches
- `main` — production, feminine redesign live
- `feminine-redesign` — kept for reference, same as main

---

## Key Product Decisions Made This Session

**Design philosophy:** Vogue editorial clean, not pastel overload. Feminine but credible.

**Scope expansion:** Site is no longer health-only. It covers health, fitness, wellness, and beauty questions.

**Copy principle:** No "health history" language anywhere (feels like storing medical records). Use "the more you ask, the smarter it gets" instead.

**Signup philosophy:** Habit-first. Don't ask until leaving feels like losing something. The product earns the ask over 5–10 questions across 2–3 sessions.

**Trust-first about page:** Women need to trust the product before they share health questions. Lead with privacy commitments, not product features.

**No pricing in nav:** Don't signal cost to users who haven't built a habit yet.

---

## Immediate Next Steps

### Must Do
- [ ] Test full signup flow end-to-end on the new design (sign up → Supabase → email)
- [ ] Confirm welcome email delivers from `kelly@askwomensai.com`
- [ ] Verify mobile responsiveness of new glassmorphism design

### Growth / Marketing
- SEO blog content engine targeting women's health long-tail queries
- Reddit/Quora seeding for unanswered women's health questions
- Pinterest health infographic auto-generation
- Email automation: Day 7 re-engagement, limit-hit upgrade nudge

### Product Roadmap
- Personalization layer: use past questions to add context to synthesis prompt
- "Send me this result" email capture on results page
- Saved results / history for signed-in users
- Follow-up questions on results page

### Monetization (when ready)
- Free: 5 questions/day, no history
- Free account: 10/day, saved history, smarter answers
- Pro: ~$7–9/month, unlimited, deepest personalization
