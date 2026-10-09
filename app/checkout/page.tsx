"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, CreditCard, Sparkles, RefreshCw, Repeat, Zap, ArrowRight, ExternalLink } from "lucide-react";
import { RazorpayCheckoutButton } from "@/components/checkout/RazorpayCheckoutButton";
import { ProfileService } from "@/services/ProfileService";
import { SubscriptionService } from "@/services/SubscriptionService";
import { OnboardingService } from "@/services/OnboardingService";
import { authRepository, profileRepository } from "@/repositories/localRepository";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planParam = searchParams.get("plan");
  const cycleParam = searchParams.get("cycle");
  const modeParam = searchParams.get("mode");
  const fromParam = searchParams.get("from");

  const [customerName, setCustomerName] = useState("Test Creator");
  const [customerEmail, setCustomerEmail] = useState("creator@inflixo.com");
  const [customerPhone, setCustomerPhone] = useState("9999999999");
  const [username, setUsername] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<"recurring" | "onetime">(
    modeParam === "onetime" ? "onetime" : "recurring"
  );

  const initialPlan =
    planParam === "pro" || planParam === "creator_pro"
      ? "pro"
      : planParam === "vip" || planParam === "creator_VIP"
      ? "vip"
      : planParam === "custom"
      ? "custom"
      : "starter";

  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "vip" | "custom">(initialPlan);
  const [customAmountRupees, setCustomAmountRupees] = useState<number>(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    cycleParam === "yearly" ? "yearly" : "monthly"
  );
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error" | "cancelled">("idle");
  const [lastPaymentResult, setLastPaymentResult] = useState<{
    order_id?: string | null;
    subscription_id?: string | null;
    payment_id?: string;
    signature?: string;
    is_recurring?: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const p = ProfileService.getProfile();
      const cached = profileRepository.get();
      const email = p?.email || cached?.email || authRepository.getPendingEmail() || authRepository.get()?.email;
      if (p?.displayName || cached?.displayName) {
        setCustomerName(p?.displayName || cached?.displayName || "Creator");
      }
      if (email) {
        setCustomerEmail(email);
      }
      if (p?.username || cached?.username) {
        setUsername(p?.username || cached?.username || "");
      }
    } catch {
      // Ignore during static render
    }
  }, []);

  const planAmounts: Record<string, { name: string; monthly: number; yearly: number }> = {
    starter: { name: "Starter Plan", monthly: 99, yearly: 999 },
    pro: { name: "Pro Plan", monthly: 199, yearly: 1999 },
    vip: { name: "VIP Plan", monthly: 399, yearly: 3999 },
    custom: { name: "Custom Test Amount", monthly: customAmountRupees, yearly: customAmountRupees },
  };

  const currentPlan = planAmounts[selectedPlan];
  const amountRupees =
    selectedPlan === "custom"
      ? Math.max(1, customAmountRupees)
      : billingCycle === "yearly"
      ? currentPlan.yearly
      : currentPlan.monthly;
  const amountPaise = Math.round(amountRupees * 100);

  const isRecurringActive = checkoutMode === "recurring" && selectedPlan !== "custom";

  const activeKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const isLiveMode = activeKeyId.startsWith("rzp_live");

  return (
    <div className="min-h-screen bg-white text-[#181716] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] hover:text-[#7A2253] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isLiveMode ? "bg-emerald-500/10 text-emerald-700" : "bg-[#7A2253]/10 text-[#7A2253]"
          }`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Razorpay {isRecurringActive ? "Recurring Subscriptions (AutoPay)" : "Standard Checkout"} ({isLiveMode ? "Live Mode" : "Test Mode"})
          </div>
        </div>

        {/* Header */}
        <div className="text-left space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#7A2253]">
            Complete Your Subscription
          </h1>
          <p className="text-sm text-[#64748b]">
            Secure checkout powered by Razorpay with automatic recurring renewals or one-time payment.
          </p>
        </div>

        {/* Checkout Mode Toggle */}
        <div className="rounded-2xl border border-[#E4DAD5] bg-white p-4 shadow-xs text-left">
          <label className="text-xs font-bold uppercase tracking-wider text-[#64748b] block mb-2">
            Payment Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setCheckoutMode("recurring");
                setPaymentStatus("idle");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                checkoutMode === "recurring"
                  ? "border-[#7A2253] bg-[#7A2253]/[0.06] ring-1 ring-[#7A2253]"
                  : "border-[#E4DAD5] bg-[#fbfbfb] hover:bg-white"
              }`}
            >
              <Repeat className={`h-5 w-5 shrink-0 mt-0.5 ${checkoutMode === "recurring" ? "text-[#7A2253]" : "text-[#64748b]"}`} />
              <div>
                <div className="text-xs font-bold text-[#181716] flex items-center gap-1.5">
                  <span>Recurring Auto-Debit (AutoPay)</span>
                  <span className="text-[10px] bg-[#17845B]/10 text-[#17845B] px-1.5 py-0.2 rounded font-semibold">Recommended</span>
                </div>
                <div className="text-[11px] text-[#64748b] mt-0.5">
                  Uses Razorpay Subscriptions API (<code className="text-[10px]">subscription_id</code>) for automated monthly/yearly renewals.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckoutMode("onetime");
                setPaymentStatus("idle");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                checkoutMode === "onetime"
                  ? "border-[#7A2253] bg-[#7A2253]/[0.06] ring-1 ring-[#7A2253]"
                  : "border-[#E4DAD5] bg-[#fbfbfb] hover:bg-white"
              }`}
            >
              <Zap className={`h-5 w-5 shrink-0 mt-0.5 ${checkoutMode === "onetime" ? "text-[#7A2253]" : "text-[#64748b]"}`} />
              <div>
                <div className="text-xs font-bold text-[#181716]">One-Time Order</div>
                <div className="text-[11px] text-[#64748b] mt-0.5">
                  Uses Razorpay Standard Orders API (<code className="text-[10px]">order_id</code>) for single non-recurring charge.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left / Selection Column */}
          <div className="md:col-span-2 space-y-5 rounded-2xl border border-[#E4DAD5] bg-white p-6 shadow-xs text-left">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#64748b] block mb-2">
                1. Select Plan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(["starter", "pro", "vip", "custom"] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setPaymentStatus("idle");
                    }}
                    className={`rounded-xl p-3 border text-left transition-all cursor-pointer ${
                      selectedPlan === plan
                        ? "border-[#7A2253] bg-[#7A2253]/[0.05] ring-1 ring-[#7A2253]"
                        : "border-[#E4DAD5] bg-[#fbfbfb] hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold capitalize text-[#181716]">{plan}</div>
                    <div className="text-xs font-semibold text-[#7A2253] mt-1">
                      {plan === "custom" ? "Custom" : `₹${planAmounts[plan].monthly}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedPlan === "custom" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#475569]">
                  Enter test amount in Rupees (minimum ₹1):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-[#64748b]">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={customAmountRupees}
                    onChange={(e) => setCustomAmountRupees(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-[#E4DAD5] pl-8 pr-4 py-2 text-sm font-semibold text-[#181716] focus:outline-none focus:border-[#7A2253]"
                  />
                </div>
                <p className="text-[11px] text-[#64748b]">
                  {amountPaise} paise will be sent to the API.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-medium text-[#64748b]">Billing Period:</span>
                <div className="inline-flex rounded-lg border border-[#E4DAD5] p-0.5 bg-[#fbfbfb]">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      billingCycle === "monthly" ? "bg-white text-[#181716] shadow-xs" : "text-[#64748b]"
                    }`}
                  >
                    Monthly (₹{currentPlan.monthly}/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      billingCycle === "yearly" ? "bg-[linear-gradient(90deg,#7A2253_0%,#B0437A_100%)] text-white shadow-xs" : "text-[#64748b]"
                    }`}
                  >
                    Yearly (₹{currentPlan.yearly}/yr)
                  </button>
                </div>
              </div>
            )}

            {/* Credentials Info Box */}
            <div className={`rounded-xl border p-3.5 space-y-1 text-xs ${
              isLiveMode ? "border-emerald-200 bg-emerald-50/50" : "border-[#e2e8f0] bg-[#f8fafc]"
            }`}>
              <div className={`flex items-center gap-1.5 font-bold ${
                isLiveMode ? "text-emerald-800" : "text-[#7A2253]"
              }`}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isLiveMode ? "Live Production Gateway Active" : "Test Mode Active"}</span>
              </div>
              <p className="text-[11px] text-[#64748b]">
                Key ID: <code className="bg-[#e2e8f0] px-1 py-0.5 rounded text-[10px]">{activeKeyId || "Not configured"}</code>
              </p>
              <p className="text-[11px] text-[#64748b]">
                {isLiveMode
                  ? "Real cards, UPI, net banking and auto-debit mandates will be processed."
                  : "Recurring subscriptions trigger Razorpay e-mandate registration for automated debit on renewal."}
              </p>
            </div>

            {/* Payment Results */}
            {paymentStatus === "success" && lastPaymentResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Payment Verified Successfully!
                </div>
                <div className="space-y-1 font-mono text-[11px] bg-white/70 p-2.5 rounded-lg border border-emerald-100 break-all">
                  {lastPaymentResult.subscription_id && (
                    <p><strong>Subscription ID:</strong> {lastPaymentResult.subscription_id}</p>
                  )}
                  {lastPaymentResult.order_id && (
                    <p><strong>Order ID:</strong> {lastPaymentResult.order_id}</p>
                  )}
                  <p><strong>Payment ID:</strong> {lastPaymentResult.payment_id}</p>
                  <p><strong>Mode:</strong> {lastPaymentResult.is_recurring ? "Recurring AutoPay" : "One-Time"}</p>
                  <p><strong>Signature:</strong> {lastPaymentResult.signature}</p>
                </div>
              </div>
            )}

            {paymentStatus === "error" && lastPaymentResult && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-1 text-xs text-rose-900">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  Payment Failed or Error Occurred
                </div>
                <p className="text-[11px] text-rose-700">{lastPaymentResult.error || "An error occurred."}</p>
              </div>
            )}

            {paymentStatus === "cancelled" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                <span>Payment modal was dismissed by user.</span>
              </div>
            )}
          </div>

          {/* Right / Order Summary & Checkout Action */}
          <div className="space-y-5 rounded-2xl border border-[#E4DAD5] bg-white p-6 shadow-xs text-left flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-[#181716]">
                Subscription Summary
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-[#64748b]">
                  <span>Plan</span>
                  <span className="font-medium text-[#181716]">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Cycle</span>
                  <span className="font-medium text-[#181716] capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Renewal</span>
                  <span className="font-medium text-[#17845B] font-semibold">
                    {isRecurringActive ? "Automatic Auto-Debit" : "Manual Renewal"}
                  </span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Currency</span>
                  <span className="font-medium text-[#181716]">INR (₹)</span>
                </div>
                <div className="pt-2.5 border-t border-[#E4DAD5] flex justify-between text-sm font-bold text-[#181716]">
                  <span>Amount Due</span>
                  <span className="text-[#7A2253] font-display text-lg">₹{amountRupees}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#E4DAD5]">
              <RazorpayCheckoutButton
                amount={amountPaise}
                currency="INR"
                name="Inflixo"
                description={`Inflixo ${currentPlan.name} (${billingCycle})`}
                planKey={selectedPlan}
                billingCycle={billingCycle}
                isSubscription={isRecurringActive}
                prefill={{
                  name: customerName,
                  email: customerEmail,
                  contact: customerPhone,
                }}
                onSuccess={async (data) => {
                  setPaymentStatus("success");
                  setLastPaymentResult(data);
                  try {
                    const targetKey =
                      selectedPlan === "pro"
                        ? "creator_pro"
                        : selectedPlan === "vip"
                        ? "creator_VIP"
                        : "starter";
                    await SubscriptionService.activate(targetKey, billingCycle, customerEmail);
                    if (fromParam === "onboarding") {
                      OnboardingService.setStep("finish");
                    }
                  } catch (e) {
                    console.error("Local activation error:", e);
                  }
                }}
                onError={(err) => {
                  setPaymentStatus("error");
                  setLastPaymentResult({ error: err.description || "Checkout failed" });
                }}
                onDismiss={() => {
                  setPaymentStatus("cancelled");
                }}
              />
              <p className="text-[10px] text-center text-[#64748b] flex items-center justify-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span>HMAC-SHA256 verified server-side</span>
              </p>
            </div>

            {paymentStatus === "success" && (
              <div className="pt-3 border-t border-emerald-100 flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-3 transition-colors text-center shadow-xs"
                >
                  <span>Go to Creator Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {username && (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs py-2 px-3 transition-colors text-center"
                  >
                    <span>View Public Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#7A2253]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
            <span>Loading secure checkout...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
