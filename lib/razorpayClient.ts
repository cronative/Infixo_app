"use client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface CheckoutOptions {
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  planKey?: string;
  billingCycle?: "monthly" | "yearly";
  isSubscription?: boolean; // When true (default for plans), uses Razorpay Subscriptions (e-mandate AutoPay)
  onSuccess?: (verifyData: {
    order_id?: string | null;
    subscription_id?: string | null;
    payment_id: string;
    signature: string;
    is_recurring?: boolean;
  }) => void;
  onError?: (error: { code?: string; description?: string; step?: string }) => void;
  onDismiss?: () => void;
}

let scriptLoadingPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout SDK script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export async function openRazorpayCheckout(options: CheckoutOptions): Promise<void> {
  const isScriptLoaded = await loadRazorpayScript();
  if (!isScriptLoaded || !window.Razorpay) {
    const err = { description: "Unable to load Razorpay SDK. Please check your internet connection." };
    options.onError?.(err);
    throw new Error(err.description);
  }

  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key) {
    const err = { description: "Razorpay Public Key ID is missing in client configuration." };
    options.onError?.(err);
    throw new Error(err.description);
  }

  // By default, if planKey is specified and isSubscription is not explicitly false, use recurring subscriptions
  const useSubscription = options.isSubscription !== false && Boolean(options.planKey);

  let subscriptionId: string | null = null;
  let orderData: { order_id: string; amount: number; currency: string } | null = null;

  try {
    if (useSubscription) {
      // 1A. Create recurring subscription on Razorpay
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: options.planKey,
          billingCycle: options.billingCycle || "monthly",
          email: options.prefill?.email || "",
          notes: options.notes || {},
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create subscription on server");
      }
      subscriptionId = data.subscription_id;
    } else {
      // 1B. Create one-time order
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: options.planKey,
          billingCycle: options.billingCycle || "monthly",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order on server");
      }
      orderData = data;
    }
  } catch (err: any) {
    console.error("Order/Subscription creation failed:", err);
    options.onError?.({ description: err.message || "Failed to initiate payment" });
    throw err;
  }

  // 2. Open Razorpay Checkout Modal
  return new Promise((resolve, reject) => {
    const rzpOptions: any = {
      key,
      name: options.name || "Inflixo",
      description: options.description || `${options.planKey?.toUpperCase() || ""} Auto-Renewing Subscription`,
      image: options.image || "/icon.svg",
      prefill: {
        name: options.prefill?.name || "",
        email: options.prefill?.email || "",
        contact: options.prefill?.contact || "",
      },
      theme: {
        color: "#043084",
      },
      modal: {
        ondismiss: () => {
          options.onDismiss?.();
          resolve();
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_subscription_id?: string;
        razorpay_signature: string;
      }) => {
        try {
          // 3. Verify signature on backend
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || orderData?.order_id,
              razorpay_subscription_id: response.razorpay_subscription_id || subscriptionId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyResult = await verifyRes.json();
          if (!verifyRes.ok || !verifyResult.success) {
            throw new Error(verifyResult.error || "Payment signature verification failed");
          }

          options.onSuccess?.({
            order_id: verifyResult.order_id,
            subscription_id: verifyResult.subscription_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            is_recurring: verifyResult.is_recurring,
          });
          resolve();
        } catch (verifyErr: any) {
          console.error("Signature verification error:", verifyErr);
          options.onError?.({
            description: verifyErr.message || "Payment verification failed",
          });
          reject(verifyErr);
        }
      },
    };

    if (useSubscription && subscriptionId) {
      rzpOptions.subscription_id = subscriptionId;
    } else if (orderData) {
      rzpOptions.order_id = orderData.order_id;
      rzpOptions.amount = orderData.amount;
      rzpOptions.currency = orderData.currency;
    }

    const rzp = new window.Razorpay(rzpOptions);

    rzp.on("payment.failed", (response: any) => {
      console.error("Payment failed:", response.error);
      options.onError?.({
        code: response.error?.code,
        description: response.error?.description || "Payment failed",
        step: response.error?.step,
      });
    });

    rzp.open();
  });
}
