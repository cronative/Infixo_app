"use client";

// ---------------------------------------------------------------------------
// Client-side Razorpay Checkout loader. Injects checkout.js on first use and
// opens the payment modal for a subscription created by
// /api/razorpay/create-subscription. Never holds the Key Secret — only the
// public Key ID, which is safe in the browser.
// ---------------------------------------------------------------------------

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptLoadPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout can only be opened in the browser"));
  }
  if ((window as any).Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Razorpay Checkout script"));
    };
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface OpenRazorpayCheckoutParams {
  keyId: string;
  subscriptionId?: string;
  amountPaise?: number;
  planName: string;
  prefillEmail?: string;
  onSuccess: (payload: RazorpayPaymentSuccess) => void;
  onFailure?: (description: string) => void;
  onDismiss?: () => void;
}

export const RazorpayCheckoutService = {
  async open(params: OpenRazorpayCheckoutParams) {
    await loadCheckoutScript();

    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      throw new Error("Razorpay Checkout script did not load");
    }

    const options: any = {
      key: params.keyId || "rzp_test_SQis9g0UgsSikN",
      name: "Inflixo",
      description: `${params.planName} Plan`,
      prefill: params.prefillEmail ? { email: params.prefillEmail } : undefined,
      theme: { color: "#6d28d9" },
      handler: (response: RazorpayPaymentSuccess) => {
        params.onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          params.onDismiss?.();
        },
      },
    };

    if (params.subscriptionId && !params.subscriptionId.startsWith("sub_test_")) {
      options.subscription_id = params.subscriptionId;
    } else {
      options.amount = params.amountPaise || 9900;
      options.currency = "INR";
    }

    const rzp = new RazorpayCtor(options);

    rzp.on("payment.failed", (response: any) => {
      params.onFailure?.(response?.error?.description || "Payment failed. Please try again.");
    });

    rzp.open();
  },
};
