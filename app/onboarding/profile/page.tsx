"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, User, AtSign, Tag, FileText, MapPin, Globe, Building, Loader2, AlertCircle } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { CREATOR_CATEGORIES } from "@/types";
import { BROAD_CATEGORIES, getProfessionsForCategory } from "@/data/categories";
import { slugifyUsername } from "@/utils/format";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";
import { scrollToFirstError } from "@/utils/scroll";
import { LocationSearchModal } from "@/components/ui/LocationSearchModal";

const BIO_SUGGESTIONS = [
  "🎬 Creating cinematic vlogs & travel stories",
  "💡 Tech reviews, gadget teardowns & coding tips",
  "🌿 Mindful living, wellness & everyday routines",
  "🍳 Authentic recipes & street food explorations",
];

export default function ProfileStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, socials, totalAudience, updateProfile, theme } = useCreator();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    username?: string;
    category?: string;
    city?: string;
    country?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message?: string } | null>(null);

  // Live debounced DB username uniqueness check
  useEffect(() => {
    const username = profile.username.trim();
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    setCheckingUsername(true);
    const email = authRepository.getPendingEmail() || "";
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/creator/check-username?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setCheckingUsername(false);
        if (data.available) {
          setUsernameStatus({ available: true, message: `@${username} is available!` });
          setErrors((prev) => ({ ...prev, username: undefined }));
        } else {
          setUsernameStatus({ available: false, message: data.error || `@${username} is already taken` });
          setErrors((prev) => ({ ...prev, username: data.error || `@${username} is already taken in DB` }));
        }
      } catch (err) {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [profile.username]);

  async function handleNext() {
    const newErrors: typeof errors = {};
    if (!profile.displayName.trim()) newErrors.displayName = "Display name is required";
    if (!profile.username.trim()) newErrors.username = "Choose a username";
    else if (profile.username.trim().length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!profile.category) newErrors.category = "Select a category";
    
    // Check if live DB check marked username as taken
    if (usernameStatus && !usernameStatus.available) {
      newErrors.username = usernameStatus.message || `@${profile.username} is already taken`;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fix the highlighted fields to continue 💡", "error");
      scrollToFirstError(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Final live DB check before proceeding
      const email = authRepository.getPendingEmail() || "";
      const checkRes = await fetch(`/api/creator/check-username?username=${encodeURIComponent(profile.username)}&email=${encodeURIComponent(email)}`);
      const checkData = await checkRes.json();

      if (!checkData.available) {
        setErrors((prev) => ({ ...prev, username: checkData.error || `@${profile.username} is already taken by another creator` }));
        showToast(checkData.error || "This handle is already taken by another creator — pick another cool one! ✨", "error");
        setSubmitting(false);
        return;
      }

      // Validation passed! Save profile directly to Live MySQL DB
      await ProfileService.saveToDb(profile);
      OnboardingService.setStep("socials");
      showToast("Your profile looks awesome! Next: Connect your social handles 🚀");
      router.push("/onboarding/socials");
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      showToast("Oops, couldn't save your profile details. Let's try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout
      step="profile"
      preview={<LivePreviewCard profile={profile} socials={socials} totalAudience={totalAudience} themeKey={theme} />}
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-inflixo-purple/20 bg-inflixo-purple-light/50 px-3.5 py-1.5 text-xs font-bold text-inflixo-purple-dark">
        <Sparkles className="h-4 w-4 text-inflixo-purple shrink-0" />
        <span>OTP Verified • Creator Onboarding Setup (Step 1 of 5)</span>
      </div>
      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-inflixo-navy sm:text-4xl">
        Create your <span className="text-gradient-premium">creator profile</span>
      </h1>
      <p className="mt-2 text-[15px] text-muted leading-relaxed">
        Your email is verified! Now enter your profile details below to set up your custom Inflixo page.
      </p>

      <div className="mt-8 space-y-6">
        {/* Photo Upload Section with Helper Text */}
        <div className="rounded-3xl border border-inflixo-border bg-white p-5 shadow-xs transition-all hover:border-inflixo-purple/30">
          <label className="mb-3 block text-sm font-bold text-inflixo-navy">
            Profile Picture
          </label>
          <div className="flex items-center gap-5">
            <PhotoUpload value={profile.photoDataUrl} onChange={(v) => updateProfile({ photoDataUrl: v })} />
            <div className="text-xs text-muted space-y-1">
              <p className="font-semibold text-inflixo-navy">Upload high-res photo</p>
              <p>Recommended square JPG or PNG</p>
              <p className="text-[11px] text-inflixo-purple font-medium">Shows on your link-in-bio page</p>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <Input
          label="Display name"
          name="displayName"
          placeholder="e.g. Tony Stark"
          leftIcon={<User className="h-4 w-4" />}
          value={profile.displayName}
          onChange={(e) => updateProfile({ displayName: e.target.value })}
          error={errors.displayName}
        />

        {/* Username */}
        <div>
          <Input
            label="Unique handle / username"
            name="username"
            placeholder="username"
            prefix="inflixo.com/"
            leftIcon={<AtSign className="h-4 w-4" />}
            value={profile.username}
            onChange={(e) => updateProfile({ username: slugifyUsername(e.target.value) })}
            error={errors.username}
            rightSlot={
              checkingUsername ? (
                <span className="flex items-center justify-center rounded-full bg-indigo-50 p-1 text-indigo-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              ) : usernameStatus?.available ? (
                <span className="flex items-center justify-center rounded-full bg-emerald-100 p-1 text-emerald-600">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
              ) : usernameStatus && !usernameStatus.available ? (
                <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Already Taken
                </span>
              ) : null
            }
          />
          {profile.username && usernameStatus?.available && (
            <p className="mt-1.5 text-xs text-muted flex items-center gap-1">
              Your public URL: <span className="font-semibold text-rose-600 underline">https://inflixo.com/{profile.username}</span>
            </p>
          )}
        </div>

        {/* Category (Broad) & Profession / Creator Type (Specific) Selectors */}
        <div className="space-y-4 rounded-3xl border border-inflixo-border bg-white p-5 shadow-xs">
          {/* Main Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-bold text-inflixo-navy flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-inflixo-purple" />
                Content Category (Broad)
              </label>
            </div>
            
            {/* Quick Broad Category Pills */}
            <div className="mb-3 flex flex-wrap gap-2">
              {BROAD_CATEGORIES.slice(0, 6).map((cat) => {
                const isSelected = profile.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const newProfs = getProfessionsForCategory(cat);
                      updateProfile({ category: cat as any, profession: newProfs[0] || null });
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-inflixo-purple text-white shadow-xs"
                        : "bg-surface-muted border border-inflixo-border text-muted hover:border-inflixo-purple/40 hover:text-inflixo-navy"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <Select
              placeholder="Select or search broad category..."
              value={profile.category ?? ""}
              onChange={(e) => {
                const selectedCat = e.target.value;
                const newProfs = getProfessionsForCategory(selectedCat);
                updateProfile({ category: selectedCat as any, profession: newProfs[0] || null });
              }}
              options={BROAD_CATEGORIES.map((c) => ({ value: c, label: c }))}
              error={errors.category}
            />
          </div>

          {/* Profession / Creator Type (Specific) - Dynamic based on Category (Max 3) */}
          {profile.category && (
            <div className="pt-3 border-t border-slate-100 animate-fade-in space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-inflixo-purple flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Profession / Creator Type (Specific to {profile.category})
                </label>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Select max 3 ({profile.profession ? profile.profession.split(",").map((s) => s.trim()).filter(Boolean).length : 0}/3)
                </span>
              </div>

              {/* Dynamic Profession Pills - Multi-select up to 3 */}
              <div className="flex flex-wrap gap-2 pt-1">
                {getProfessionsForCategory(profile.category).map((prof) => {
                  const currentSelected = profile.profession
                    ? profile.profession.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
                  const isSelected = currentSelected.includes(prof);

                  function handleToggle() {
                    if (isSelected) {
                      const updated = currentSelected.filter((p) => p !== prof).join(", ");
                      updateProfile({ profession: updated || null });
                    } else {
                      if (currentSelected.length >= 3) {
                        showToast("You can select max 3 creator types", "info");
                        return;
                      }
                      const updated = [...currentSelected, prof].join(", ");
                      updateProfile({ profession: updated });
                    }
                  }

                  return (
                    <button
                      key={prof}
                      type="button"
                      onClick={handleToggle}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-purple-700 text-white shadow-2xs border border-purple-700"
                          : "bg-purple-50 text-purple-700 border border-purple-200/60 hover:bg-purple-100"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      <span>{prof}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>



        {/* Bio Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-inflixo-navy flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-inflixo-purple" />
              Short Bio
            </label>
            <span className="text-xs font-medium text-muted">
              {profile.bio.length} / 160
            </span>
          </div>

          <Textarea
            name="bio"
            placeholder="Tell your audience what you create..."
            rows={3}
            maxLength={160}
            value={profile.bio}
            onChange={(e) => updateProfile({ bio: e.target.value })}
          />

          {/* Quick Suggestion Chips */}
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">Need inspiration? Tap to use:</p>
            <div className="space-y-1.5">
              {BIO_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateProfile({ bio: sug })}
                  className="block w-full text-left rounded-xl border border-inflixo-border/60 bg-surface-muted/50 px-3 py-1.5 text-xs text-muted hover:border-inflixo-purple/40 hover:bg-white hover:text-inflixo-navy transition-all"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 1 Sticky Form Bottom Action (Next Only) */}
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md py-4 border-t border-slate-200/80 mt-8">
          <Button fullWidth size="lg" loading={submitting} onClick={handleNext}>
            Save &amp; Next →
          </Button>
        </div>
      </div>

      {/* Location Searchable Popup Modal */}
      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialLocation={{
          city: profile.city || "",
          state: profile.state || "",
          country: profile.country || "",
        }}
        onSelectLocation={(loc) => {
          updateProfile({
            city: loc.city,
            state: loc.state,
            country: loc.country,
          });
          showToast(`Location set to ${loc.city}, ${loc.country} 📍`);
        }}
      />
    </OnboardingLayout>
  );
}

