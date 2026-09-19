"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { useCreator } from "@/contexts/CreatorContext";
import { slugifyUsername } from "@/utils/format";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";
import { debugLog, debugError } from "@/lib/debugLogger";

const SMART_PREFIXES = ["the", "official", "real", "iam"];

export default function UsernameStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, updateProfile } = useCreator();

  const [username, setUsername] = useState(profile?.username || "");
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{
    available: boolean;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize with current username if already in context
  useEffect(() => {
    if (profile?.username && !username) {
      setUsername(profile.username);
    }
  }, [profile?.username]);

  // Live debounced DB username availability check
  useEffect(() => {
    const clean = slugifyUsername(username);

    if (!clean) {
      setStatus(null);
      setError(null);
      return;
    }

    if (clean.length < 3) {
      setStatus(null);
      setError("Handle must be at least 3 characters");
      return;
    }

    if (clean.length > 30) {
      setStatus(null);
      setError("Handle cannot exceed 30 characters");
      return;
    }

    setError(null);
    setChecking(true);

    const email = authRepository.getPendingEmail() || profile?.email || "";

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/creator/check-username?username=${encodeURIComponent(clean)}&email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        setChecking(false);

        if (data.available) {
          setStatus({
            available: true,
            message: `@${clean} is available!`,
          });
          setError(null);
        } else {
          setStatus({
            available: false,
            message: data.error || `@${clean} is already claimed`,
          });
          setError(data.error || `@${clean} is already taken`);
        }
      } catch (err) {
        setChecking(false);
        setStatus({ available: true, message: `@${clean} looks good!` });
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [username, profile?.email]);

  function handleInputChange(val: string) {
    const clean = slugifyUsername(val);
    setUsername(clean);
  }

  function handlePickSuggestion(suggestedHandle: string) {
    setUsername(slugifyUsername(suggestedHandle));
  }

  async function handleClaimUsername() {
    const clean = slugifyUsername(username);

    if (!clean || clean.length < 3) {
      setError("Please choose a valid handle (minimum 3 characters)");
      return;
    }

    if (status && !status.available) {
      setError("This handle is already taken. Please pick another one.");
      return;
    }

    setSubmitting(true);
    const email = authRepository.getPendingEmail() || profile?.email || "";

    try {
      debugLog("ONBOARDING_USERNAME", `Claiming handle: @${clean} for ${email}`);

      // 1. Update context state
      updateProfile({ username: clean });

      // 2. Persist to local repository
      ProfileService.saveLocal({
        ...profile,
        username: clean,
        email: email || profile?.email,
      });

      // 3. Reserve in MySQL database
      if (email) {
        await fetch("/api/creator/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            username: clean,
            onboardingStep: "username",
          }),
        });
      }

      // 4. Update onboarding step tracker to profile
      OnboardingService.setStep("profile");

      showToast(`@${clean} claimed successfully! 🎉`);
      router.push("/onboarding/profile");
    } catch (err: any) {
      debugError("ONBOARDING_USERNAME", "Error claiming username:", err);
      OnboardingService.setStep("profile");
      router.push("/onboarding/profile");
    } finally {
      setSubmitting(false);
    }
  }

  const cleanHandle = slugifyUsername(username);
  const isReadyToClaim = cleanHandle.length >= 3 && status?.available === true && !checking;

  return (
    <OnboardingLayout step="username">
      <div className="w-full max-w-[460px] mx-auto pt-0 sm:pt-1">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 space-y-3 text-center shadow-xs">
          {/* 1. Pill Badge */}
          <div className="flex justify-center">
            <span className="inline-block rounded-full bg-[#043084]/[0.05] border border-[#043084]/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#043084]">
              STEP 1 OF 4 · USERNAME
            </span>
          </div>

          {/* 2. Heading */}
          <div className="space-y-1">
            <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Claim your unique username
            </h1>
            <p className="text-xs font-normal text-[#54514D] max-w-sm mx-auto leading-relaxed">
              Choose the name people will use to find you on Inflixo. Your public creator profile will open at{" "}
              <span className="font-bold text-[#181716]">inflixo.com/username</span>.
            </p>
          </div>

          {/* 3. Input Form Area */}
          <div className="space-y-1 text-left">
            <label
              htmlFor="username-input"
              className="block text-xs font-semibold text-[#181716]"
            >
              Inflixo username
            </label>

            <div
              className={`flex h-10.5 sm:h-11 items-center rounded-xl border px-3 bg-white transition-all focus-within:border-[#043084] focus-within:ring-2 focus-within:ring-[#043084]/10 ${error ? "border-[#ef4444]" : "border-[#cbd5e1]"
                }`}
            >
              <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none">
                inflixo.com/
              </span>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="username"
                autoFocus
                maxLength={30}
                spellCheck={false}
                className="h-full w-full min-w-0 flex-1 bg-transparent px-1 text-xs sm:text-sm font-bold text-[#181716] outline-none placeholder:text-[#94a3b8]"
              />
              {checking && (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748b] shrink-0" />
              )}
            </div>

            {/* Availability Feedback (below input) */}
            {status?.available && cleanHandle ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] pt-0.5 animate-fade-in">
                <Check className="h-3.5 w-3.5 stroke-[3] text-[#16a34a]" />
                <span>inflixo.com/{cleanHandle} is available</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ef4444] pt-0.5 animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 text-[#ef4444]" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>

          {/* 4. Choose Carefully Hint Box */}
          <div className="rounded-xl bg-[#f8fafc] p-2 sm:p-2.5 text-left text-[11px] text-[#54514D] leading-relaxed border border-[#e2e8f0]">
            <span className="font-semibold text-[#181716]">Choose carefully:</span> use your creator name or familiar social handle. You can use 3–30 letters, numbers or underscores.
          </div>

          {/* Smart suggestions if taken */}
          {cleanHandle && (!status?.available || cleanHandle.length < 3) && (
            <div className="text-left space-y-1 animate-fade-in">
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
                Suggested alternatives:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SMART_PREFIXES.map((prefix) => {
                  const suggested = `${prefix}_${cleanHandle}`;
                  return (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => handlePickSuggestion(suggested)}
                      className="rounded-lg bg-[#f8fafc] hover:bg-surface-soft hover:text-brand-primary border border-[#e2e8f0] px-2 py-0.5 text-xs font-semibold text-[#475569] transition-all cursor-pointer"
                    >
                      @{suggested}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Primary CTA Button */}
          <button
            type="button"
            onClick={handleClaimUsername}
            disabled={!isReadyToClaim || submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm h-10.5 sm:h-11 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Claiming...</span>
              </>
            ) : (
              <>
                <span>Claim Username &amp; Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
