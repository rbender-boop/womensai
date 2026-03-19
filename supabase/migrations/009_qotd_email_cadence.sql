-- Add teaser column for email hook (short, no full answer)
ALTER TABLE public.question_of_the_day
  ADD COLUMN IF NOT EXISTS teaser text;

-- Track when email was sent (for 3-day cadence)
ALTER TABLE public.question_of_the_day
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz;
