-- ============================================================
-- AskWomensAI — Nightly Aggregation Function
-- Migration: 005_aggregation.sql
--
-- Populates topic_trends every night.
-- Schedule via pg_cron (enable in Supabase dashboard → Extensions)
-- or call from a Supabase Edge Function cron.
-- ============================================================

CREATE OR REPLACE FUNCTION aggregate_topic_trends(
  p_week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_prior_week_start DATE := p_week_start - INTERVAL '7 days';
BEGIN
  INSERT INTO topic_trends (
    week_start,
    topic_tag,
    question_count,
    unique_session_count,
    cache_hit_count,
    share_count,
    follow_up_count,
    email_sent_count,
    avg_chain_depth,
    consensus_score_avg,
    disagreement_rate,
    life_stage_breakdown,
    category_breakdown,
    sentiment_breakdown,
    pct_change_vs_prior_week,
    is_trending
  )
  SELECT
    p_week_start                                    AS week_start,
    tag                                             AS topic_tag,

    COUNT(*)                                        AS question_count,
    COUNT(DISTINCT sr.anonymous_session_id)         AS unique_session_count,
    SUM(CASE WHEN sr.cache_hit THEN 1 ELSE 0 END)   AS cache_hit_count,

    COALESCE(SUM(sr.share_count), 0)                AS share_count,
    COALESCE(SUM(sr.follow_up_count), 0)            AS follow_up_count,
    COALESCE(SUM(sr.email_sent_count), 0)           AS email_sent_count,
    ROUND(AVG(sr.chain_depth)::NUMERIC, 2)          AS avg_chain_depth,

    ROUND(AVG(sr.consensus_score)::NUMERIC, 2)      AS consensus_score_avg,
    ROUND(
      100.0 * SUM(CASE WHEN sr.models_disagreed THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 2
    )                                               AS disagreement_rate,

    -- anonymized breakdowns
    (
      SELECT jsonb_object_agg(ls, cnt)
      FROM (
        SELECT COALESCE(life_stage, 'unknown') AS ls, COUNT(*) AS cnt
        FROM search_requests sr2
        CROSS JOIN LATERAL unnest(sr2.topic_tags) AS t
        WHERE t = tag
          AND sr2.created_at >= p_week_start
          AND sr2.created_at < p_week_start + INTERVAL '7 days'
          AND sr2.status IN ('success', 'partial_failure')
        GROUP BY ls
      ) x
    )                                               AS life_stage_breakdown,

    (
      SELECT jsonb_object_agg(cat, cnt)
      FROM (
        SELECT COALESCE(category, 'unknown') AS cat, COUNT(*) AS cnt
        FROM search_requests sr2
        CROSS JOIN LATERAL unnest(sr2.topic_tags) AS t
        WHERE t = tag
          AND sr2.created_at >= p_week_start
          AND sr2.created_at < p_week_start + INTERVAL '7 days'
          AND sr2.status IN ('success', 'partial_failure')
        GROUP BY cat
      ) x
    )                                               AS category_breakdown,

    (
      SELECT jsonb_object_agg(sent, cnt)
      FROM (
        SELECT COALESCE(sentiment, 'unknown') AS sent, COUNT(*) AS cnt
        FROM search_requests sr2
        CROSS JOIN LATERAL unnest(sr2.topic_tags) AS t
        WHERE t = tag
          AND sr2.created_at >= p_week_start
          AND sr2.created_at < p_week_start + INTERVAL '7 days'
          AND sr2.status IN ('success', 'partial_failure')
        GROUP BY sent
      ) x
    )                                               AS sentiment_breakdown,

    ROUND(
      100.0 * (COUNT(*) - COALESCE(prior.question_count, 0))
        / NULLIF(COALESCE(prior.question_count, 0), 0), 2
    )                                               AS pct_change_vs_prior_week,

    -- trending: >20% WoW growth AND at least 10 questions this week
    (
      COUNT(*) >= 10
      AND (
        COALESCE(prior.question_count, 0) = 0
        OR COUNT(*) > COALESCE(prior.question_count, 0) * 1.20
      )
    )                                               AS is_trending

  FROM search_requests sr
  CROSS JOIN LATERAL unnest(sr.topic_tags) AS tag

  LEFT JOIN topic_trends prior
    ON prior.topic_tag = tag
    AND prior.week_start = v_prior_week_start

  WHERE
    sr.created_at >= p_week_start
    AND sr.created_at < p_week_start + INTERVAL '7 days'
    AND sr.status IN ('success', 'partial_failure')
    AND cardinality(sr.topic_tags) > 0

  GROUP BY tag, prior.question_count

  ON CONFLICT (week_start, topic_tag)
  DO UPDATE SET
    question_count           = EXCLUDED.question_count,
    unique_session_count     = EXCLUDED.unique_session_count,
    cache_hit_count          = EXCLUDED.cache_hit_count,
    share_count              = EXCLUDED.share_count,
    follow_up_count          = EXCLUDED.follow_up_count,
    email_sent_count         = EXCLUDED.email_sent_count,
    avg_chain_depth          = EXCLUDED.avg_chain_depth,
    consensus_score_avg      = EXCLUDED.consensus_score_avg,
    disagreement_rate        = EXCLUDED.disagreement_rate,
    life_stage_breakdown     = EXCLUDED.life_stage_breakdown,
    category_breakdown       = EXCLUDED.category_breakdown,
    sentiment_breakdown      = EXCLUDED.sentiment_breakdown,
    pct_change_vs_prior_week = EXCLUDED.pct_change_vs_prior_week,
    is_trending              = EXCLUDED.is_trending,
    created_at               = now();
END;
$$;

-- ============================================================
-- Schedule: 2:00 AM UTC daily
-- Uncomment after enabling pg_cron in Supabase dashboard.
-- ============================================================
-- SELECT cron.schedule(
--   'aggregate-topic-trends',
--   '0 2 * * *',
--   $$ SELECT aggregate_topic_trends(); $$
-- );
