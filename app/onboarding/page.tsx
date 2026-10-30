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

  const [step, setStep] = useState<1 | 2 | 3>(1);
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
        const claim =
          sessionStorage.getItem("pending_claim_username") ||
          localStorage.getItem("pending_claim_username");
        if (claim) {
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
        <div className="w-full max-w-[520px] rounded-[5px] border border-[#E8DCE3] bg-white p-5 sm:p-7 text-left">
          
          {/* 1. Onboarding progress indicator */}
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

          {/* 2. Page heading and description */}
          <div className="space-y-1 mb-5">
            <h1 className="text-xl sm:text-[22px] font-extrabold text-[#281C25] tracking-tight leading-tight">
              {step === 1
                ? "Claim your Inflixo link"
                : step === 2
                ? "Where do your fans follow you?"
                : "Add your first series"}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#806F79] leading-relaxed">
              {step === 1
                ? "Set up your creator identity. Your link can go in your Instagram, YouTube and other social bios."
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
