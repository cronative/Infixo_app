"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { openRazorpayCheckout, CheckoutOptions } from "@/lib/razorpayClient";

export interface RazorpayCheckoutButtonProps {
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  planKey?: string;
  billingCycle?: "monthly" | "yearly";
  isSubscription?: boolean; // When true (default for plans), uses Razorpay AutoPay Subscriptions
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  className?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
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

export function RazorpayCheckoutButton({
  amount,
  currency = "INR",
  name = "Inflixo",
  description = "Plan Subscription",
  planKey,
  billingCycle,
  isSubscription = true,
  prefill,
  className,
  buttonText = "Pay Now",
  icon = <CreditCard className="h-4 w-4" />,
  disabled = false,
  onSuccess,
  onError,
  onDismiss,
}: RazorpayCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);

    try {
      const options: CheckoutOptions = {
        amount,
        currency,
        name,
        description: description || `${planKey?.toUpperCase()} Recurring Subscription`,
        planKey,
        billingCycle,
        isSubscription,
        prefill,
        onSuccess: (data) => {
          setIsLoading(false);
          onSuccess?.(data);
        },
        onError: (err) => {
          setIsLoading(false);
          onError?.(err);
        },
        onDismiss: () => {
          setIsLoading(false);
          onDismiss?.();
        },
      };

      await openRazorpayCheckout(options);
    } catch (err) {
      setIsLoading(false);
      // Handled via options.onError
    }
  };

  const defaultClasses =
    "w-full rounded-xl bg-[#043084] hover:bg-[#032360] active:scale-[0.99] text-white py-2.5 px-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <button
      type="button"
      id={`razorpay-checkout-btn-${planKey || "default"}`}
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={className || defaultClasses}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon}
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}
