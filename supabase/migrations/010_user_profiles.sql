-- User profiles for auth-gated features
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  age_range text NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Service role can read/write, no public access
CREATE POLICY "user_profiles service only"
  ON public.user_profiles FOR ALL
  USING (false);
