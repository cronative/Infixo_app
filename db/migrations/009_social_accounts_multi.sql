-- 009_social_accounts_multi.sql
-- Support multiple social accounts per platform with primary account flag

-- 1. Add is_primary column
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Primary account for platform (only primary accounts count toward Creator Era)';

-- 2. Mark the first (oldest) account of each platform per creator as primary
UPDATE social_accounts sa
JOIN (
  SELECT creator_id, platform, MIN(id) AS min_id
  FROM social_accounts
  GROUP BY creator_id, platform
) first_acc ON sa.id = first_acc.min_id
SET sa.is_primary = TRUE;

-- 3. Drop old unique constraint on (creator_id, platform) if exists
SET @drop_idx = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics 
      WHERE table_schema = DATABASE() 
        AND table_name = 'social_accounts' 
        AND index_name = 'unique_creator_platform'
    ),
    'ALTER TABLE social_accounts DROP INDEX unique_creator_platform',
    'SELECT 1'
  )
);
PREPARE stmt FROM @drop_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add unique constraint on (creator_id, platform, username) if not exists
SET @add_idx = (
  SELECT IF(
    NOT EXISTS(
      SELECT 1 FROM information_schema.statistics 
      WHERE table_schema = DATABASE() 
        AND table_name = 'social_accounts' 
        AND index_name = 'unique_creator_platform_username'
    ),
    'ALTER TABLE social_accounts ADD UNIQUE KEY unique_creator_platform_username (creator_id, platform, username)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @add_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
