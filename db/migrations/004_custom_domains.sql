-- Migration 004: Add custom domain mapping fields to creators table
ALTER TABLE creators ADD COLUMN custom_domain VARCHAR(255) NULL UNIQUE COMMENT 'Custom vanity domain or subdomain (e.g. links.creator.com)';
ALTER TABLE creators ADD COLUMN custom_domain_verified TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether DNS CNAME record has been verified';
ALTER TABLE creators ADD COLUMN custom_domain_configured_at DATETIME NULL;
