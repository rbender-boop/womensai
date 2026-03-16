-- AskWomensAI — Query cache with semantic similarity (pgvector)

-- Enable pgvector extension (run once per Supabase project)
create extension if not exists vector;

-- Query cache table
create table if not exists query_cache (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  query_hash text not null,
  query_text text not null,
  embedding vector(1536),
  compiled jsonb not null,
  providers jsonb not null,
  hit_count integer default 0,
  last_hit_at timestamptz
);

-- Exact match index
create unique index if not exists idx_query_cache_hash on query_cache(query_hash);

-- Semantic similarity index (ivfflat for cosine)
create index if not exists idx_query_cache_embedding
  on query_cache using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);
-- RPC: semantic similarity search
create or replace function match_query_cache(
  query_embedding vector(1536),
  similarity_threshold float default 0.92,
  match_count int default 1
)
returns table (
  id uuid,
  query_text text,
  compiled jsonb,
  providers jsonb,
  similarity float
)
language sql stable
as $$
  select
    qc.id,
    qc.query_text,
    qc.compiled,
    qc.providers,
    1 - (qc.embedding <=> query_embedding) as similarity
  from query_cache qc
  where 1 - (qc.embedding <=> query_embedding) > similarity_threshold
  order by qc.embedding <=> query_embedding
  limit match_count;
$$;

-- RPC: increment hit count
create or replace function increment_cache_hits(cache_id uuid)
returns void
language sql
as $$
  update query_cache
  set hit_count = hit_count + 1, last_hit_at = now()
  where id = cache_id;
$$;
