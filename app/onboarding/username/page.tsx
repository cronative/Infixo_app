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
import { isReservedUsername } from "@/lib/constants";

function getSmartSuggestions(cleanHandle: string, email: string, isReserved: boolean): string[] {
  if (isReserved || isReservedUsername(cleanHandle)) {
    // If the handle is reserved (e.g. 'admin', 'api', 'mrbeast'), NEVER suggest variants of the reserved word.
    // Instead, derive suggestions from user's email/name if safe:
    if (email) {
      const emailPrefix = slugifyUsername(email.split("@")[0].replace(/\+.*$/, "").replace(/\..*$/, ""));
      if (emailPrefix && emailPrefix.length >= 3 && !isReservedUsername(emailPrefix)) {
        return [
          emailPrefix,
          `${emailPrefix}_creates`,
          `the_${emailPrefix}`,
          `${emailPrefix}_hq`,
        ];
      }
    }
    return [];
  }

  // If not reserved (just taken by another creator):
  // Safe creator alternatives (NO 'official_' to prevent fake account risk)
  return [
    `${cleanHandle}_`,
    `the_${cleanHandle}`,
    `${cleanHandle}_creates`,
    `${cleanHandle}_hub`,
    `${cleanHandle}hq`,
  ];
}

export default function UsernameStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, updateProfile } = useCreator();

  const [username, setUsername] = useState(profile?.username || "");
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{
    available: boolean;
    isReserved?: boolean;
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
        const httpResponse = await fetch(
          `/api/creator/check-username?username=${encodeURIComponent(clean)}&email=${encodeURIComponent(email)}`
        );
        const apiResponse = await httpResponse.json();
        setChecking(false);

        const isAvailable = Boolean(apiResponse.data?.available);
        const isReserved = Boolean(apiResponse.data?.isReserved) || isReservedUsername(clean);

        if (httpResponse.ok && apiResponse.status === 1 && isAvailable) {
          setStatus({
            available: true,
            isReserved: false,
            message: `inflixo.com/${clean} is available!`,
          });
          setError(null);
        } else {
          const failMsg = isReserved
            ? "This one's not available — try another handle 👇"
            : apiResponse.message || `inflixo.com/${clean} is already taken`;
          setStatus({
            available: false,
            isReserved,
            message: failMsg,
          });
          setError(failMsg);
        }
      } catch (err) {
        setChecking(false);
        setStatus({ available: true, message: `inflixo.com/${clean} looks good!` });
      }
    }, 300);

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
      debugLog("ONBOARDING_USERNAME", `Claiming handle: ${clean} for ${email}`);

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

      showToast(`inflixo.com/${clean} claimed successfully! 🎉`);
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
  const userEmail = authRepository.getPendingEmail() || profile?.email || "";
  const suggestions = cleanHandle && status && !status.available
    ? getSmartSuggestions(cleanHandle, userEmail, Boolean(status?.isReserved))
    : [];

  return (
    <OnboardingLayout step="username">
      <div className="w-full max-w-[480px] mx-auto py-6 sm:py-10 my-auto flex flex-col justify-center">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-7 space-y-4 text-left shadow-xs">
          
          {/* 1. Headline & Creator-First Subtitle */}
          <div className="space-y-1.5">
            <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
              Claim your Inflixo link
            </h1>
            <p className="text-xs sm:text-[13px] font-normal text-[#475569] leading-relaxed">
              This is the link you&apos;ll put in your Instagram, YouTube &amp; X bio.
            </p>
          </div>

          {/* 2. Input Form Area */}
          <div className="space-y-2">
            <label
              htmlFor="username-input"
              className="block text-xs font-bold text-[#0f172a]"
            >
              Your public link
            </label>

            <div
              className={`flex h-11 sm:h-12 items-center rounded-xl border px-3 bg-white transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/15 ${
                error
                  ? "border-[#ef4444]"
                  : status?.available && cleanHandle
                  ? "border-[#16a34a]"
                  : "border-[#cbd5e1]"
              }`}
            >
              <span className="text-xs sm:text-sm font-semibold text-[#64748b] select-none shrink-0">
                inflixo.com/
              </span>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="yourname"
                autoFocus
                maxLength={30}
                spellCheck={false}
                className="h-full w-full min-w-0 flex-1 bg-transparent px-1 text-xs sm:text-sm font-bold text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
              />
              {checking && (
                <Loader2 className="h-4 w-4 animate-spin text-[#7A2253] shrink-0" />
              )}
            </div>

            {/* Combined Link Availability Status Box (Hides positive preview when error occurs) */}
            {checking && cleanHandle.length >= 3 ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs font-semibold text-slate-700 animate-fade-in">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7A2253] shrink-0" />
                <span>Checking availability for inflixo.com/{cleanHandle}...</span>
              </div>
            ) : status?.available && cleanHandle ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-fade-in">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600 shrink-0" />
                  <span><strong>✓ inflixo.com/{cleanHandle}</strong> is yours!</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600">Available ✨</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs font-medium text-slate-600">
                <span>Preview:</span>
                <span className="font-mono font-bold text-[#7A2253]">
                  inflixo.com/{cleanHandle || "yourname"}
                </span>
              </div>
            )}
          </div>

          {/* 3. Handle Tips & Clear Rules */}
          <div className="rounded-xl bg-[#f8fafc] p-3 text-left space-y-1.5 border border-slate-200">
            <p className="text-xs font-semibold text-[#0f172a]">
              Tip: <span className="font-normal text-slate-700">Use the same handle as your Instagram/YouTube so fans find you easily.</span>
            </p>
            <p className="text-[11px] text-slate-600">
              Spaces are automatically converted to underscores (_).
            </p>
            <p className="text-[11px] font-medium text-slate-600 border-t border-slate-200/80 pt-1">
              Rules: 3–30 characters · lowercase letters (a–z), numbers (0–9), and underscores (_)
            </p>
          </div>

          {/* 4. Smart Suggestions if Taken (NO @, NO official_, NO reserved variants) */}
          {cleanHandle && status && !status.available && suggestions.length > 0 && (
            <div className="text-left space-y-1.5 pt-0.5 animate-fade-in">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Suggested alternatives:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => handlePickSuggestion(suggested)}
                    className="rounded-lg bg-white hover:bg-[#7A2253]/[0.06] hover:text-[#7A2253] hover:border-[#7A2253]/30 border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    inflixo.com/{suggested}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Primary CTA Button with Dynamic Handle Text & High Contrast */}
          <button
            type="button"
            onClick={handleClaimUsername}
            disabled={!isReadyToClaim || submitting}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-bold text-xs sm:text-sm h-11 sm:h-12 transition-all cursor-pointer shadow-sm ${
              isReadyToClaim && !submitting
                ? "bg-[#7A2253] hover:opacity-95 text-white shadow-[#7A2253]/25 active:scale-98"
                : "bg-slate-200 text-slate-700 border border-slate-300 cursor-not-allowed font-semibold"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-current" />
                <span>Claiming link...</span>
              </>
            ) : !cleanHandle ? (
              <span>Claim your Inflixo link →</span>
            ) : cleanHandle.length < 3 ? (
              <span>Minimum 3 characters required</span>
            ) : checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-current" />
                <span>Checking availability...</span>
              </>
            ) : isReadyToClaim ? (
              <>
                <span>Claim inflixo.com/{cleanHandle} →</span>
              </>
            ) : (
              <span>Pick an available link to continue</span>
            )}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
