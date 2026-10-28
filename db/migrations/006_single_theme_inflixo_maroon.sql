-- Migration 006: Inflixo Maroon is the only theme. Move every creator to it and make it the column default.
-- Applied by scripts/migrate.mjs.
UPDATE creators SET theme_key = 'inflixo-maroon' WHERE theme_key IS NULL OR theme_key <> 'inflixo-maroon';
UPDATE creator_settings SET theme_key = 'inflixo-maroon' WHERE theme_key IS NULL OR theme_key <> 'inflixo-maroon';
ALTER TABLE creators ALTER COLUMN theme_key SET DEFAULT 'inflixo-maroon';
ALTER TABLE creator_settings ALTER COLUMN theme_key SET DEFAULT 'inflixo-maroon';
