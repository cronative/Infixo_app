-- ============================================================================
-- INFLIXO - MySQL Test Seed Data
-- Run this query after importing schema.sql to populate demo creator data.
-- ============================================================================

USE inflixo_db;

-- 1. Insert Demo Creator Profile
INSERT INTO creators (
  id, email, phone, display_name, username, photo_url, category, bio, theme_key, onboarding_step, is_verified
) VALUES (
  'cr_demo123',
  'creator@inflixo.com',
  '+919876543210',
  'Nikunj Sharma',
  'nikunj',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'Travel & Tech',
  'Filmmaker & Tech Explorer 🚀 Creating cinematic vlogs and building next-gen web apps for creators.',
  'modern-purple',
  'finish',
  TRUE
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 2. Insert Creator Social Accounts (Separate Row Entries Per Platform)
INSERT INTO social_accounts (
  creator_id, platform, account_name, username, follower_count, media_count, audience_count, is_verified, last_synced_at
) VALUES 
('cr_demo123', 'instagram', 'Nikunj Sharma', 'nikunj_vlogs', 1250000, 342, 1250000, TRUE, NOW()),
('cr_demo123', 'youtube', 'Nikunj Tech & Film', 'nikunj_tech', 2450000, 185, 2450000, TRUE, NOW()),
('cr_demo123', 'facebook', 'Nikunj Official Page', 'nikunj_official', 890000, 52, 890000, FALSE, NOW())
ON DUPLICATE KEY UPDATE account_name = VALUES(account_name), follower_count = VALUES(follower_count);

-- 3. Insert Sample OTT Series
INSERT INTO series (
  id, creator_id, title, poster_url, description, platform, genres, language, display_order
) VALUES (
  'ser_kashmir_01',
  'cr_demo123',
  'Kashmir Diaries: The Winter Quest',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
  'An epic travel adventure across Gulmarg, Pahalgam, and Dal Lake during peak snowfall.',
  'YouTube',
  'Travel & Vlogs, Documentary, Short Film',
  'Hindi / English',
  1
) ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 4. Insert Series Episodes
INSERT INTO episodes (
  id, series_id, episode_number, title, external_url, platform
) VALUES
('ep_001', 'ser_kashmir_01', 1, 'Episode 1: Arrival in Srinagar & Frozen Lakes', 'https://youtube.com/watch?v=demo1', 'YouTube'),
('ep_002', 'ser_kashmir_01', 2, 'Episode 2: Gulmarg Gondola & Snow Storm', 'https://youtube.com/watch?v=demo2', 'YouTube'),
('ep_003', 'ser_kashmir_01', 3, 'Episode 3: Pahalgam Valleys & Local Traditions', 'https://youtube.com/watch?v=demo3', 'YouTube')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 5. Insert Active Subscription Plan (Pro Plan)
INSERT INTO subscriptions (
  creator_id, plan_key, plan_name, billing_cycle, status, trial_ends_at, activated_at
) VALUES (
  'cr_demo123',
  'pro',
  'Pro Plan',
  'yearly',
  'active',
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  NOW()
) ON DUPLICATE KEY UPDATE plan_key = VALUES(plan_key);
