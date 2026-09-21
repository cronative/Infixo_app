import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getOrCreateRazorpayPlan } from "@/lib/razorpayPlans";

export async function POST(req: Request) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("Razorpay Error: Missing API keys in environment variables");
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server" },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { planKey = "starter", billingCycle = "monthly", email, notes = {} } = body;

    const normalizedCycle = billingCycle === "yearly" ? "yearly" : "monthly";

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // 1. Get or create the recurring Plan ID on Razorpay
    const planId = await getOrCreateRazorpayPlan(razorpay, planKey, normalizedCycle);

    // 2. Create the Subscription with recurring auto-debit (total_count = 60 cycles)
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

    return NextResponse.json({
      subscription_id: subscription.id,
      plan_id: subscription.plan_id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error("Razorpay create-subscription error:", error);

    if (
      error?.statusCode === 401 ||
      (error?.error?.code === "BAD_REQUEST_ERROR" &&
        error?.error?.description?.toLowerCase().includes("key"))
    ) {
      return NextResponse.json(
        { error: "Authentication failed with Razorpay" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.error?.description ||
          error?.message ||
          "Failed to create Razorpay recurring subscription",
      },
      { status: 500 }
    );
  }
}
