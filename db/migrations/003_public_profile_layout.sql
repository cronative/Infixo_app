-- Migration 003: Add public_profile_layout column to creators and creator_settings
-- Allowed values: 'default', 'minimal', 'creator', 'spotlight', 'studio'
ALTER TABLE creators ADD COLUMN public_profile_layout VARCHAR(32) NOT NULL DEFAULT 'default';
ALTER TABLE creator_settings ADD COLUMN public_profile_layout VARCHAR(32) NOT NULL DEFAULT 'default';
