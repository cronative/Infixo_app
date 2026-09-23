import "dotenv/config";
import mysql from "mysql2/promise";

const required = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_DATABASE"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing database configuration: ${missing.join(", ")}`);

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 3306,
  connectTimeout: 30000,
  multipleStatements: false,
});

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

  console.log("Database migrations completed successfully.");
} finally {
  await connection.end();
}
