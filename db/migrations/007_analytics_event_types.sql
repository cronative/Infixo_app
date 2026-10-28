-- Migration 007: analytics event types (applied idempotently by scripts/migrate.mjs).
-- event_type is VARCHAR(50); the allowed set lives in lib/analyticsDb.ts (PUBLIC_EVENT_TYPES + SERVER_EVENT_TYPES).
UPDATE analytics_events SET event_type = 'series_open' WHERE event_type = 'series_view';
UPDATE analytics_events SET event_type = 'collab_request_submit', event_target = NULL WHERE event_type = 'collaboration_submit';
DELETE FROM analytics_events WHERE event_type IN ('social_click', 'work_with_me_click', 'collaboration_click', 'service_view', 'service_click', 'brand_click', 'team_social_click');
-- Only if missing (older installs): ALTER TABLE analytics_events ADD INDEX idx_creator_analytics (creator_id, event_type, created_at);
