const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const router = express.Router();

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const RAZORPAY_RECURRING_PLANS = {
  starter_monthly: { name: "Inflixo Starter Monthly", period: "monthly", amountInPaise: 9900, description: "Inflixo Starter plan billed monthly with recurring auto-renewal" },
  starter_yearly: { name: "Inflixo Starter Yearly", period: "yearly", amountInPaise: 99900, description: "Inflixo Starter plan billed yearly with recurring auto-renewal" },
  pro_monthly: { name: "Inflixo Pro Monthly", period: "monthly", amountInPaise: 19900, description: "Inflixo Pro plan billed monthly with recurring auto-renewal" },
  pro_yearly: { name: "Inflixo Pro Yearly", period: "yearly", amountInPaise: 199900, description: "Inflixo Pro plan billed yearly with recurring auto-renewal" },
  vip_monthly: { name: "Inflixo VIP Monthly", period: "monthly", amountInPaise: 39900, description: "Inflixo VIP plan billed monthly with recurring auto-renewal" },
  vip_yearly: { name: "Inflixo VIP Yearly", period: "yearly", amountInPaise: 399900, description: "Inflixo VIP plan billed yearly with recurring auto-renewal" },
};

const planIdCache = new Map();

async function getOrCreatePlan(razorpay, planKey, billingCycle = "monthly") {
  const normalizedKey =
    planKey === "creator_pro" || planKey === "pro"
      ? "pro"
      : planKey === "creator_VIP" || planKey === "vip"
      ? "vip"
      : "starter";

  const configKey = `${normalizedKey}_${billingCycle}`;
  const config = RAZORPAY_RECURRING_PLANS[configKey] || RAZORPAY_RECURRING_PLANS.starter_monthly;

  if (planIdCache.has(configKey)) {
    return planIdCache.get(configKey);
  }

  try {
    const existing = await razorpay.plans.all({ count: 50 });
    const match = existing.items?.find((p) => {
      return (
        p.item?.name === config.name &&
        p.item?.amount === config.amountInPaise &&
        p.period === config.period
      );
    });
    if (match && match.id) {
      planIdCache.set(configKey, match.id);
      return match.id;
    }
  } catch (err) {
    console.warn("Could not list existing plans:", err);
  }

  const created = await razorpay.plans.create({
    period: config.period,
    interval: 1,
    item: {
      name: config.name,
      amount: config.amountInPaise,
      currency: "INR",
      description: config.description,
    },
  });

  planIdCache.set(configKey, created.id);
  return created.id;
}

// POST /api/create-order
router.post("/create-order", async (req, res) => {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay credentials are not configured on the server" });
    }

    const { amount, currency = "INR", receipt, notes } = req.body || {};

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 100) {
      return res.status(400).json({
        error: "Invalid amount. Minimum amount is 100 paise (₹1.00).",
      });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: notes || {},
    });

    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Express Razorpay create-order error:", error);
    if (error?.statusCode === 401 || (error?.error?.code === "BAD_REQUEST_ERROR" && error?.error?.description?.toLowerCase().includes("key"))) {
      return res.status(401).json({ error: "Authentication failed with Razorpay" });
    }
    return res.status(500).json({
      error: error?.error?.description || error?.message || "Failed to create Razorpay order",
    });
  }
});

// POST /api/create-subscription (Recurring Auto-Debit)
router.post("/create-subscription", async (req, res) => {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay credentials are not configured on the server" });
    }

    const { planKey = "starter", billingCycle = "monthly", email, notes = {} } = req.body || {};
    const normalizedCycle = billingCycle === "yearly" ? "yearly" : "monthly";

    const razorpay = new Razorpay({ key_id, key_secret });
    const planId = await getOrCreatePlan(razorpay, planKey, normalizedCycle);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: normalizedCycle === "yearly" ? 10 : 60,
      quantity: 1,
      customer_notify: 1,
      notes: {
        planKey,
        billingCycle: normalizedCycle,
        email: email || "",
        ...notes,
      },
    });

    return res.json({
      subscription_id: subscription.id,
      plan_id: subscription.plan_id,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Express Razorpay create-subscription error:", error);
    return res.status(500).json({
      error: error?.error?.description || error?.message || "Failed to create recurring subscription",
    });
  }
});

// POST /api/verify-payment
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_signature || (!razorpay_order_id && !razorpay_subscription_id)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: razorpay_payment_id, razorpay_signature, and either razorpay_order_id or razorpay_subscription_id are required.",
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        success: false,
        error: "Razorpay credentials are not configured on the server",
      });
    }

    const isRecurring = Boolean(razorpay_subscription_id);
    const payload = isRecurring
      ? `${razorpay_payment_id}|${razorpay_subscription_id}`
      : `${razorpay_order_id}|${razorpay_payment_id}`;

    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(payload)
      .digest("hex");

    const isMatch = safeCompare(generated_signature, razorpay_signature);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature. Verification failed.",
      });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
      is_recurring: isRecurring,
      subscription_id: razorpay_subscription_id || null,
      order_id: razorpay_order_id || null,
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Express Razorpay verify-payment error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error verifying payment",
    });
  }
});

module.exports = router;
