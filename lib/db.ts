import mysql from "mysql2/promise";

const globalForDb = global as unknown as { pool: mysql.Pool };

// One time zone for both the mysql2 driver and the MySQL session, so DATETIME/TIMESTAMP values are never
// shifted (a mismatch made fresh reviews look like they were written in the future).
const DB_TIMEZONE = process.env.MYSQL_TIMEZONE || "+05:30";
const SESSION_TIMEZONE = DB_TIMEZONE === "Z" || DB_TIMEZONE === "local" ? "+00:00" : DB_TIMEZONE;

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
    idleTimeout: 60000, // Close idle connections after 60 seconds
    timezone: DB_TIMEZONE === "local" ? "Z" : DB_TIMEZONE,
  });

pool.on("connection", (connection: any) => {
  connection.query("SET time_zone = ?", [SESSION_TIMEZONE]);
});

export const db = pool;

// Preserve pool singleton across module re-evaluations
globalForDb.pool = db;
