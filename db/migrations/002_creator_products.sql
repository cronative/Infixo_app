-- Additive Products V1 migration. Prices are nullable integer paise (INR).
CREATE TABLE IF NOT EXISTS creator_products (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  creator_id VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  image_url TEXT NOT NULL,
  price_paise INT DEFAULT NULL,
  product_url VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_creator_products (creator_id, created_at, id),
  CONSTRAINT fk_products_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
