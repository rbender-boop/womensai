-- ============================================================
-- AskWomensAI — Admin Dashboard Data Layer
-- Migration: 011_admin.sql
--
-- Adds page_views table for granular traffic tracking.
-- All other admin queries run against existing tables:
--   search_requests, share_events, email_signups,
--   anonymous_sessions, users
-- ============================================================

-- Page views — one row per navigation event
CREATE TABLE IF NOT EXISTS page_views (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  path            TEXT        NOT NULL,
  referrer        TEXT,
  session_id      UUID        REFERENCES anonymous_sessions(id),
  user_agent      TEXT,
  device_type     TEXT        -- 'mobile' | 'desktop' | 'tablet'
);

CREATE INDEX IF NOT EXISTS idx_page_views_created   ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path      ON page_views (path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session   ON page_views (session_id);
