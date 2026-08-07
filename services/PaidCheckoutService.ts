"use client";

// ---------------------------------------------------------------------------
// Orchestrates the Razorpay payment gate for paid plans (starter/pro/unlimited).
// Free Basic never goes through here — pages should call SubscriptionService
// .activate() directly for the free plan and PaidCheckoutService.start() for
// everything else.
//
// Flow: create-subscription (server creates/reuses Razorpay Plan + Subscription)
//       → Razorpay Checkout modal → verify-subscription (server verifies the
//       payment signature) → local subscription state updated on success.
// ---------------------------------------------------------------------------

import { authRepository, subscriptionRepository } from "@/repositories/localRepository";
import { BillingCycle, PlanKey, Subscription } from "@/types";
import { SubscriptionService } from "@/services/SubscriptionService";
import { RazorpayCheckoutService } from "@/services/RazorpayCheckoutService";

export interface StartPaidCheckoutCallbacks {
  onActivated: (sub: Subscription) => void;
  onError: (message: string) => void;
  onDismiss?: () => void;
}

export const PaidCheckoutService = {
  async start(planKey: PlanKey, billingCycle: BillingCycle, callbacks: StartPaidCheckoutCallbacks) {
    if (planKey === "free") {
      callbacks.onError("Free Basic doesn't need a payment — use SubscriptionService.activate() instead.");
      return;
    }

    const email = authRepository.getPendingEmail();
    if (!email) {
      callbacks.onError("You need to be signed in to start a paid plan.");
      return;
    }

    try {
      const createRes = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planKey, billingCycle }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error || "Could not start Razorpay checkout");
      }

      const currentPlan = SubscriptionService.getPlan(planKey);
      const calculatedAmount = Math.round((billingCycle === "yearly" ? currentPlan.yearlyPrice : currentPlan.monthlyPrice) * 100);

      await RazorpayCheckoutService.open({
        keyId: createData.keyId || "rzp_test_SQis9g0UgsSikN",
        subscriptionId: createData.subscriptionId,
        amountPaise: createData.amountPaise || calculatedAmount,
        planName: createData.planName || currentPlan.name,
        prefillEmail: email,
        onSuccess: async (payload) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, ...payload }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            const plan = SubscriptionService.getPlan(verifyData.planKey);
            const sub: Subscription = {
              planKey: verifyData.planKey,
              planName: `${plan.name} Plan`,
              billingCycle: verifyData.billingCycle as BillingCycle,
              status: verifyData.status,
              activatedAt: new Date().toISOString(),
            };
            subscriptionRepository.save(sub);
            callbacks.onActivated(sub);
          } catch (e: any) {
            callbacks.onError(e.message || "Payment verification failed");
          }
        },
        onFailure: (message) => callbacks.onError(message),
        onDismiss: callbacks.onDismiss,
      });
    } catch (e: any) {
      callbacks.onError(e.message || "Could not start Razorpay checkout");
    }
  },
};
