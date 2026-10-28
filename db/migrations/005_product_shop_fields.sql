-- Migration 005: Shop fields for creator products (applied idempotently by scripts/migrate.mjs).
ALTER TABLE creator_products ADD COLUMN note VARCHAR(120) DEFAULT NULL;
ALTER TABLE creator_products ADD COLUMN is_affiliate TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE creator_products ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE creator_products ADD INDEX idx_creator_products_active (creator_id, deleted_at);
