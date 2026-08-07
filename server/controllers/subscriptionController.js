const db = require("../config/db");

const INFLIXO_PLANS = {
  starter: { name: "Starter Plan", seriesLimit: 5, refreshHours: 24, removeBranding: false, support: "Standard" },
  growth: { name: "Growth Plan", seriesLimit: 10, refreshHours: 18, removeBranding: true, support: "Standard" },
  pro: { name: "Pro Plan", seriesLimit: 20, refreshHours: 12, removeBranding: true, support: "Priority" },
  unlimited: { name: "Unlimited Plan", seriesLimit: 9999, refreshHours: 3, removeBranding: true, support: "Priority" },
};

// GET /api/subscription?creatorId=...
exports.getSubscription = async (req, res) => {
  try {
    const creatorId = req.query.creatorId;
    if (!creatorId) {
      return res.status(400).json({ error: "creatorId is required" });
    }

    const [rows] = await db.query("SELECT * FROM subscriptions WHERE creator_id = ?", [creatorId]);
    const sub = rows[0] || { plan_key: "pro", plan_name: "Pro Plan", billing_cycle: "yearly", status: "trial" };
    const planMeta = INFLIXO_PLANS[sub.plan_key] || INFLIXO_PLANS.pro;

    return res.json({
      success: true,
      subscription: {
        planKey: sub.plan_key,
        planName: sub.plan_name,
        billingCycle: sub.billing_cycle,
        status: sub.status,
        trialEndsAt: sub.trial_ends_at,
        activatedAt: sub.activated_at,
        limits: planMeta,
      },
    });
  } catch (error) {
    console.error("Get Subscription Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch subscription" });
  }
};

// POST /api/subscription/activate
exports.activatePlan = async (req, res) => {
  try {
    const { creatorId, planKey, billingCycle } = req.body;

    if (!creatorId || !planKey) {
      return res.status(400).json({ error: "creatorId and planKey are required" });
    }

    const planMeta = INFLIXO_PLANS[planKey] || INFLIXO_PLANS.pro;

    await db.query(
      `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, activated_at)
       VALUES (?, ?, ?, ?, 'active', NOW())
       ON DUPLICATE KEY UPDATE 
        plan_key = VALUES(plan_key),
        plan_name = VALUES(plan_name),
        billing_cycle = VALUES(billing_cycle),
        status = 'active',
        activated_at = NOW()`,
      [creatorId, planKey, planMeta.name, billingCycle || "yearly"]
    );

    const [updated] = await db.query("SELECT * FROM subscriptions WHERE creator_id = ?", [creatorId]);
    return res.json({ success: true, message: `${planMeta.name} activated successfully`, subscription: updated[0] });
  } catch (error) {
    console.error("Activate Plan Error:", error);
    return res.status(500).json({ error: error.message || "Failed to activate subscription" });
  }
};
