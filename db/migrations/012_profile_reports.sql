-- 012_profile_reports.sql
-- Store visitor and user reports against public creator profiles (Linktree-style reporting)

CREATE TABLE IF NOT EXISTS profile_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  creator_username VARCHAR(100) NOT NULL,
  creator_id VARCHAR(64) NULL,
  reason VARCHAR(100) NOT NULL,
  details TEXT NULL,
  reporter_email VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  status ENUM('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reports_creator (creator_username, status),
  INDEX idx_reports_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
