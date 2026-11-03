-- Kapas becomes the default theme for new creators.
-- Existing creators keep whatever theme_key they already have.
ALTER TABLE creators ALTER COLUMN theme_key SET DEFAULT 'kapas';
ALTER TABLE creator_settings ALTER COLUMN theme_key SET DEFAULT 'kapas';
