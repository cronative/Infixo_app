"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  X,
  LogOut,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Info,
  Heart,
  Lock,
  User,
  Copy,
  ArrowDown,
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
import {
  POPULAR_CATEGORIES,
  CATEGORY_GROUPS,
  TOTAL_CATEGORIES_COUNT,
} from "@/data/creatorCategories";

const ONBOARDING_STORAGE_KEY = "inflixo_onboarding_draft";

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, loading: creatorLoading, refresh: refreshCreator } = useCreator();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "vip">("starter");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Step 1: Link & Profile
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState("");

  // Category browse & search state
  const [browseOpen, setBrowseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

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
        if (parsed.selectedCategories && Array.isArray(parsed.selectedCategories)) {
          setSelectedCategories(parsed.selectedCategories.slice(0, 3));
        } else if (parsed.category) {
          const list = String(parsed.category)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 3);
          setSelectedCategories(list);
        }
        if (typeof parsed.agreedToLegal === "boolean") {
          setAgreedToLegal(parsed.agreedToLegal);
        }
        if (parsed.instagram) setInstagram(parsed.instagram);
        if (parsed.youtube) setYoutube(parsed.youtube);
        if (parsed.facebook) setFacebook(parsed.facebook);
        if (parsed.seriesName) setSeriesName(parsed.seriesName);
        if (Array.isArray(parsed.videoLinks)) setVideoLinks(parsed.videoLinks);
      } else {
        const currentServiceStep = OnboardingService.getStep();
        if (currentServiceStep === "socials") setStep(2);
        else if (currentServiceStep === "series") setStep(3);
        else if (currentServiceStep === "subscription") setStep(4);
        else if (currentServiceStep === "finish") setStep(5);
        else setStep(1);

        if (profile.username) setUsername(profile.username);
        if (profile.displayName) setDisplayName(profile.displayName);

        const claim =
          sessionStorage.getItem("pending_claim_username") ||
          localStorage.getItem("pending_claim_username");
        if (claim && !profile.username) {
          setUsername(claim.toLowerCase().replace(/[^a-z0-9_]/g, ""));
        }
      }
    } catch {}
  }, [creatorLoading, profile.username, profile.displayName, router]);

  // Restore category from loaded profile if not yet in state
  useEffect(() => {
    if (!creatorLoading && profile.category && selectedCategories.length === 0) {
      const list = String(profile.category)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (list.length > 0) {
        setSelectedCategories(list);
      }
    }
  }, [creatorLoading, profile.category, selectedCategories.length]);

  // Persist draft to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          step,
          username,
          displayName,
          category: selectedCategories.join(", "),
          selectedCategories,
          agreedToLegal,
          instagram,
          youtube,
          facebook,
          seriesName,
          videoLinks,
        })
      );
    } catch {}
  }, [
    step,
    username,
    displayName,
    selectedCategories,
    agreedToLegal,
    instagram,
    youtube,
    facebook,
    seriesName,
    videoLinks,
  ]);

  // Category selection handlers
  function toggleCategory(cat: string) {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories((prev) => prev.filter((c) => c !== cat));
    } else {
      if (selectedCategories.length >= 3) {
        showToast("You can choose up to 3 categories that describe you.");
        return;
      }
      setSelectedCategories((prev) => [...prev, cat]);
    }
  }

  function removeCategory(cat: string) {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat));
  }

  // Filtered category groups for Browse All
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return CATEGORY_GROUPS.filter((group) => {
      if (selectedGroup !== "all" && group.id !== selectedGroup) {
        return false;
      }
      if (!query) return true;
      return (
        group.name.toLowerCase().includes(query) ||
        group.items.some((item) => item.toLowerCase().includes(query))
      );
    })
      .map((group) => {
        if (!query) return group;
        return {
          ...group,
          items: group.items.filter((item) => item.toLowerCase().includes(query)),
        };
      })
      .filter((group) => group.items.length > 0);
  }, [searchQuery, selectedGroup]);

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
    if (!username || usernameAvailable !== true || !displayName.trim()) {
      return;
    }
    if (selectedCategories.length === 0) {
      showToast("Please choose at least 1 category that describes you.");
      return;
    }
    if (!agreedToLegal) {
      showToast("Please agree to the Terms of Service, Creator Terms and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const categoryStr = selectedCategories.join(", ");

      // Save to ProfileService locally
      ProfileService.saveLocal({
        email,
        username: cleanUser,
        displayName: displayName.trim(),
        category: categoryStr,
      });

      // Call API to persist creator profile in DB (with acceptedLegalTerms: true)
      const res = await fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: cleanUser,
          displayName: displayName.trim(),
          category: categoryStr,
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
      await fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, onboardingStep: "series" }),
      }).catch(() => {});
      setStep(3);
    } catch (err: any) {
      setApiError(err?.message || "Failed to save platforms. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 3: Proceed to Plan Selection (Step 4)
  async function handleStep3Proceed(skipSeries = false) {
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
            genre: selectedCategories[0] || "General",
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

      OnboardingService.setStep("subscription");
      await fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, onboardingStep: "subscription" }),
      }).catch(() => {});
      setStep(4);
    } catch (err: any) {
      setApiError(err?.message || "Failed to save series. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 4: Activate 7-Day Free Trial & Proceed to Summary (Step 5)
  async function handleActivatePlan() {
    setSubmitting(true);
    setApiError("");

    try {
      const planKey = selectedPlan === "starter" ? "early_access" : selectedPlan;
      await SubscriptionService.activate(planKey, "yearly", email).catch(() => {});

      await fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          onboardingStep: "finish",
          acceptedLegalTerms: true,
        }),
      }).catch(() => {});

      OnboardingService.setStep("finish");
      setStep(5);
    } catch (err: any) {
      setApiError(err?.message || "Failed to activate plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoToDashboard() {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      localStorage.removeItem("pending_claim_username");
      sessionStorage.removeItem("pending_claim_username");
    } catch {}

    OnboardingService.setStep("finish");
    await fetch("/api/creator/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        onboardingStep: "finish",
        acceptedLegalTerms: true,
      }),
    }).catch(() => {});

    refreshCreator();
    showToast("Welcome to your creator space! 🎉");
    router.push("/dashboard");
  }

  function copyLink() {
    const url = `inflixo.com/${username}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!");
    }
  }

  const isStep1Valid = Boolean(
    username &&
      username.length >= 3 &&
      usernameAvailable === true &&
      displayName.trim() &&
      selectedCategories.length >= 1 &&
      selectedCategories.length <= 3 &&
      agreedToLegal
  );

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
        <div
          className={`w-full ${
            step === 4 ? "max-w-[840px]" : "max-w-[520px]"
          } rounded-[5px] border border-[#E8DCE3] bg-white p-5 sm:p-7 text-left transition-all`}
        >
          {/* Card subheader for Step 2 & 3 */}
          {step === 2 && (
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#7A2253]">Your platforms</span>
              <span className="text-[#806F79]">Step 2 of 3</span>
            </div>
          )}
          {step === 3 && (
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#7A2253]">Your first series</span>
              <span className="text-[#806F79]">Step 3 of 3</span>
            </div>
          )}

          {/* 1. Onboarding progress indicator (Steps 1, 2, 3) */}
          {step <= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div
                className={`h-[3px] rounded-[5px] transition-colors ${
                  step >= 1 ? "bg-[#7A2253]" : "bg-[#E8DCE3]"
                }`}
              />
              <div
                className={`h-[3px] rounded-[5px] transition-colors ${
                  step >= 2 ? "bg-[#7A2253]" : "bg-[#E8DCE3]"
                }`}
              />
              <div
                className={`h-[3px] rounded-[5px] transition-colors ${
                  step >= 3 ? "bg-[#7A2253]" : "bg-[#E8DCE3]"
                }`}
              />
            </div>
          )}

          {/* 2. Page heading and description (Steps 1, 2, 3) */}
          {step <= 3 && (
            <div className="space-y-1 mb-5">
              <h1 className="text-xl sm:text-[22px] font-extrabold text-[#281C25] tracking-tight leading-tight">
                {step === 1
                  ? "Claim your Inflixo link"
                  : step === 2
                  ? "Your audience is already out there."
                  : "Your stories deserve to be seen together."}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#806F79] leading-relaxed">
                {step === 1
                  ? "Set up your creator identity. Your link can go in your Instagram, YouTube and other social bios."
                  : step === 2
                  ? "You've built your community across different platforms. Bring your social profiles together so fans can discover more of you in one place."
                  : "Every video takes effort, and every part tells a story. Bring your videos together so your fans can follow along, from the first part to the last."}
              </p>
            </div>
          )}

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
              {/* 3. Claim Username field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username-input"
                  className="block text-xs sm:text-[13px] font-semibold text-[#281C25]"
                >
                  Claim your username <span className="text-[#DC2626]">*</span>
                </label>
                <div
                  className={`flex items-center w-full bg-white border rounded-[5px] transition-colors focus-within:border-[#7A2253] ${
                    usernameAvailable === false
                      ? "border-[#DC2626]"
                      : "border-[#E8DCE3]"
                  }`}
                >
                  <span className="pl-3 pr-0.5 text-xs sm:text-sm font-semibold text-[#7A2253] select-none shrink-0">
                    inflixo.com/
                  </span>
                  <input
                    id="username-input"
                    type="text"
                    autoFocus
                    disabled={submitting}
                    value={username}
                    placeholder="yourusername"
                    onChange={(e) => {
                      const clean = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "");
                      setUsername(clean);
                    }}
                    className="flex-1 bg-transparent py-2 px-1 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79]/50 focus:outline-none min-w-0"
                  />
                  <div className="pr-3 shrink-0 flex items-center">
                    {checkingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#7A2253]" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    ) : usernameAvailable === false ? (
                      <XCircle className="h-4 w-4 text-[#DC2626]" />
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-[#806F79]">
                  This will be your unique public profile URL.
                </p>
                {usernameMessage && (
                  <p
                    className={`text-xs font-semibold ${
                      usernameAvailable === true
                        ? "text-[#16A34A]"
                        : usernameAvailable === false
                        ? "text-[#DC2626]"
                        : "text-[#806F79]"
                    }`}
                  >
                    {usernameAvailable === true
                      ? `✓ inflixo.com/${username} is available!`
                      : usernameMessage}
                  </p>
                )}
              </div>

              {/* 4. Display Name field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="display-name-input"
                  className="block text-xs sm:text-[13px] font-semibold text-[#281C25]"
                >
                  Display name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="display-name-input"
                  type="text"
                  disabled={submitting}
                  value={displayName}
                  placeholder="e.g. Nikunj Creates"
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white border border-[#E8DCE3] rounded-[5px] py-2 px-3 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79]/50 focus:outline-none focus:border-[#7A2253] transition-colors"
                />
              </div>

              {/* Separator */}
              <div className="border-t border-[#E8DCE3] my-4" />

              {/* 5. Creator Category Selector */}
              <div className="space-y-2.5">
                {/* Heading + Subtitle + Counter */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-[15px] font-bold text-[#281C25]">
                      What type of creator are you?
                    </h3>
                    <p className="text-xs text-[#806F79]">
                      Choose up to 3 categories that describe you.
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#7A2253] shrink-0 pt-0.5">
                    {selectedCategories.length}/3
                  </span>
                </div>

                {/* Selected categories row */}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#F8EFF4] border border-[#7A2253]/30 text-[#7A2253] text-xs font-semibold"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory(cat)}
                          aria-label={`Remove ${cat}`}
                          className="hover:opacity-75 focus:outline-none cursor-pointer"
                        >
                          <X className="h-3 w-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Popular Categories */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-[#806F79] uppercase tracking-wider block">
                    POPULAR CREATOR TYPES
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {POPULAR_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`tap-scale inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#F8EFF4] border border-[#7A2253] text-[#7A2253] font-semibold"
                              : "bg-white border border-[#E8DCE3] text-[#281C25] hover:border-[#7A2253]/40"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-[#7A2253] stroke-[2.5]" />
                          )}
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Browse All Categories Expandable Control */}
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => setBrowseOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-[#E8DCE3] rounded-[5px] text-left hover:border-[#7A2253]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-[#7A2253] shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#281C25]">
                        {browseOpen ? "Hide All Categories" : "Browse All Categories"}
                      </span>
                      <span className="text-[11px] text-[#806F79]">
                        {TOTAL_CATEGORIES_COUNT}+ types
                      </span>
                    </div>
                    {browseOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#7A2253] shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#806F79] shrink-0" />
                    )}
                  </button>

                  {/* Expanded Category Browser */}
                  {browseOpen && (
                    <div className="mt-2 p-3 bg-white border border-[#E8DCE3] rounded-[5px] space-y-3 animate-in fade-in duration-200">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search e.g. actor, singer, photographer..."
                          className="w-full bg-white border border-[#E8DCE3] rounded-[5px] py-1.5 pl-3 pr-8 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79] focus:outline-none focus:border-[#7A2253]"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#806F79] hover:text-[#281C25] cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Group dropdown */}
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="w-full bg-white border border-[#E8DCE3] rounded-[5px] py-1.5 px-3 text-xs sm:text-sm text-[#281C25] focus:outline-none focus:border-[#7A2253] cursor-pointer"
                      >
                        <option value="all">All creator categories</option>
                        {CATEGORY_GROUPS.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>

                      {/* Scrollable category list */}
                      <div className="max-h-[310px] overflow-y-auto space-y-3 pr-1">
                        {filteredGroups.length === 0 ? (
                          <p className="text-xs text-[#806F79] py-4 text-center">
                            No matching categories found.
                          </p>
                        ) : (
                          filteredGroups.map((group) => (
                            <div key={group.id} className="space-y-1.5">
                              <h4 className="text-[11px] font-bold text-[#806F79] uppercase tracking-wider">
                                {group.name}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {group.items.map((cat) => {
                                  const isSelected = selectedCategories.includes(cat);
                                  return (
                                    <button
                                      key={`${group.id}-${cat}`}
                                      type="button"
                                      onClick={() => toggleCategory(cat)}
                                      className={`tap-scale inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-xs font-medium transition-colors cursor-pointer ${
                                        isSelected
                                          ? "bg-[#F8EFF4] border border-[#7A2253] text-[#7A2253] font-semibold"
                                          : "bg-white border border-[#E8DCE3] text-[#281C25] hover:border-[#7A2253]/40"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-[#7A2253] stroke-[2.5]" />
                                      )}
                                      <span>{cat}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-[#E8DCE3] my-4" />

              {/* 6. Legal Consent */}
              <div className="pt-1">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={agreedToLegal}
                    onChange={(e) => setAgreedToLegal(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-[3px] accent-[#7A2253] border-[#E8DCE3] cursor-pointer focus:ring-1 focus:ring-[#7A2253]"
                  />
                  <label
                    htmlFor="consent-checkbox"
                    className="text-xs text-[#281C25] leading-relaxed select-none cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-[#7A2253] underline underline-offset-2 hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-[#7A2253] rounded-[2px]"
                    >
                      Terms of Service
                    </Link>
                    ,{" "}
                    <Link
                      href="/creator-terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-[#7A2253] underline underline-offset-2 hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-[#7A2253] rounded-[2px]"
                    >
                      Creator Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-[#7A2253] underline underline-offset-2 hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-[#7A2253] rounded-[2px]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
              </div>

              {/* 7. Continue to Platforms Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isStep1Valid || submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs sm:text-sm font-semibold hover:bg-[#661b44] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to platforms</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: YOUR PLATFORMS ================= */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              {/* Instagram */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="instagram-input"
                    className="block text-xs sm:text-[13px] font-semibold text-[#281C25]"
                  >
                    Instagram profile
                  </label>
                  <span className="text-xs text-[#806F79]">Optional</span>
                </div>
                <div className="flex items-center w-full bg-white border border-[#E8DCE3] rounded-[5px] focus-within:border-[#7A2253] transition-colors">
                  <div className="pl-3 pr-2.5 py-2 text-[#7A2253]">
                    <InstagramIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="instagram-input"
                    type="text"
                    disabled={submitting}
                    value={instagram}
                    placeholder="Instagram profile URL"
                    onChange={(e) => setInstagram(e.target.value)}
                    className="flex-1 bg-transparent py-2 pr-3 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79]/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* YouTube */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="youtube-input"
                    className="block text-xs sm:text-[13px] font-semibold text-[#281C25]"
                  >
                    YouTube channel
                  </label>
                  <span className="text-xs text-[#806F79]">Optional</span>
                </div>
                <div className="flex items-center w-full bg-white border border-[#E8DCE3] rounded-[5px] focus-within:border-[#7A2253] transition-colors">
                  <div className="pl-3 pr-2.5 py-2 text-[#7A2253]">
                    <YoutubeIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="youtube-input"
                    type="text"
                    disabled={submitting}
                    value={youtube}
                    placeholder="YouTube channel URL"
                    onChange={(e) => setYoutube(e.target.value)}
                    className="flex-1 bg-transparent py-2 pr-3 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79]/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Facebook */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="facebook-input"
                    className="block text-xs sm:text-[13px] font-semibold text-[#281C25]"
                  >
                    Facebook page
                  </label>
                  <span className="text-xs text-[#806F79]">Optional</span>
                </div>
                <div className="flex items-center w-full bg-white border border-[#E8DCE3] rounded-[5px] focus-within:border-[#7A2253] transition-colors">
                  <div className="pl-3 pr-2.5 py-2 text-[#7A2253]">
                    <FacebookIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="facebook-input"
                    type="text"
                    disabled={submitting}
                    value={facebook}
                    placeholder="Facebook page URL"
                    onChange={(e) => setFacebook(e.target.value)}
                    className="flex-1 bg-transparent py-2 pr-3 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79]/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-2 pt-1 text-xs text-[#806F79] leading-relaxed">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#806F79]" />
                <span>
                  No pressure to add everything now. You can connect or update your profiles anytime from Studio Settings.
                </span>
              </div>

              {/* Separator */}
              <div className="border-t border-[#E8DCE3] my-4" />

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="px-6 py-2.5 sm:py-3 bg-white border border-[#E8DCE3] rounded-[5px] text-xs sm:text-sm font-semibold text-[#281C25] hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs sm:text-sm font-semibold hover:bg-[#661b44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to series</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: FIRST SERIES ================= */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Series name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="series-name-input"
                    className="block text-xs sm:text-[13px] font-semibold text-[#281C25]"
                  >
                    Series name
                  </label>
                  <span className="text-xs text-[#806F79]">Optional</span>
                </div>
                <input
                  id="series-name-input"
                  type="text"
                  disabled={submitting}
                  value={seriesName}
                  placeholder="e.g. My Travel Diaries"
                  onChange={(e) => setSeriesName(e.target.value)}
                  className="w-full bg-white border border-[#E8DCE3] rounded-[5px] py-2 px-3 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79]/50 focus:outline-none focus:border-[#7A2253] transition-colors"
                />
              </div>

              {/* Video links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-[13px] font-semibold text-[#281C25]">
                    Your video links
                  </label>
                  <span className="text-xs text-[#806F79]">Up to 3 · Optional</span>
                </div>
                {videoLinks.map((link, idx) => (
                  <input
                    key={idx}
                    type="text"
                    disabled={submitting}
                    value={link}
                    placeholder={`Paste video ${idx + 1} URL`}
                    onChange={(e) => {
                      const next = [...videoLinks];
                      next[idx] = e.target.value;
                      setVideoLinks(next);
                    }}
                    className="w-full bg-white border border-[#E8DCE3] rounded-[5px] py-2 px-3 text-xs sm:text-sm text-[#281C25] placeholder:text-[#806F79]/50 focus:outline-none focus:border-[#7A2253] transition-colors"
                  />
                ))}
              </div>

              {/* Heart Note */}
              <div className="flex items-start gap-2 pt-1 text-xs text-[#806F79] leading-relaxed">
                <Heart className="h-4 w-4 shrink-0 mt-0.5 text-[#7A2253]" />
                <span>
                  Your videos stay on their original platforms. Inflixo simply organizes their links so your fans can find every part in order.
                </span>
              </div>

              {/* Separator */}
              <div className="border-t border-[#E8DCE3] my-4" />

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="px-6 py-2.5 sm:py-3 bg-white border border-[#E8DCE3] rounded-[5px] text-xs sm:text-sm font-semibold text-[#281C25] hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleStep3Proceed(true)}
                  className="text-xs sm:text-sm font-semibold text-[#7A2253] hover:underline cursor-pointer"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleStep3Proceed(false)}
                  className="py-2.5 sm:py-3 px-5 sm:px-6 rounded-[5px] bg-[#7A2253] text-white text-xs sm:text-sm font-semibold hover:bg-[#661b44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Create My Profile</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Helper text */}
              <p className="text-center text-xs text-[#806F79] pt-2">
                No rush. You can add more series and episodes whenever you&apos;re ready.
              </p>
            </div>
          )}

          {/* ================= STEP 4: PLANS & LIMITS ================= */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Header */}
              <div className="text-center space-y-1 mb-6">
                <p className="text-[11px] font-bold text-[#7A2253] tracking-widest uppercase">
                  WELCOME TO YOUR CREATOR SPACE
                </p>
                <h1 className="text-xl sm:text-[24px] font-extrabold text-[#281C25] tracking-tight">
                  Your story deserves a place of its own.
                </h1>
                <p className="text-xs sm:text-[13px] text-[#806F79] max-w-[560px] mx-auto mt-1 leading-relaxed">
                  Choose the space that fits your journey. Start small, grow at your pace, and keep everything your fans love in one place.
                </p>
              </div>

              {/* 3 Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Starter */}
                <div
                  onClick={() => setSelectedPlan("starter")}
                  className={`rounded-[5px] p-4 text-left cursor-pointer transition-all ${
                    selectedPlan === "starter"
                      ? "border-2 border-[#7A2253] bg-white shadow-xs"
                      : "border border-[#E8DCE3] bg-white hover:border-[#7A2253]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#281C25]">Starter</h3>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedPlan === "starter"
                          ? "border-[#7A2253] text-[#7A2253]"
                          : "border-zinc-300"
                      }`}
                    >
                      {selectedPlan === "starter" && (
                        <Check className="h-3 w-3 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#7A2253] tracking-wider uppercase">
                    7 DAYS FREE TRIAL
                  </span>
                  <div className="mt-2 mb-3">
                    <span className="text-2xl font-extrabold text-[#281C25]">₹99</span>
                    <span className="text-xs text-[#806F79]">/month</span>
                  </div>
                  <div className="border-t border-[#E8DCE3] my-3" />
                  <ul className="space-y-2 text-xs text-[#281C25]">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>5 series</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>5 episodes per series</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>10 custom links</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>3 products</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>3 creator setups</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>1 collaboration package</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Pro */}
                <div
                  onClick={() => setSelectedPlan("pro")}
                  className={`rounded-[5px] p-4 text-left cursor-pointer transition-all ${
                    selectedPlan === "pro"
                      ? "border-2 border-[#7A2253] bg-white shadow-xs"
                      : "border border-[#E8DCE3] bg-white hover:border-[#7A2253]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#281C25]">Pro</h3>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedPlan === "pro"
                          ? "border-[#7A2253] text-[#7A2253]"
                          : "border-zinc-300"
                      }`}
                    >
                      {selectedPlan === "pro" && (
                        <Check className="h-3 w-3 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <span className="inline-block mt-1 text-xs text-[#806F79]">
                    For creators ready to do more
                  </span>
                  <div className="mt-2 mb-3">
                    <span className="text-2xl font-extrabold text-[#281C25]">₹199</span>
                    <span className="text-xs text-[#806F79]">/month</span>
                  </div>
                  <div className="border-t border-[#E8DCE3] my-3" />
                  <ul className="space-y-2 text-xs text-[#281C25]">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>30 series</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>30 episodes per series</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>30 custom links</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>30 products</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>30 creator setups</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>2 media kits</span>
                    </li>
                  </ul>
                </div>

                {/* 3. VIP */}
                <div
                  onClick={() => setSelectedPlan("vip")}
                  className={`rounded-[5px] p-4 text-left cursor-pointer transition-all ${
                    selectedPlan === "vip"
                      ? "border-2 border-[#7A2253] bg-white shadow-xs"
                      : "border border-[#E8DCE3] bg-white hover:border-[#7A2253]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#281C25]">VIP</h3>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedPlan === "vip"
                          ? "border-[#7A2253] text-[#7A2253]"
                          : "border-zinc-300"
                      }`}
                    >
                      {selectedPlan === "vip" && (
                        <Check className="h-3 w-3 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <span className="inline-block mt-1 text-xs text-[#806F79]">
                    Everything, without limits
                  </span>
                  <div className="mt-2 mb-3">
                    <span className="text-2xl font-extrabold text-[#281C25]">₹399</span>
                    <span className="text-xs text-[#806F79]">/month</span>
                  </div>
                  <div className="border-t border-[#E8DCE3] my-3" />
                  <ul className="space-y-2 text-xs text-[#281C25]">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>Unlimited series &amp; episodes</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>Unlimited custom links</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>Unlimited products</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>Unlimited creator setups</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
                      <span>Unlimited media kits &amp; collabs</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Work stays safe callout */}
              <div className="border border-[#E8DCE3] rounded-[5px] p-3.5 bg-white flex items-start gap-3">
                <Lock className="h-4 w-4 text-[#7A2253] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#281C25]">
                    Your work stays safe, even if your plan expires.
                  </h4>
                  <p className="text-xs text-[#806F79] mt-0.5 leading-relaxed">
                    After your 7-day trial ends, your public profile becomes private until you activate a subscription. Your series, links and creator data remain saved.
                  </p>
                </div>
              </div>

              {/* Start 7-Day Free Trial Button */}
              <button
                type="button"
                onClick={handleActivatePlan}
                disabled={submitting}
                className="w-full py-3 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs sm:text-sm font-semibold hover:bg-[#661b44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Activating trial...</span>
                  </>
                ) : (
                  <>
                    <span>Start My 7-Day Free Trial</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Footer text */}
              <p className="text-center text-xs text-[#806F79] pt-2 flex items-center justify-center gap-1">
                Your creator journey is yours. Choose what works for you today.
                <ArrowDown className="h-3.5 w-3.5" />
              </p>
            </div>
          )}

          {/* ================= STEP 5: CREATOR SUMMARY / GO TO STUDIO ================= */}
          {step === 5 && (
            <div className="space-y-4 text-center">
              {/* Checkmark in soft maroon box */}
              <div className="flex justify-center mb-1">
                <div className="h-12 w-12 rounded-[5px] bg-[#F8EFF4] flex items-center justify-center text-[#7A2253]">
                  <Check className="h-6 w-6 stroke-[2.5]" />
                </div>
              </div>

              {/* Header */}
              <div className="space-y-1 mb-4">
                <p className="text-[11px] font-bold text-[#7A2253] tracking-widest uppercase">
                  WELCOME TO INFLIXO
                </p>
                <h1 className="text-xl sm:text-[24px] font-extrabold text-[#281C25] tracking-tight">
                  Your space. Your stories. Your way.
                </h1>
                <p className="text-xs sm:text-[13px] text-[#806F79] max-w-[420px] mx-auto mt-1 leading-relaxed">
                  Every story you&apos;ve shared has brought you here. Now you&apos;ve got a place to bring it all together — and make it truly yours.
                </p>
              </div>

              {/* Creator Profile Box */}
              <div className="border border-[#E8DCE3] rounded-[5px] p-4 text-left bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#7A2253] tracking-wider uppercase">
                    YOUR CREATOR PROFILE
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#806F79]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Created
                  </span>
                </div>

                {/* Profile row */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#F8EFF4] border border-[#E8DCE3] flex items-center justify-center text-[#7A2253] shrink-0 font-bold text-base">
                    {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#281C25]">
                      {displayName || "Your Name"}
                    </h4>
                    <p className="text-xs text-[#806F79]">
                      @{username || "yourname"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#E8DCE3]" />

                {/* Social platforms */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#806F79] uppercase tracking-wider">
                    YOUR SOCIAL PLATFORMS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DCE3] text-xs font-medium text-[#281C25] bg-white">
                      <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C]" /> Instagram
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DCE3] text-xs font-medium text-[#281C25] bg-white">
                      <YoutubeIcon className="h-3.5 w-3.5 text-[#FF0000]" /> YouTube
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DCE3] text-xs font-medium text-[#281C25] bg-white">
                      <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" /> Facebook
                    </span>
                  </div>
                </div>

                {/* Link card */}
                <div className="p-3 rounded-[5px] bg-[#F8EFF4]/60 border border-[#E8DCE3] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#806F79]">Your Inflixo link</p>
                    <p className="text-xs sm:text-sm font-semibold text-[#7A2253]">
                      inflixo.com/{username}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyLink}
                    aria-label="Copy link"
                    className="p-1.5 text-[#806F79] hover:text-[#7A2253] cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#806F79] pt-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Your profile and selected plan are ready.</span>
              </div>

              {/* Go to My Studio */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="w-full py-3 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs sm:text-sm font-semibold hover:bg-[#661b44] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to My Studio</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Subtext */}
              <p className="text-center text-xs text-[#806F79] pt-2">
                This is your beginning. Make every story count.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
