-- Add age_range to search_requests for user segmentation and future monetization
ALTER TABLE public.search_requests
  ADD COLUMN IF NOT EXISTS age_range text;

COMMENT ON COLUMN public.search_requests.age_range IS
  'Self-reported age range from follow-up question, e.g. "25-29". Used for segmentation and monetization.';

CREATE INDEX IF NOT EXISTS idx_search_requests_age_range
  ON public.search_requests(age_range)
  WHERE age_range IS NOT NULL;
