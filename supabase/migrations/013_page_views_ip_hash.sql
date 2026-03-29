-- ============================================================
-- AskWomensAI — Page Views: IP Hash for Unique Visitor Tracking
-- Migration: 013_page_views_ip_hash.sql
--
-- Adds ip_hash column for deduplicating page views by visitor.
-- The hash is a truncated SHA-256 of the IP + server salt.
-- Raw IPs are never stored.
-- ============================================================

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_page_views_ip_hash ON page_views (ip_hash, created_at DESC);
