const express = require("express");
const cors = require("cors");
require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  throw new Error("The legacy Express server is disabled in production. Use the Next.js server.");
}

const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const seriesRoutes = require("./routes/seriesRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { initCronJobs } = require("./cron/autoRefreshCron");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.DEV_APP_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/creator", creatorRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api", paymentRoutes);

// Root & Health Check Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Inflixo API Server",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth/login, /api/auth/verify-otp",
      creator: "/api/creator/profile, /api/creator/socials, /api/creator/public/:username",
      series: "/api/series, /api/series/:seriesId/episodes",
      subscription: "/api/subscription, /api/subscription/activate",
    },
  });
});

// Initialize Cron Jobs
initCronJobs();

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Inflixo Backend API Server running on port http://localhost:${PORT}`);
});
