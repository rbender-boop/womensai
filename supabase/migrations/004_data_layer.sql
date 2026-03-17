-- ============================================================
-- AskWomensAI — Data Monetization Layer
-- Migration: 004_data_layer.sql
--
-- Adds on top of existing search_requests / provider_results / compiled_results.
-- Goal: capture rich behavioral + classification metadata on every question
-- so the dataset compounds in value over time.
-- No affiliate hooks. No sponsored content. Clean anonymous data.
-- ============================================================

-- Required extensions (safe to re-run)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- already enabled in 002_cache.sql

-- ============================================================
-- TABLE: anonymous_sessions
-- UUID generated on first visit, stored in browser cookie.
-- The root identity for all anonymous behavioral data.
-- Linked to every search_request row.
-- ============================================================
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- behavioral counters (incremented inline, cheap reads)
  question_count        INTEGER     NOT NULL DEFAULT 0,
  session_count         INTEGER     NOT NULL DEFAULT 1,

  -- acquisition (from UTM params on first visit — never PII)
  acquisition_channel   TEXT,   -- 'reddit' | 'tiktok' | 'organic' | 'direct' | 'influencer'
  acquisition_source    TEXT,   -- utm_source raw value
  acquisition_medium    TEXT,   -- utm_medium raw value
  acquisition_campaign  TEXT,   -- utm_campaign raw value
  referrer_url          TEXT,

  -- coarse geo (IP-derived on first visit, no city/street stored)
  country_code          CHAR(2),  -- ISO 3166-1 alpha-2
  device_type           TEXT      -- 'mobile' | 'desktop' | 'tablet'
);

-- ============================================================
-- TABLE: users
-- Future accounts. Links back to anonymous_session_id
-- so pre-signup question history is preserved.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  email                       TEXT        UNIQUE NOT NULL,
  tier                        TEXT        NOT NULL DEFAULT 'free', -- 'free' | 'premium'
  premium_expires_at          TIMESTAMPTZ,

  -- link pre-signup history
  anonymous_session_id        UUID        REFERENCES anonymous_sessions(id),

  -- self-reported profile (progressive, never required)
  age_range                   TEXT,   -- '18-24' | '25-34' | '35-44' | '45-54' | '55+'
  life_stage                  TEXT,   -- 'teen' | 'reproductive' | 'perimenopause' | 'menopause' | 'postmenopause'
  health_goals                TEXT[], -- ['hormone_balance', 'fertility', 'weight_loss', ...]
  conditions                  TEXT[], -- self-reported: ['PCOS', 'endometriosis', 'thyroid', ...]
  location_country            CHAR(2),
  acquisition_channel         TEXT,

  -- usage
  question_count              INTEGER NOT NULL DEFAULT 0,
  questions_today             INTEGER NOT NULL DEFAULT 0,
  questions_today_reset_date  DATE    NOT NULL DEFAULT CURRENT_DATE
);

-- ============================================================
-- ALTER: search_requests
-- Add data-layer columns. All nullable / defaulted so
-- existing rows and existing app code are unaffected.
-- ============================================================

-- Identity
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS anonymous_session_id  UUID REFERENCES anonymous_sessions(id),
  ADD COLUMN IF NOT EXISTS user_id_fk            UUID REFERENCES users(id);
  -- Note: user_id already exists as a plain uuid; user_id_fk is the FK version

-- Auto-tagging (populated by Claude Haiku call on every submission)
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS topic_tags     TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_topic  TEXT,
  ADD COLUMN IF NOT EXISTS life_stage     TEXT,
  ADD COLUMN IF NOT EXISTS category       TEXT,
  ADD COLUMN IF NOT EXISTS sentiment      TEXT;

-- Synthesis quality signals
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS consensus_score         SMALLINT,  -- 0-100
  ADD COLUMN IF NOT EXISTS models_disagreed        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_success_count  SMALLINT NOT NULL DEFAULT 0;

-- Cache signals
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS cache_hit               BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cache_source            TEXT,    -- 'exact' | 'semantic' | 'prebuilt'
  ADD COLUMN IF NOT EXISTS served_from_request_id  UUID REFERENCES search_requests(id);

-- Follow-up chain
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS parent_request_id  UUID REFERENCES search_requests(id),
  ADD COLUMN IF NOT EXISTS chain_depth        SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chain_root_id      UUID REFERENCES search_requests(id);

-- Engagement counters
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS share_count       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follow_up_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_sent_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slug_view_count   INTEGER NOT NULL DEFAULT 0;

-- Semantic embedding (1536 to match existing query_cache dimension)
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS query_embedding  VECTOR(1536);

-- Normalized query text for exact cache lookup
ALTER TABLE search_requests
  ADD COLUMN IF NOT EXISTS query_normalized  TEXT;

-- ============================================================
-- TABLE: share_events
-- One row per share action. Channel tracked separately.
-- share_slug enables link-based acquisition attribution.
-- ============================================================
CREATE TABLE IF NOT EXISTS share_events (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  search_request_id     UUID        NOT NULL REFERENCES search_requests(id),
  anonymous_session_id  UUID        REFERENCES anonymous_sessions(id),
  user_id               UUID        REFERENCES users(id),

  share_channel         TEXT        NOT NULL,
  -- 'email_self' | 'email_friend' | 'link' | 'x' | 'facebook' | 'instagram' | 'native_share'

  share_slug            TEXT        UNIQUE,  -- e.g. askwomensai.com/a/abc123
  slug_viewed_at        TIMESTAMPTZ,
  slug_view_count       INTEGER     NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLE: usage_limits
-- Rate limiting keyed by session / user / ip_hash + date bucket.
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_limits (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type        TEXT    NOT NULL,  -- 'anonymous_session' | 'user' | 'ip_hash'
  key_value       TEXT    NOT NULL,
  date_bucket     DATE    NOT NULL DEFAULT CURRENT_DATE,
  question_count  INTEGER NOT NULL DEFAULT 0,

  UNIQUE (key_type, key_value, date_bucket)
);

-- ============================================================
-- TABLE: topic_trends
-- Nightly aggregation. One row per (week_start, topic_tag).
-- This is the monetizable data product.
-- ============================================================
CREATE TABLE IF NOT EXISTS topic_trends (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  week_start                DATE        NOT NULL,  -- Monday of the ISO week
  topic_tag                 TEXT        NOT NULL,

  -- volume
  question_count            INTEGER     NOT NULL DEFAULT 0,
  unique_session_count      INTEGER     NOT NULL DEFAULT 0,
  cache_hit_count           INTEGER     NOT NULL DEFAULT 0,

  -- engagement
  share_count               INTEGER     NOT NULL DEFAULT 0,
  follow_up_count           INTEGER     NOT NULL DEFAULT 0,
  email_sent_count          INTEGER     NOT NULL DEFAULT 0,
  avg_chain_depth           NUMERIC(4,2),

  -- synthesis quality
  consensus_score_avg       NUMERIC(5,2),
  disagreement_rate         NUMERIC(5,2),  -- % of questions where models disagreed

  -- anonymized demographic breakdowns (JSONB for flexibility)
  life_stage_breakdown      JSONB,  -- { "perimenopause": 45, "reproductive": 30, ... }
  category_breakdown        JSONB,
  sentiment_breakdown       JSONB,

  -- trend signals
  pct_change_vs_prior_week  NUMERIC(7,2),
  is_trending               BOOLEAN NOT NULL DEFAULT false,

  UNIQUE (week_start, topic_tag)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- anonymous_sessions
CREATE INDEX IF NOT EXISTS idx_anon_sessions_created_at   ON anonymous_sessions (created_at);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_channel      ON anonymous_sessions (acquisition_channel);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_country      ON anonymous_sessions (country_code);

-- users
CREATE INDEX IF NOT EXISTS idx_users_tier                 ON users (tier);
CREATE INDEX IF NOT EXISTS idx_users_anon_session         ON users (anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_users_life_stage           ON users (life_stage);

-- search_requests — new columns
CREATE INDEX IF NOT EXISTS idx_sr_anon_session            ON search_requests (anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_sr_primary_topic           ON search_requests (primary_topic);
CREATE INDEX IF NOT EXISTS idx_sr_topic_tags              ON search_requests USING GIN (topic_tags);
CREATE INDEX IF NOT EXISTS idx_sr_life_stage              ON search_requests (life_stage);
CREATE INDEX IF NOT EXISTS idx_sr_category                ON search_requests (category);
CREATE INDEX IF NOT EXISTS idx_sr_cache_hit               ON search_requests (cache_hit);
CREATE INDEX IF NOT EXISTS idx_sr_parent                  ON search_requests (parent_request_id);
CREATE INDEX IF NOT EXISTS idx_sr_chain_root              ON search_requests (chain_root_id);
CREATE INDEX IF NOT EXISTS idx_sr_normalized              ON search_requests (query_normalized);
CREATE INDEX IF NOT EXISTS idx_sr_topic_created           ON search_requests (primary_topic, created_at DESC);

-- HNSW index for semantic similarity on search_requests
-- (faster than ivfflat for our use case at this scale)
CREATE INDEX IF NOT EXISTS idx_sr_embedding
  ON search_requests USING hnsw (query_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- share_events
CREATE INDEX IF NOT EXISTS idx_share_events_request       ON share_events (search_request_id);
CREATE INDEX IF NOT EXISTS idx_share_events_session       ON share_events (anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_share_events_channel       ON share_events (share_channel);
CREATE INDEX IF NOT EXISTS idx_share_events_created_at    ON share_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_slug          ON share_events (share_slug) WHERE share_slug IS NOT NULL;

-- usage_limits
CREATE INDEX IF NOT EXISTS idx_usage_limits_key           ON usage_limits (key_type, key_value, date_bucket);

-- topic_trends
CREATE INDEX IF NOT EXISTS idx_topic_trends_week_topic    ON topic_trends (week_start DESC, topic_tag);
CREATE INDEX IF NOT EXISTS idx_topic_trends_trending      ON topic_trends (is_trending, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_topic_trends_topic         ON topic_trends (topic_tag, week_start DESC);
