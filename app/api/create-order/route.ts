import { NextResponse } from "next/server";
import Razorpay from "razorpay";

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

    const { amount, currency = "INR", receipt, notes } = body;

    // Validate amount: must be provided, must be a number, minimum 100 paise (₹1.00)
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        {
          error: "Invalid amount. Minimum amount is 100 paise (₹1.00).",
        },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);

    // Handle authentication failure
    if (error?.statusCode === 401 || (error?.error?.code === "BAD_REQUEST_ERROR" && error?.error?.description?.toLowerCase().includes("key"))) {
      return NextResponse.json(
        { error: "Authentication failed with Razorpay" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error?.error?.description || error?.message || "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
