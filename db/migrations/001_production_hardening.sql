ALTER TABLE subscriptions
  ADD COLUMN razorpay_subscription_id VARCHAR(100) NULL,
  ADD COLUMN trial_started_at DATETIME NULL,
  ADD COLUMN current_period_started_at DATETIME NULL,
  ADD COLUMN current_period_ends_at DATETIME NULL,
  ADD COLUMN renews_at DATETIME NULL,
  ADD COLUMN ends_at DATETIME NULL,
  ADD COLUMN cancelled_at DATETIME NULL,
  ADD COLUMN cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN payment_mode VARCHAR(32) NOT NULL DEFAULT 'free_trial',
  ADD COLUMN first_month_offer TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN first_month_amount INT NULL,
  ADD COLUMN first_month_currency VARCHAR(8) NULL,
  ADD COLUMN auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  ADD UNIQUE KEY uq_subscription_razorpay (razorpay_subscription_id);

CREATE TABLE payment_checkout_intents (
  id VARCHAR(64) PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  provider_type ENUM('order', 'subscription') NOT NULL,
  provider_id VARCHAR(100) NULL,
  plan_key VARCHAR(32) NOT NULL,
  billing_cycle ENUM('monthly', 'yearly') NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  status ENUM('creating', 'pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'creating',
  payment_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  UNIQUE KEY uq_checkout_provider (provider_id),
  UNIQUE KEY uq_checkout_payment (payment_id),
  INDEX idx_checkout_creator (creator_id, status),
  CONSTRAINT fk_checkout_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_webhook_events (
  event_id VARCHAR(128) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  status ENUM('processing', 'processed', 'failed') NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  error_message VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE api_rate_limits (
  key_hash CHAR(64) PRIMARY KEY,
  window_started_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
