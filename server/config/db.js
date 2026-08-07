const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "inflixo_db",
  port: Number(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

// Test connection
pool.getConnection()
  .then((conn) => {
    console.log(`✅ MySQL Database connected successfully to ${process.env.MYSQL_HOST || "localhost"}:${process.env.MYSQL_PORT || 3306} (${process.env.MYSQL_DATABASE || "inflixo_db"})`);
    conn.release();
  })
  .catch((err) => {
    console.error(`❌ MySQL VPS Connection Failed (${process.env.MYSQL_HOST || "localhost"}):`, err.message);
    console.error("👉 Tip for VPS MySQL: Ensure your VPS MySQL user allows remote connections ('user'@'%') and port 3306 is open in your VPS firewall.");
  });

module.exports = pool;
