-- 012: Add sender/recipient tracking to share_events
-- Run manually in Supabase SQL Editor

ALTER TABLE share_events
  ADD COLUMN IF NOT EXISTS sender_email    TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS query_text      TEXT,
  ADD COLUMN IF NOT EXISTS result_snapshot JSONB;

-- Allow share_events.search_request_id to be nullable (for email shares without a stored request)
ALTER TABLE share_events ALTER COLUMN search_request_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_share_events_sender    ON share_events (sender_email) WHERE sender_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_share_events_recipient ON share_events (recipient_email) WHERE recipient_email IS NOT NULL;
