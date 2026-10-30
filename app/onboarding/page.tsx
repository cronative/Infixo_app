"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Clapperboard,
  ArrowRight,
  ArrowLeft,
  Check,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { Logo } from "@/components/shared/Logo";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { AuthService } from "@/services/AuthService";
import { ProfileService } from "@/services/ProfileService";
import { OnboardingService } from "@/services/OnboardingService";
import { SubscriptionService } from "@/services/SubscriptionService";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { authRepository } from "@/repositories/localRepository";
import { storage, STORAGE_KEYS } from "@/utils/storage";

const CATEGORIES = [
  "Food",
  "Travel",
  "Comedy",
  "Education",
  "Tech",
  "Lifestyle",
  "Music",
  "Other",
];

const ONBOARDING_STORAGE_KEY = "inflixo_onboarding_draft";

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, loading: creatorLoading, refresh: refreshCreator } = useCreator();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Step 1: Link & Profile
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState("");

  // Step 2: Platforms
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");

  // Step 3: First Series
  const [seriesName, setSeriesName] = useState("");
  const [videoLinks, setVideoLinks] = useState<string[]>(["", "", ""]);

  // Route Guard: if not logged in -> /login. If profile already complete -> /dashboard
  useEffect(() => {
    if (!AuthService.isLoggedIn()) {
      router.replace("/login");
      return;
    }

    const pending =
      storage.get<string>(STORAGE_KEYS.otpEmail, "") ||
      AuthService.getPendingEmail() ||
      authRepository.get()?.email ||
      "";
    if (pending) setEmail(pending);

    if (!creatorLoading && profile.username && profile.displayName && OnboardingService.isComplete()) {
      router.replace("/dashboard");
      return;
    }

    // Hydrate draft from localStorage if available
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.instagram) setInstagram(parsed.instagram);
        if (parsed.youtube) setYoutube(parsed.youtube);
        if (parsed.facebook) setFacebook(parsed.facebook);
        if (parsed.seriesName) setSeriesName(parsed.seriesName);
        if (Array.isArray(parsed.videoLinks)) setVideoLinks(parsed.videoLinks);
      } else {
        const claim =
          sessionStorage.getItem("pending_claim_username") ||
          localStorage.getItem("pending_claim_username");
        if (claim) {
          setUsername(claim.toLowerCase().replace(/[^a-z0-9_]/g, ""));
        }
      }
    } catch {}
  }, [creatorLoading, profile.username, profile.displayName, router]);

  // Persist draft to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          step,
          username,
          displayName,
          category,
          instagram,
          youtube,
          facebook,
          seriesName,
          videoLinks,
        })
      );
    } catch {}
  }, [step, username, displayName, category, instagram, youtube, facebook, seriesName, videoLinks]);

  // Live availability check for username
  const checkAvailability = useCallback(
    async (candidate: string) => {
      const clean = candidate.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!clean || clean.length < 3) {
        setUsernameAvailable(null);
        setUsernameMessage(
          clean.length > 0 ? "Username must be at least 3 characters." : ""
        );
        return;
      }

      setCheckingUsername(true);
      try {
        const res = await fetch(
          `/api/creator/check-username?username=${encodeURIComponent(
            clean
          )}&email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        if (data.status === 1 && data.data?.available) {
          setUsernameAvailable(true);
          setUsernameMessage("Available");
        } else {
          setUsernameAvailable(false);
          setUsernameMessage(data.message || "Already taken, try another");
        }
      } catch {
        setUsernameAvailable(null);
        setUsernameMessage("");
      } finally {
        setCheckingUsername(false);
      }
    },
    [email]
  );

  // Debounce username check
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      setUsernameMessage("");
      return;
    }
    const timer = setTimeout(() => {
      checkAvailability(username);
    }, 300);
    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  function handleSaveAndLogout() {
    AuthService.logout();
    showToast("Your progress is saved safely! See you soon 👋");
    router.push("/login");
  }

  // Step 1: Submit Link & Profile
  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || usernameAvailable === false || !displayName.trim()) {
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

      // Save to ProfileService locally
      ProfileService.saveLocal({
        email,
        username: cleanUser,
        displayName: displayName.trim(),
        category: category || "Other",
      });

      // Call API to persist creator profile in DB (with acceptedLegalTerms: true)
      const res = await fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: cleanUser,
          displayName: displayName.trim(),
          category: category || "Other",
          onboardingStep: "socials",
          acceptedLegalTerms: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Could not save your link");
      }

      OnboardingService.setStep("socials");
      setStep(2);
    } catch (err: any) {
      setApiError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 2: Submit Platforms
  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setApiError("");

    try {
      const socialPromises = [];
      const cleanIg = instagram.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "").replace(/^@/, "").trim();
      const cleanYt = youtube.replace(/^(https?:\/\/)?(www\.)?youtube\.com\/(@)?/, "").trim();
      const cleanFb = facebook.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, "").trim();

      if (cleanIg) {
        socialPromises.push(
          fetch("/api/creator/socials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "instagram", username: cleanIg }),
          }).catch(() => {})
        );
      }
      if (cleanYt) {
        socialPromises.push(
          fetch("/api/creator/socials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "youtube", username: cleanYt }),
          }).catch(() => {})
        );
      }
      if (cleanFb) {
        socialPromises.push(
          fetch("/api/creator/socials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "facebook", username: cleanFb }),
          }).catch(() => {})
        );
      }

      await Promise.all(socialPromises);
      OnboardingService.setStep("series");
      setStep(3);
    } catch (err: any) {
      setApiError(err?.message || "Failed to save platforms. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 3: Complete / Finish Onboarding
  async function handleFinish(skipSeries = false) {
    setSubmitting(true);
    setApiError("");

    try {
      // Create first series if provided
      if (!skipSeries && seriesName.trim()) {
        const validLinks = videoLinks.filter((l) => l.trim().length > 0);
        await fetch("/api/series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: seriesName.trim(),
            description: "",
            genre: category || "General",
            language: "Hindi",
            platform: "YouTube",
            episodes: validLinks.map((link, idx) => ({
              title: `Part ${idx + 1}`,
              externalUrl: link.trim(),
              episodeNumber: idx + 1,
            })),
          }),
        }).catch(() => {});
      }

      // Activate Free Trial lifecycle
      await SubscriptionService.activate("early_access", "yearly", email).catch(() => {});

      // Mark onboarding as complete in API
      await fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          onboardingStep: "finish",
          acceptedLegalTerms: true,
        }),
      }).catch(() => {});

      // Finalize client-side state
      OnboardingService.setStep("finish");
      try {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        localStorage.removeItem("pending_claim_username");
        sessionStorage.removeItem("pending_claim_username");
      } catch {}

      refreshCreator();
      showToast("Your Inflixo page is live! 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      setApiError(err?.message || "Failed to complete setup.");
      setSubmitting(false);
    }
  }

  const isStep1Valid =
    Boolean(username && username.length >= 3 && usernameAvailable === true && displayName.trim());

  return (
    <div className="min-h-dvh bg-[#FFFCFB] flex flex-col">
      {/* 1. TOP STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e2e8f0] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="w-full flex items-center justify-between gap-3 px-3.5 sm:px-6 lg:px-8 py-2">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>

          {/* Right: User Email + Save & Logout */}
          <div className="flex items-center gap-2">
            {email && (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
                <Check className="h-3 w-3 text-emerald-600 stroke-[3] shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[200px] font-medium">{email}</span>
              </div>
            )}
            <button
              onClick={handleSaveAndLogout}
              className="tap-scale flex shrink-0 items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs font-bold text-[#475569] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#7A2253] shadow-2xs cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-[#64748b]" />
              <span className="hidden sm:inline">Save &amp; logout</span>
              <span className="sm:hidden">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CENTER CONTENT WITH ELEVATED WHITE CARD */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-10 px-3.5 sm:px-6">
        <div className="w-full max-w-[500px] rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-7 shadow-[0_20px_60px_-15px_rgba(122,34,83,0.08)] text-left">
          
          {/* Card Progress Header */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center justify-between text-xs font-bold text-[#52525B]">
              <span>Step {step} of 3</span>
              <span className="text-[#7A2253]">
                {step === 1
                  ? "Your link & profile"
                  : step === 2
                  ? "Your platforms"
                  : "Your first series"}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-[#7A2253] transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1 mb-5">
            <h1 className="text-xl sm:text-[24px] font-extrabold text-[#18181B] tracking-tight leading-tight">
              {step === 1
                ? "Claim your Inflixo link"
                : step === 2
                ? "Where do your fans follow you?"
                : "Add your first series"}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#52525B] leading-relaxed">
              {step === 1
                ? "This is the link you'll put in your Instagram, YouTube & X bio."
                : step === 2
                ? "We'll combine your stats to display your total fanbase on your profile."
                : "Turn scattered videos into an organized, bingeable series."}
            </p>
          </div>

          {apiError && (
            <div className="mb-4">
              <InlineAlert variant="error" className="text-left">
                {apiError}
              </InlineAlert>
            </div>
          )}

          {/* ================= STEP 1: LINK & PROFILE ================= */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {/* Username field with live availability */}
              <div>
                <TextField
                  id="username-input"
                  label="Claim your username"
                  prefixText="inflixo.com/"
                  placeholder="yourname"
                  value={username}
                  autoFocus
                  disabled={submitting}
                  onChange={(e) => {
                    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                    setUsername(clean);
                  }}
                  rightSlot={
                    checkingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#7A2253]" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    ) : usernameAvailable === false ? (
                      <XCircle className="h-4 w-4 text-[#DC2626]" />
                    ) : null
                  }
                />
                {usernameMessage && (
                  <p
                    className={`mt-1.5 text-xs font-semibold ${
                      usernameAvailable === true
                        ? "text-[#16A34A]"
                        : usernameAvailable === false
                        ? "text-[#DC2626]"
                        : "text-[#52525B]"
                    }`}
                  >
                    {usernameAvailable === true ? `✓ inflixo.com/${username} is available!` : usernameMessage}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <TextField
                id="display-name-input"
                label="Display name"
                placeholder="e.g. Tony Stark or The Foodie Show"
                value={displayName}
                disabled={submitting}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              {/* Niche / Category Chips */}
              <div>
                <label className="mb-2 block text-xs font-bold text-[#52525B]">
                  What do you create? (Category)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <Chip
                        key={cat}
                        variant="filter"
                        selected={isSelected}
                        onClick={() => setCategory(isSelected ? "" : cat)}
                      >
                        {cat}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {/* Legal Notice */}
              <p className="text-[11px] text-center text-slate-500 leading-relaxed pt-1">
                By continuing, you agree to Inflixo&apos;s{" "}
                <Link href="/terms" target="_blank" className="font-semibold text-[#7A2253] underline hover:opacity-80">
                  Terms
                </Link>
                ,{" "}
                <Link href="/creator-terms" target="_blank" className="font-semibold text-[#7A2253] underline hover:opacity-80">
                  Creator Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-[#7A2253] underline hover:opacity-80">
                  Privacy Policy
                </Link>
                .
              </p>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={submitting}
                  disabled={!isStep1Valid || submitting}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Continue to platforms <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: YOUR PLATFORMS ================= */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <TextField
                id="instagram-input"
                label="Instagram profile"
                placeholder="instagram.com/yourhandle or @yourhandle"
                value={instagram}
                disabled={submitting}
                leftIcon={<InstagramIcon className="h-4 w-4 text-[#E1306C]" />}
                onChange={(e) => setInstagram(e.target.value)}
              />

              <TextField
                id="youtube-input"
                label="YouTube channel"
                placeholder="youtube.com/@channel or @channel"
                value={youtube}
                disabled={submitting}
                leftIcon={<YoutubeIcon className="h-4 w-4 text-[#FF0000]" />}
                onChange={(e) => setYoutube(e.target.value)}
              />

              <TextField
                id="facebook-input"
                label="Facebook page"
                placeholder="facebook.com/yourpage"
                value={facebook}
                disabled={submitting}
                leftIcon={<FacebookIcon className="h-4 w-4 text-[#1877F2]" />}
                onChange={(e) => setFacebook(e.target.value)}
              />

              <p className="text-xs text-[#71717A] leading-relaxed">
                All platform links are optional. You can also connect or sync them later in studio settings.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="w-1/3"
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  disabled={submitting}
                  className="flex-1"
                >
                  <span className="inline-flex items-center gap-1.5">
                    Continue <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: FIRST SERIES ================= */}
          {step === 3 && (
            <div className="space-y-4">
              <TextField
                id="series-name-input"
                label="Series name (optional)"
                placeholder="e.g. Travel Diaries or Weekly Standup"
                value={seriesName}
                disabled={submitting}
                leftIcon={<Clapperboard className="h-4 w-4 text-[#7A2253]" />}
                onChange={(e) => setSeriesName(e.target.value)}
              />

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#52525B]">
                  Paste 1–3 video links (optional)
                </label>
                {videoLinks.map((link, idx) => (
                  <TextField
                    key={idx}
                    placeholder={`Video ${idx + 1} link (YouTube, Instagram Reel, or Shorts)`}
                    value={link}
                    disabled={submitting}
                    leftIcon={<Link2 className="h-4 w-4 text-[#71717A]" />}
                    onChange={(e) => {
                      const next = [...videoLinks];
                      next[idx] = e.target.value;
                      setVideoLinks(next);
                    }}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  disabled={submitting}
                  onClick={() => handleFinish(true)}
                  className="w-full sm:w-auto text-[#52525B] hover:text-[#7A2253]"
                >
                  Skip for now
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  disabled={submitting}
                  onClick={() => handleFinish(false)}
                  className="w-full sm:flex-1"
                >
                  <span className="inline-flex items-center gap-1.5">
                    Finish setup &amp; Go to Studio <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
