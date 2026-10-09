-- Migration 005: Add traffic_source column to analytics_events
-- Tracks external referrer sources (e.g. instagram, youtube, whatsapp, direct, other)

ALTER TABLE analytics_events
ADD COLUMN traffic_source VARCHAR(64) DEFAULT NULL AFTER source;

ALTER TABLE analytics_events
ADD INDEX idx_creator_traffic_source (creator_id, traffic_source, created_at);
