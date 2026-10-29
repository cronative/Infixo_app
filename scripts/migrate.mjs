import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";

const subscriptionColumns = {
  razorpay_subscription_id: "VARCHAR(100) NULL",
  trial_started_at: "DATETIME NULL",
  current_period_started_at: "DATETIME NULL",
  current_period_ends_at: "DATETIME NULL",
  renews_at: "DATETIME NULL",
  ends_at: "DATETIME NULL",
  cancelled_at: "DATETIME NULL",
  cancel_at_period_end: "TINYINT(1) NOT NULL DEFAULT 0",
  payment_mode: "VARCHAR(32) NOT NULL DEFAULT 'free_trial'",
  first_month_offer: "TINYINT(1) NOT NULL DEFAULT 0",
  first_month_amount: "INT NULL",
  first_month_currency: "VARCHAR(8) NULL",
  auto_renew: "TINYINT(1) NOT NULL DEFAULT 0",
};

const productsSql = await readFile(new URL("../db/migrations/002_creator_products.sql", import.meta.url), "utf8");
// Run against exactly one explicitly configured database per invocation.
const targets = [{
  name: process.env.MYSQL_DATABASE || "inflixo_db",
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "inflixo_db",
  port: Number(process.env.MYSQL_PORT) || 3306,
}];

async function connectWithRetry(config, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password || "",
        database: config.database,
        port: config.port || 3306,
        connectTimeout: 45000,
        multipleStatements: false,
      });
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⏳ [${config.database}] Connection attempt ${attempt} failed (${err.message}). Retrying in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function migrateDatabase(target) {
  if (!target.host || !target.user || !target.database) {
    throw new Error(`Incomplete connection settings for ${target.name}: MYSQL_HOST and MYSQL_USER are required.`);
  }

  console.log(`\n📦 Migrating database: ${target.name} [${target.database}@${target.host}]...`);
  const connection = await connectWithRetry(target);

  try {
    const [columns] = await connection.query("SHOW COLUMNS FROM subscriptions");
    const existing = new Set(columns.map((column) => column.Field));
    for (const [name, definition] of Object.entries(subscriptionColumns)) {
      if (!existing.has(name)) {
        await connection.query(`ALTER TABLE subscriptions ADD COLUMN \`${name}\` ${definition}`);
      }
    }

    const [indexes] = await connection.query("SHOW INDEX FROM subscriptions WHERE Key_name = 'uq_subscription_razorpay'");
    if (!indexes.length) {
      await connection.query("ALTER TABLE subscriptions ADD UNIQUE KEY uq_subscription_razorpay (razorpay_subscription_id)");
    }

    await connection.query(`UPDATE subscriptions
      SET trial_started_at = COALESCE(trial_started_at, activated_at, created_at),
          trial_ends_at = COALESCE(trial_ends_at, DATE_ADD(COALESCE(activated_at, created_at), INTERVAL 7 DAY)),
          current_period_started_at = COALESCE(current_period_started_at, activated_at, created_at),
          current_period_ends_at = COALESCE(current_period_ends_at, DATE_ADD(COALESCE(activated_at, created_at), INTERVAL 7 DAY)),
          ends_at = COALESCE(ends_at, DATE_ADD(COALESCE(activated_at, created_at), INTERVAL 7 DAY)),
          status = IF(DATE_ADD(COALESCE(activated_at, created_at), INTERVAL 7 DAY) < NOW(), 'expired', 'trial'),
          payment_mode = 'free_trial', auto_renew = 0
      WHERE plan_key = 'early_access' AND trial_started_at IS NULL`);

    await connection.query(`CREATE TABLE IF NOT EXISTS payment_checkout_intents (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS payment_webhook_events (
      event_id VARCHAR(128) PRIMARY KEY,
      event_type VARCHAR(100) NOT NULL,
      payload_hash CHAR(64) NOT NULL,
      status ENUM('processing', 'processed', 'failed') NOT NULL DEFAULT 'processing',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME NULL,
      error_message VARCHAR(500) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS api_rate_limits (
      key_hash CHAR(64) PRIMARY KEY,
      window_started_at DATETIME NOT NULL,
      attempts INT NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(productsSql);

    async function addColumnIfMissing(table, colName, colDef) {
      const [cols] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
      const existingCols = new Set(cols.map((c) => c.Field));
      if (!existingCols.has(colName)) {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` ${colDef}`);
      }
    }

    await addColumnIfMissing("creators", "public_profile_layout", "VARCHAR(32) NOT NULL DEFAULT 'default'");
    await addColumnIfMissing("creator_settings", "public_profile_layout", "VARCHAR(32) NOT NULL DEFAULT 'default'");

    await addColumnIfMissing("creators", "custom_domain", "VARCHAR(255) NULL UNIQUE");
    await addColumnIfMissing("creators", "custom_domain_verified", "TINYINT(1) NOT NULL DEFAULT 0");
    await addColumnIfMissing("creators", "custom_domain_configured_at", "DATETIME NULL");

    await addColumnIfMissing("creator_custom_links", "icon_url", "VARCHAR(1000) DEFAULT NULL");
    await addColumnIfMissing("creator_custom_links", "is_pinned", "TINYINT(1) NOT NULL DEFAULT 0");

    await addColumnIfMissing("creator_products", "note", "VARCHAR(120) DEFAULT NULL");
    await addColumnIfMissing("creator_products", "is_affiliate", "TINYINT(1) NOT NULL DEFAULT 1");
    await addColumnIfMissing("creator_products", "deleted_at", "TIMESTAMP NULL DEFAULT NULL");
    const [productIndexes] = await connection.query("SHOW INDEX FROM creator_products WHERE Key_name = 'idx_creator_products_active'");
    if (!productIndexes.length) {
      await connection.query("ALTER TABLE creator_products ADD INDEX idx_creator_products_active (creator_id, deleted_at)");
    }

    // 006: default theme. Only fills empty keys; chosen themes are kept (unknown keys fall back at runtime).
    await connection.query("UPDATE creators SET theme_key = 'inflixo-maroon' WHERE theme_key IS NULL OR theme_key = ''");
    await connection.query("ALTER TABLE creators ALTER COLUMN theme_key SET DEFAULT 'inflixo-maroon'");
    const [settingsTables] = await connection.query("SHOW TABLES LIKE 'creator_settings'");
    if (settingsTables.length) {
      await connection.query("UPDATE creator_settings SET theme_key = 'inflixo-maroon' WHERE theme_key IS NULL OR theme_key = ''");
      await connection.query("ALTER TABLE creator_settings ALTER COLUMN theme_key SET DEFAULT 'inflixo-maroon'");
    }

    // Ensure otps and creator_onboarding_steps tables exist
    await connection.query(`CREATE TABLE IF NOT EXISTS otps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      is_used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_otp (email, otp_code, is_used)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS creator_onboarding_steps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      creator_id VARCHAR(64) DEFAULT NULL,
      step_name ENUM('otp_verified', 'profile', 'socials', 'theme', 'series', 'subscription', 'finish') NOT NULL,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email_step (email, is_completed)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await addColumnIfMissing("creators", "city", "VARCHAR(100) DEFAULT NULL");
    await addColumnIfMissing("creators", "state", "VARCHAR(100) DEFAULT NULL");
    await addColumnIfMissing("creators", "country", "VARCHAR(100) DEFAULT NULL");
    await addColumnIfMissing("creators", "profession", "VARCHAR(100) DEFAULT NULL");

    // Ensure analytics_events table and all columns exist before updating
    await connection.query(`CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      creator_id VARCHAR(64) NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_creator_created (creator_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await addColumnIfMissing("analytics_events", "event_id", "VARCHAR(128) DEFAULT NULL");
    await addColumnIfMissing("analytics_events", "event_target", "VARCHAR(255) DEFAULT NULL");
    await addColumnIfMissing("analytics_events", "visitor_id", "VARCHAR(128) DEFAULT NULL");
    await addColumnIfMissing("analytics_events", "source", "VARCHAR(50) DEFAULT NULL");
    await addColumnIfMissing("analytics_events", "user_agent", "TEXT DEFAULT NULL");
    await addColumnIfMissing("analytics_events", "ip_address", "VARCHAR(45) DEFAULT NULL");
    await addColumnIfMissing("analytics_events", "metadata", "JSON DEFAULT NULL");

    const [analyticsEventIdIndex] = await connection.query("SHOW INDEX FROM analytics_events WHERE Key_name = 'unique_analytics_event_id'");
    if (!analyticsEventIdIndex.length) {
      await connection.query("ALTER TABLE analytics_events ADD UNIQUE KEY unique_analytics_event_id (event_id)");
    }

    // 007: analytics event types (db/migrations/007_analytics_event_types.sql).
    await connection.query("UPDATE analytics_events SET event_type = 'series_open' WHERE event_type = 'series_view'");
    await connection.query("UPDATE analytics_events SET event_type = 'collab_request_submit', event_target = NULL WHERE event_type = 'collaboration_submit'");
    await connection.query("DELETE FROM analytics_events WHERE event_type IN ('social_click', 'work_with_me_click', 'collaboration_click', 'service_view', 'service_click', 'brand_click', 'team_social_click')");
    const [analyticsIndexes] = await connection.query("SHOW INDEX FROM analytics_events WHERE Key_name = 'idx_creator_analytics'");
    if (!analyticsIndexes.length) {
      await connection.query("ALTER TABLE analytics_events ADD INDEX idx_creator_analytics (creator_id, event_type, created_at)");
    }

    // 008: creator era peak fanbase (db/migrations/008_creator_era_peak.sql).
    await addColumnIfMissing("creators", "peak_fanbase", "INT UNSIGNED NULL DEFAULT NULL");
    await addColumnIfMissing("creators", "era_unlocked_pending", "TINYINT(1) NOT NULL DEFAULT 0");

    // 009: multi social accounts per platform (db/migrations/009_social_accounts_multi.sql).
    const [socialTables] = await connection.query("SHOW TABLES LIKE 'social_accounts'");
    if (socialTables.length) {
      await addColumnIfMissing("social_accounts", "is_primary", "TINYINT(1) NOT NULL DEFAULT 0");

      await connection.query(`UPDATE social_accounts sa
        JOIN (
          SELECT creator_id, platform, MIN(id) AS min_id
          FROM social_accounts
          GROUP BY creator_id, platform
        ) first_acc ON sa.id = first_acc.min_id
        SET sa.is_primary = 1
        WHERE sa.is_primary = 0`);

      const [oldUnique] = await connection.query("SHOW INDEX FROM social_accounts WHERE Key_name = 'unique_creator_platform'");
      if (oldUnique.length) {
        await connection.query("ALTER TABLE social_accounts DROP INDEX unique_creator_platform");
      }

      const [newUnique] = await connection.query("SHOW INDEX FROM social_accounts WHERE Key_name = 'unique_creator_platform_username'");
      if (!newUnique.length) {
        await connection.query("ALTER TABLE social_accounts ADD UNIQUE KEY unique_creator_platform_username (creator_id, platform, username)");
      }
    }

    // 010: remove CDN picture URLs from stored records (db/migrations/010_remove_cdn_picture_urls.sql).
    await connection.query(`UPDATE creators 
      SET photo_url = NULL 
      WHERE photo_url LIKE '%cdn%instagram%' OR photo_url LIKE '%fbcdn.net%'`);

    await connection.query(`UPDATE subscriptions
      SET trial_ends_at = NULL
      WHERE plan_key IN ('starter', 'pro', 'vip', 'creator_pro', 'creator_VIP')
        AND status = 'active'
        AND trial_ends_at IS NOT NULL`);

    // 011: creator legal acceptances (db/migrations/011_creator_legal_acceptances.sql).
    await connection.query(`CREATE TABLE IF NOT EXISTS creator_legal_acceptances (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      creator_id VARCHAR(64) NOT NULL,
      document_key VARCHAR(32) NOT NULL,
      document_version VARCHAR(32) NOT NULL,
      source VARCHAR(32) NOT NULL DEFAULT 'registration',
      accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_creator_document_version (creator_id, document_key, document_version),
      INDEX idx_creator_legal (creator_id, document_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 012: profile reports (db/migrations/012_profile_reports.sql).
    await connection.query(`CREATE TABLE IF NOT EXISTS profile_reports (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    console.log(`✅ ${target.name} migrated successfully.`);
  } finally {
    await connection.end();
  }
}

for (const target of targets) {
  await migrateDatabase(target);
}

console.log("\n🎉 Configured database migration completed successfully.");
