-- Question of the Day table
create table if not exists public.question_of_the_day (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  question text not null,
  answer text not null,
  category text,
  model_used text,
  generated_at timestamptz default now()
);

create index if not exists idx_qotd_date on public.question_of_the_day(date desc);

-- Public read, service-role write
alter table public.question_of_the_day enable row level security;

create policy "QOTD public read"
  on public.question_of_the_day for select
  using (true);

-- Add source column to email_signups if not already present
alter table public.email_signups
  add column if not exists source text default 'unknown';
