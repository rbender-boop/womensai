-- Email signups table for AskWomensAI signup prompt
create table if not exists email_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  signed_up_at timestamptz not null default now(),
  source text default 'signup_prompt'
);

-- Index for lookups
create index if not exists email_signups_email_idx on email_signups (email);
