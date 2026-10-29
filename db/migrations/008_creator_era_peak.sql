-- 008_creator_era_peak.sql
-- Add peak_fanbase and era_unlocked_pending to creators table for Creator Era virality

ALTER TABLE creators ADD COLUMN IF NOT EXISTS peak_fanbase INT UNSIGNED NULL DEFAULT NULL COMMENT 'Peak total fanbase count achieved across linked platforms';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS era_unlocked_pending TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Flag indicating if creator crossed into a new sub-level and is due a celebration';
