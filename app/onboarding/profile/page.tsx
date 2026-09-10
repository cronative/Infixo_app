"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search, X, Check, Plus, Sparkles } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { useCreator } from "@/contexts/CreatorContext";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { useToast } from "@/contexts/ToastContext";
import { debugLog, debugError } from "@/lib/debugLogger";
import { CREATOR_TAXONOMY } from "@/data/categories";

export default function ProfileStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, updateProfile } = useCreator();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [customOtherText, setCustomOtherText] = useState("");
  const [errors, setErrors] = useState<{
    displayName?: string;
    categories?: string;
  }>({});

  // Sync initial categories from profile
  useEffect(() => {
    if (profile?.category) {
      const list = profile.category
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) {
        setSelectedCategories(list);
      }
    }
    if (profile?.customCategory) {
      setCustomOtherText(profile.customCategory);
    }
  }, [profile?.category, profile?.customCategory]);

  // If no username claimed yet, redirect to step 1
  useEffect(() => {
    if (!profile?.username) {
      router.replace("/onboarding/username");
    }
  }, [profile?.username, router]);

  // Filtered categories for search (matching dashboard profile)
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return CREATOR_TAXONOMY;
    const query = categorySearch.trim().toLowerCase();
    return CREATOR_TAXONOMY.filter(
      (item) =>
        item.category.toLowerCase().includes(query) ||
        item.subtypes.some((st) => st.toLowerCase().includes(query))
    );
  }, [categorySearch]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Please choose an image under 5 MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ photoDataUrl: reader.result as string });
      showToast("Profile photo selected! 📸");
    };
    reader.readAsDataURL(file);
  }

  function handleToggleCategory(category: string) {
    setSelectedCategories((prev) => {
      let next: string[];
      if (prev.includes(category)) {
        next = prev.filter((c) => c !== category);
      } else {
        if (prev.length >= 3) {
          showToast("You can select up to 3 categories", "error");
          return prev;
        }
        next = [...prev, category];
      }
      updateProfile({
        category: next.length > 0 ? next.join(", ") : null,
        customCategory: next.includes("Other") ? customOtherText : "",
      });
      if (errors.categories) {
        setErrors((e) => ({ ...e, categories: undefined }));
      }
      return next;
    });
  }

  async function handleNext() {
    const displayName = (profile?.displayName || "").trim();
    const newErrors: typeof errors = {};

    if (!displayName) {
      newErrors.displayName = "Please enter your display name";
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = "Please select at least 1 category";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast(newErrors.displayName || newErrors.categories || "Please fill in required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      debugLog("ONBOARDING_PROFILE", "Saving profile to DB:", {
        displayName,
        username: profile?.username,
        categories: selectedCategories,
      });

      await ProfileService.saveToDb({
        ...profile,
        displayName,
        category: selectedCategories.join(", "),
        customCategory: selectedCategories.includes("Other") ? customOtherText.trim() : "",
      });

      OnboardingService.setStep("socials");
      showToast("Profile saved! Next: Connect your social accounts 🚀");
      router.push("/onboarding/socials");
    } catch (err: any) {
      debugError("ONBOARDING_PROFILE", "Failed to save profile:", err);
      showToast("Couldn't save profile details. Let's try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout step="profile">
      <div className="w-full max-w-[540px] mx-auto pt-4 sm:pt-8 pb-12">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-[28px] border border-[#E7E3DC] bg-white p-6 sm:p-9 space-y-6 text-left shadow-[0_4px_24px_rgba(0,0,0,0.035)]">

          {/* 1. Header Section */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-[#151933]">
              STEP 2 OF 4 · YOUR PROFILE
            </span>
            <h1 className="font-display text-2xl sm:text-[32px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Introduce yourself to your audience
            </h1>
            <p className="text-xs sm:text-[13px] font-normal text-[#54514D] leading-relaxed pt-0.5">
              Add the essentials people and brands should understand about you at a glance.
            </p>
          </div>

          {/* 2. Claimed Username Box */}
          <div className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="space-y-0.5">
              <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                CLAIMED USERNAME
              </span>
              <span className="block text-sm sm:text-base font-bold text-[#181716]">
                @{profile?.username || "username"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/onboarding/username")}
              className="text-xs sm:text-sm font-semibold text-[#181716] hover:text-[#151933] hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* 3. Profile Photo Section (Dashed Border Card) */}
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-[#cbd5e1] p-4 bg-white">
            <div className="flex items-center gap-3.5">
              {/* Circular Avatar */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#2d1a38] text-white cursor-pointer transition-transform hover:scale-105"
              >
                {profile?.photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoDataUrl}
                    alt="Profile Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center leading-tight">
                    <span className="text-[10px] font-bold text-white tracking-tight">Creator</span>
                    <span className="text-[10px] font-bold text-white tracking-tight">profile</span>
                  </div>
                )}
              </div>

              {/* Text Information */}
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-[#181716]">Profile photo</p>
                <p className="text-xs text-[#64748b]">Square JPG or PNG · up to 5 MB</p>
              </div>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-[#cbd5e1] bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#181716] hover:bg-[#f8fafc] transition-colors cursor-pointer shrink-0"
            >
              {profile?.photoDataUrl ? "Change photo" : "Upload photo"}
            </button>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* 4. Creator or Display Name */}
          <div className="space-y-2">
            <label
              htmlFor="display-name"
              className="block text-sm font-bold text-[#181716]"
            >
              Creator or display name
            </label>
            <div
              className={`flex h-12 items-center rounded-xl border bg-white px-3.5 transition-all focus-within:border-[#151933] focus-within:ring-2 focus-within:ring-[#151933]/10 ${errors.displayName ? "border-[#ef4444]" : "border-[#cbd5e1]"
                }`}
            >
              {/* Concentric rings disc icon */}
              <svg
                className="h-4 w-4 text-[#94a3b8] shrink-0 mr-2.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <input
                id="display-name"
                type="text"
                value={profile?.displayName || ""}
                onChange={(e) => {
                  updateProfile({ displayName: e.target.value });
                  if (errors.displayName) {
                    setErrors((prev) => ({ ...prev, displayName: undefined }));
                  }
                }}
                placeholder="e.g. Nikunj Creates"
                className="h-full w-full bg-transparent text-sm sm:text-base font-medium text-[#181716] outline-none placeholder:text-[#94a3b8]"
              />
            </div>
            {errors.displayName && (
              <p className="text-xs text-[#ef4444] font-medium pt-0.5">
                {errors.displayName}
              </p>
            )}
          </div>

          {/* 5. Creator categories (Exact same categories, order, emojis, chips as Dashboard Profile) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-[#181716]">
                  What do you create?
                </label>
                <p className="text-xs text-[#54514D] font-normal">
                  Choose up to 3 categories that describe your content.
                </p>
              </div>
              <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/20 shrink-0">
                {selectedCategories.length} / 3 selected
              </span>
            </div>

            {/* Quick Search Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#797570]" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full h-11 rounded-xl border border-[#E7E3DC] pl-10 pr-8 text-xs sm:text-sm text-[#181716] placeholder:text-[#797570]/60 outline-none focus:border-[#151933] focus:ring-1 focus:ring-[#151933]/15 bg-white transition-colors"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797570] hover:text-[#181716] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Pills Container (Same popular ordering & emojis) */}
            <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-wrap gap-2 pt-0.5">
              {filteredCategories.length === 0 ? (
                <p className="text-xs text-[#797570] p-2">No matching categories found.</p>
              ) : (
                filteredCategories.map((item) => {
                  const isSelected = selectedCategories.includes(item.category);
                  const isMaxReached = !isSelected && selectedCategories.length >= 3;

                  return (
                    <button
                      key={item.category}
                      type="button"
                      disabled={isMaxReached}
                      onClick={() => handleToggleCategory(item.category)}
                      className={`inline-flex items-center gap-2 text-xs sm:text-sm py-2 px-3.5 rounded-xl transition-all cursor-pointer ${isSelected
                          ? "bg-[#151933]/10 border border-[#151933]/30 text-[#151933] font-medium shadow-xs"
                          : isMaxReached
                            ? "opacity-40 cursor-not-allowed bg-white border border-[#E7E3DC] text-[#797570]"
                            : "bg-white border border-[#E7E3DC] text-[#181716] hover:border-[#151933]/30 hover:bg-[#FAF8F5]"
                        }`}
                    >
                      <span className="shrink-0">{item.emoji}</span>
                      <span className="truncate">{item.category}</span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-[#151933] shrink-0" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-[#797570] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Custom specification if "Other" is selected */}
            {selectedCategories.includes("Other") && (
              <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] p-3.5 space-y-2">
                <label className="block text-xs font-semibold text-[#181716] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#151933]" />
                  <span>What type of content do you create?</span>
                </label>
                <input
                  type="text"
                  maxLength={40}
                  placeholder="e.g. Magic, Farming, ASMR, Collectibles"
                  value={customOtherText}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 40);
                    setCustomOtherText(val);
                    updateProfile({ customCategory: val });
                  }}
                  className="w-full h-11 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-sm font-medium text-[#181716] outline-none focus:border-[#151933] focus:ring-1 focus:ring-[#151933]/20"
                />
              </div>
            )}

            {errors.categories && (
              <p className="text-xs text-[#ef4444] font-medium pt-0.5">
                {errors.categories}
              </p>
            )}
          </div>

          {/* 6. Short Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="short-bio"
                className="text-sm font-bold text-[#181716]"
              >
                Short bio
              </label>
              <span className="text-xs font-semibold text-[#64748b]">
                {(profile?.bio || "").length}/160
              </span>
            </div>

            <textarea
              id="short-bio"
              rows={3}
              maxLength={160}
              value={profile?.bio || ""}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              placeholder="Tell followers and brands what makes your content worth following."
              className="w-full rounded-xl border border-[#cbd5e1] p-3.5 text-sm sm:text-base font-normal text-[#181716] placeholder:text-[#94a3b8] focus:border-[#151933] focus:ring-2 focus:ring-[#151933]/10 outline-none resize-none transition-all leading-relaxed"
            />
          </div>

          {/* 7. Save Profile & Continue Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#151933] hover:bg-[#2c1b36] text-white font-semibold text-xs sm:text-sm h-12 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save Profile &amp; Continue</span>
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
