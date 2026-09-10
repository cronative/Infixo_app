import mysql from "mysql2/promise";

const globalForDb = global as unknown as { pool: mysql.Pool };

const pool =
  globalForDb.pool ||
  mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "inflixo_db",
    port: Number(process.env.MYSQL_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 15000,
    timezone: process.env.MYSQL_TIMEZONE || "+05:30",
  });

// Automatically set MySQL session timezone to IST (+05:30) on each connection
pool.on("connection", (connection: any) => {
  connection.query("SET time_zone = '+05:30'");
});

export const db = pool;

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = db;
}
