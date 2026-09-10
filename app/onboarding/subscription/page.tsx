"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles, Zap, Check, ExternalLink } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { SubscriptionService } from "@/services/SubscriptionService";
import { OnboardingService } from "@/services/OnboardingService";
import { useCreator } from "@/contexts/CreatorContext";
import { PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { authRepository } from "@/repositories/localRepository";

export default function SubscriptionStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, socials, series, theme, totalAudience } = useCreator();

  const [selectedOption, setSelectedOption] = useState<"free" | "pro">("free");
  const [submitting, setSubmitting] = useState(false);

  async function handleLaunch() {
    if (submitting) return;
    setSubmitting(true);

    const planKey: PlanKey = selectedOption === "pro" ? "creator_pro" : "early_access";
    const planName = selectedOption === "pro" ? "Creator Pro" : "Early Access";
    const email = authRepository.getPendingEmail() || profile?.email || "";

    try {
      // 1. Activate plan locally
      SubscriptionService.activate(planKey, "monthly");

      // 2. Persist to MySQL database
      if (email) {
        await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            planKey,
            planName,
            billingCycle: "monthly",
          }),
        }).catch((err) => console.warn("Subscription sync warning:", err));
      }

      // 3. Mark onboarding finished
      OnboardingService.setStep("finish");

      if (selectedOption === "pro") {
        showToast("🎉 Creator Pro activated! Welcome to your live profile.");
      } else {
        showToast("🚀 You are LIVE! Welcome to your Inflixo creator page.");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Launch error:", err);
      OnboardingService.setStep("finish");
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout step="subscription">
      <div className="w-full max-w-[540px] mx-auto pt-4 sm:pt-8 pb-12">
        {/* SINGLE UNIFIED WHITE CARD (Matching Step 1, 2, 3 design) */}
        <div className="rounded-[28px] border border-[#E7E3DC] bg-white p-6 sm:p-9 space-y-6 text-left shadow-[0_4px_24px_rgba(0,0,0,0.035)]">

          {/* 1. Header Section */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-[#151933]">
              STEP 4 OF 4 · PUBLIC PROFILE
            </span>
            <h1 className="font-display text-2xl sm:text-[32px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Your profile is ready to go live!
            </h1>
            <p className="text-xs sm:text-[13px] font-normal text-[#54514D] leading-relaxed pt-0.5">
              Review your public creator profile below. Go live for free or choose a plan to launch.
            </p>
          </div>

          {/* 2. Public Profile Preview Box */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#181716] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Public Profile Preview
              </span>
              <span className="text-[11px] font-semibold text-[#151933]">
                inflixo.com/@{profile?.username || "username"}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden shadow-xs border border-[#e2e8f0] bg-white max-h-[360px] overflow-y-auto scrollbar-thin">
              <LivePreviewCard
                profile={profile}
                socials={socials}
                series={series}
                totalAudience={totalAudience}
                themeKey={theme}
                variant="compact"
                isInformational={true}
              />
            </div>
          </div>

          {/* 3. Launch Options (Go Live Free or Purchase Plan - without details of plan) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Choose Launch Option
            </label>

            {/* Option A: Go Live Free */}
            <div
              onClick={() => setSelectedOption("free")}
              className={`rounded-2xl border p-4 flex items-center justify-between transition-all cursor-pointer ${selectedOption === "free"
                  ? "border-2 border-[#151933] bg-[#f8fafc] shadow-2xs"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${selectedOption === "free"
                      ? "border-[#151933] bg-[#151933] text-white"
                      : "border-[#cbd5e1] bg-white"
                    }`}
                >
                  {selectedOption === "free" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#181716]">
                      Go Live (Free)
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.2 rounded-full">
                      FREE FOREVER
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Launch public profile with combined fanbase reach
                  </p>
                </div>
              </div>
              <span className="text-base font-extrabold text-[#181716] shrink-0">
                ₹0
              </span>
            </div>

            {/* Option B: Purchase Creator Pro */}
            <div
              onClick={() => setSelectedOption("pro")}
              className={`rounded-2xl border p-4 flex items-center justify-between transition-all cursor-pointer ${selectedOption === "pro"
                  ? "border-2 border-[#151933] bg-[#f8fafc] shadow-2xs"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${selectedOption === "pro"
                      ? "border-[#151933] bg-[#151933] text-white"
                      : "border-[#cbd5e1] bg-white"
                    }`}
                >
                  {selectedOption === "pro" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#181716]">
                      Purchase Creator Pro
                    </span>
                    <span className="bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/20 text-[10px] font-bold px-2 py-0.2 rounded-full">
                      PRO PLAN
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Custom domain, watermark removal &amp; fast sync
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-extrabold text-[#181716] block">
                  ₹199
                </span>
                <span className="text-[10px] text-[#64748b] font-medium block">
                  / month
                </span>
              </div>
            </div>
          </div>

          {/* 4. Action Buttons (Back + Go Live / Purchase CTA) */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/onboarding/socials")}
              className="rounded-xl border border-[#cbd5e1] bg-white text-[#181716] font-semibold text-xs sm:text-sm h-12 px-5 hover:bg-[#f8fafc] transition-all cursor-pointer shrink-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#151933] hover:bg-[#2c1b36] text-white font-semibold text-xs sm:text-sm h-12 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Launching Profile...</span>
                </>
              ) : selectedOption === "pro" ? (
                <>
                  <span>Purchase Pro &amp; Go Live</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Go Live for Free</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </OnboardingLayout>
  );
}
