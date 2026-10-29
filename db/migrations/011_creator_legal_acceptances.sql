-- 011_creator_legal_acceptances.sql
-- Additive: records which legal document versions a creator accepted, and when.
-- No personal data beyond the creator_id is stored (no IP address or user agent).
CREATE TABLE IF NOT EXISTS creator_legal_acceptances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  document_key VARCHAR(32) NOT NULL,
  document_version VARCHAR(32) NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'registration',
  accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_creator_document_version (creator_id, document_key, document_version),
  INDEX idx_creator_legal (creator_id, document_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
