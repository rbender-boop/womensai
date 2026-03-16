-- EveryGPT v1 schema

create table if not exists search_requests (
  id uuid primary key,
  created_at timestamptz default now(),
  user_id uuid,
  session_id text,
  ip_hash text,
  query_text text not null,
  status text not null default 'pending',
  total_latency_ms integer,
  synthesis_latency_ms integer,
  success_provider_count integer default 0,
  failed_provider_count integer default 0,
  final_cost_estimate numeric(10,6)
);

create table if not exists provider_results (
  id uuid primary key default gen_random_uuid(),
  search_request_id uuid references search_requests(id) on delete cascade,
  provider_name text not null,
  model_name text,
  status text not null,
  latency_ms integer,
  prompt_tokens_est integer,
  completion_tokens_est integer,
  cost_estimate numeric(10,6),
  raw_text text,
  normalized_text text,
  error_message text
);

create table if not exists compiled_results (
  id uuid primary key default gen_random_uuid(),
  search_request_id uuid references search_requests(id) on delete cascade,
  best_answer text,
  consensus jsonb,
  disagreements jsonb,
  notes text,
  synthesis_model text
);

-- Indexes
create index if not exists idx_search_requests_ip_hash on search_requests(ip_hash);
create index if not exists idx_search_requests_created_at on search_requests(created_at);
create index if not exists idx_provider_results_request_id on provider_results(search_request_id);
create index if not exists idx_compiled_results_request_id on compiled_results(search_request_id);
