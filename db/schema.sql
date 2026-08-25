-- ============================================================================
-- INFLIXO - MySQL Production Database Schema
-- ============================================================================
-- Database Creation & Setup
-- ============================================================================

CREATE DATABASE IF NOT EXISTS inflixo_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inflixo_db;

-- Disable Foreign Key checks temporarily during schema initialization
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist (For clean resets if needed)
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS episodes;
DROP TABLE IF EXISTS series;
DROP TABLE IF EXISTS social_accounts;
DROP TABLE IF EXISTS creators;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. CREATORS TABLE (Users, Auth & Base Profiles)
-- ============================================================================
CREATE TABLE creators (
  id VARCHAR(64) NOT NULL PRIMARY KEY COMMENT 'Unique Creator ID (e.g. cr_123456)',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Creator login email address',
  phone VARCHAR(20) DEFAULT NULL COMMENT 'Optional phone number',
  display_name VARCHAR(100) NOT NULL COMMENT 'Full display name shown on profile',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique URL slug (inflixo.com/username)',
  photo_url TEXT DEFAULT NULL COMMENT 'Avatar / profile photo image URL or Data URL',
  category VARCHAR(50) DEFAULT NULL COMMENT 'Broad content category (e.g. Technology, Entertainment, Gaming)',
  profession VARCHAR(100) DEFAULT NULL COMMENT 'Specific creator profession / role (e.g. Tech Reviewer, Vlogger, Chef)',
  bio TEXT DEFAULT NULL COMMENT 'Creator short bio / description (max 160 chars)',
  city VARCHAR(100) DEFAULT NULL COMMENT 'Creator city',
  state VARCHAR(100) DEFAULT NULL COMMENT 'Creator state / region',
  country VARCHAR(100) DEFAULT NULL COMMENT 'Creator country',
  theme_key VARCHAR(50) NOT NULL DEFAULT 'minimal-white' COMMENT 'Active visual theme key (1 of 20 themes)',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Verified creator badge status',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SOCIAL ACCOUNTS TABLE (Multi-Row per Platform Account)
-- ============================================================================
CREATE TABLE social_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  platform ENUM('instagram', 'youtube', 'facebook') NOT NULL COMMENT 'Social Platform Type',
  account_name VARCHAR(255) DEFAULT NULL COMMENT 'Full Display Name or Channel Title (e.g. Linus Tech Tips)',
  username VARCHAR(150) NOT NULL COMMENT 'Username, Channel Handle, or Page Name (e.g. nikunj_vlogs)',
  follower_count BIGINT NOT NULL DEFAULT 0 COMMENT 'Follower Count (Instagram/Facebook) or Subscriber Count (YouTube)',
  media_count INT NOT NULL DEFAULT 0 COMMENT 'Posts Count (Instagram) or Video Count (YouTube)',
  audience_count BIGINT NOT NULL DEFAULT 0 COMMENT 'Platform Audience Reach Count',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Verified Account Status Badge',
  last_synced_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp of last RapidAPI auto-sync',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  UNIQUE KEY unique_creator_platform (creator_id, platform),
  INDEX idx_creator_socials (creator_id),
  INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. SERIES TABLE (OTT Shows & Video Collections - Direct Episodes, No Seasons)
-- ============================================================================
CREATE TABLE series (
  id VARCHAR(64) NOT NULL PRIMARY KEY COMMENT 'Unique Series ID (e.g. ser_123456)',
  creator_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT 'Series Title',
  poster_url TEXT DEFAULT NULL COMMENT 'Series poster image URL',
  description TEXT DEFAULT NULL COMMENT 'Short series synopsis / description',
  platform ENUM('YouTube', 'Instagram', 'Facebook') NOT NULL DEFAULT 'YouTube' COMMENT 'Primary social video platform for series',
  genres VARCHAR(255) DEFAULT NULL COMMENT 'Comma-separated genres (up to 5, e.g. Travel, Vlog, Tech)',
  language VARCHAR(50) DEFAULT NULL COMMENT 'Language of content (e.g. Hindi, English)',
  display_order INT NOT NULL DEFAULT 0 COMMENT 'Sorting order on public profile page',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  INDEX idx_creator_series (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. EPISODES TABLE (Video Links with Title & Number)
-- ============================================================================
CREATE TABLE episodes (
  id VARCHAR(64) NOT NULL PRIMARY KEY COMMENT 'Unique Episode ID (e.g. ep_123456)',
  series_id VARCHAR(64) NOT NULL,
  episode_number INT NOT NULL COMMENT 'Episode position (1, 2, 3...)',
  title VARCHAR(255) NOT NULL COMMENT 'Episode Title (e.g. Episode 1: Arrival)',
  external_url TEXT NOT NULL COMMENT 'Video link URL (YouTube/Instagram Reel/Facebook Video)',
  platform ENUM('YouTube', 'Instagram', 'Facebook') NOT NULL DEFAULT 'YouTube',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  INDEX idx_series_episodes (series_id, episode_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. SUBSCRIPTIONS TABLE (Starter, Growth, Pro, Unlimited Plans)
-- ============================================================================
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL UNIQUE,
  plan_key VARCHAR(32) NOT NULL DEFAULT 'free',
  plan_name VARCHAR(50) NOT NULL DEFAULT 'Free Basic Plan',
  billing_cycle ENUM('monthly', 'yearly') NOT NULL DEFAULT 'yearly',
  status ENUM('trial', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP NULL DEFAULT NULL COMMENT '7-Day Free Trial expiration date',
  activated_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Subscription activation date',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  INDEX idx_subscription_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. OTPS TABLE (Dynamic 4-Digit Verification Codes - 5 Minute Expiration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS otps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL COMMENT 'OTP Expiration timestamp (5 minutes after creation)',
  is_used BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Mark true once verified',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_otp (email, otp_code, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. ANALYTICS EVENTS TABLE (Profile Views & Video Plays Tracking)
-- ============================================================================
CREATE TABLE analytics_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  event_type ENUM('profile_view', 'social_click', 'episode_play', 'share_click') NOT NULL,
  event_target VARCHAR(255) DEFAULT NULL COMMENT 'Platform clicked or Episode ID played',
  user_agent TEXT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  INDEX idx_creator_analytics (creator_id, event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. NEW INCREMENTAL MIGRATIONS & UPDATES (ADD NEW QUERIES BELOW THIS LINE)
-- ============================================================================
-- Copy and run queries in this section on your live VPS database:

-- Migration 1: Create OTPS Table for 4-Digit OTP Verification (5 Min Expiration)
CREATE TABLE IF NOT EXISTS otps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL COMMENT 'OTP Expiration timestamp (5 minutes after creation)',
  is_used BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Mark true once verified',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_otp (email, otp_code, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration 2: Adjust creators table columns for blank new profile onboarding
ALTER TABLE creators MODIFY COLUMN display_name VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE creators MODIFY COLUMN username VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE creators MODIFY COLUMN onboarding_step VARCHAR(50) NOT NULL DEFAULT 'profile';

-- Migration 3: Create creator_onboarding_steps Table for Step-by-Step Onboarding Tracking (1 Row Per Email)
CREATE TABLE IF NOT EXISTS creator_onboarding_steps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  creator_id VARCHAR(64) DEFAULT NULL,
  step_name ENUM('otp_verified', 'profile', 'socials', 'theme', 'series', 'subscription', 'finish') NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email_step (email, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration 4: Remove deprecated onboarding_step column from creators table (tracked in creator_onboarding_steps table)
ALTER TABLE creators DROP COLUMN IF EXISTS onboarding_step;

-- Migration 5: Ensure exactly 1 single row per email in creator_onboarding_steps table (REPLACE on existing email)
ALTER TABLE creator_onboarding_steps DROP INDEX IF EXISTS unique_email_step;
ALTER TABLE creator_onboarding_steps ADD UNIQUE KEY IF NOT EXISTS unique_email (email);

-- Migration 6: Add City, State, Country location columns to creators table
ALTER TABLE creators ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT NULL;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT NULL;

-- Migration 7: Add specific profession / creator type column to creators table
ALTER TABLE creators ADD COLUMN IF NOT EXISTS profession VARCHAR(100) DEFAULT NULL;

-- Migration 8: Razorpay Payment Gateway Integration (Recurring Subscriptions)
-- ----------------------------------------------------------------------------
-- 8a. Fix plan_key ENUM — was missing 'free' and had a stale 'growth' value
--     that doesn't exist in the app's plan catalog (free/starter/pro/unlimited).
ALTER TABLE subscriptions MODIFY COLUMN plan_key ENUM('early_access', 'creator_pro', 'creator_VIP', 'free', 'starter', 'pro', 'unlimited') NOT NULL DEFAULT 'early_access';

-- 8b. Track the Razorpay subscription/customer/plan behind each row.
--     razorpay_status mirrors Razorpay's own subscription status vocabulary
--     (created/authenticated/active/paused/cancelled/completed/expired) so
--     webhook events can be recorded without lossy mapping onto our simpler
--     app-level `status` enum.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(64) DEFAULT NULL COMMENT 'Razorpay subscription ID (sub_xxx) for paid plans';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(64) DEFAULT NULL COMMENT 'Razorpay customer ID (cust_xxx)';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_plan_id VARCHAR(64) DEFAULT NULL COMMENT 'Razorpay plan ID (plan_xxx) currently mapped to this row';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_status VARCHAR(32) DEFAULT NULL COMMENT 'Raw Razorpay subscription status from last webhook/verify call';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE subscriptions ADD UNIQUE KEY IF NOT EXISTS unique_razorpay_subscription (razorpay_subscription_id);

-- 8c. Cache table mapping our (plan_key, billing_cycle) pairs to the Razorpay
--     Plan resource created for them on first use, so we don't create a
--     duplicate Razorpay Plan every time someone checks out.
CREATE TABLE IF NOT EXISTS razorpay_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_key ENUM('starter', 'pro', 'unlimited') NOT NULL COMMENT 'Free plan never gets a Razorpay plan',
  billing_cycle ENUM('monthly', 'yearly') NOT NULL,
  razorpay_plan_id VARCHAR(64) NOT NULL,
  amount_paise INT NOT NULL COMMENT 'Plan amount in paise (Razorpay base unit)',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_plan_cycle (plan_key, billing_cycle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8d. Raw webhook event log for audit + idempotency (skip re-processing an
--     event_id we've already seen).
CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(64) DEFAULT NULL COMMENT 'Razorpay X-Razorpay-Event-Id header, when present',
  event_type VARCHAR(64) NOT NULL COMMENT 'e.g. subscription.activated, subscription.charged',
  razorpay_subscription_id VARCHAR(64) DEFAULT NULL,
  payload JSON NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CREATOR REVIEWS & TESTIMONIALS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_reviews (
  id VARCHAR(64) NOT NULL PRIMARY KEY COMMENT 'Unique Review ID (e.g. rev_123456)',
  creator_id VARCHAR(64) NOT NULL COMMENT 'Creator ID / Creator Email',
  token VARCHAR(128) NOT NULL UNIQUE COMMENT 'Unique submission URL token',
  client_name VARCHAR(150) NOT NULL COMMENT 'Client / Brand Representative Name',
  client_email VARCHAR(255) NOT NULL COMMENT 'Client Email address',
  client_designation VARCHAR(150) DEFAULT NULL COMMENT 'Designation or Brand (e.g. Marketing Manager @ Puma)',
  project_title VARCHAR(255) NOT NULL COMMENT 'Project / Deliverable Title (e.g. 1x Reel Campaign)',
  content_url TEXT NOT NULL COMMENT 'Mandatory link of reels, shoot, short etc',
  rating INT NOT NULL DEFAULT 5 COMMENT 'Overall Experience Rating (1 to 5)',
  rating_content_quality INT NOT NULL DEFAULT 5 COMMENT 'Content Quality Rating (1 to 5)',
  rating_professionalism INT NOT NULL DEFAULT 5 COMMENT 'Professionalism Rating (1 to 5)',
  rating_timely_delivery INT NOT NULL DEFAULT 5 COMMENT 'Timely Delivery Rating (1 to 5)',
  comment TEXT DEFAULT NULL COMMENT 'Testimonial / Review Text',
  status ENUM('pending_invite', 'pending_approval', 'approved', 'rejected') NOT NULL DEFAULT 'pending_invite' COMMENT 'Review Workflow Status',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_creator_reviews (creator_id, status),
  INDEX idx_review_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. CREATOR SETTINGS TABLE (Dedicated table for Page Display Visibility & Preferences)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL UNIQUE COMMENT 'FK to creators table ID',
  visibility_settings TEXT DEFAULT NULL COMMENT 'JSON settings to show/hide page sections (fanbase, socials, series, gigs, reviews, links)',
  theme_key VARCHAR(50) DEFAULT 'minimal-white' COMMENT 'Active visual theme key',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  INDEX idx_creator_settings (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
