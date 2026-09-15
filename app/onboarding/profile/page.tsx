"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { useCreator } from "@/contexts/CreatorContext";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { useToast } from "@/contexts/ToastContext";
import { debugLog, debugError } from "@/lib/debugLogger";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";

export default function ProfileStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, updateProfile } = useCreator();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
      <div className="w-full max-w-[500px] mx-auto pt-4 sm:pt-8 pb-12">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-[28px] border border-[#E7E3DC] bg-white p-6 sm:p-8 space-y-5 text-left shadow-[0_12px_38px_rgba(21,25,51,0.06)]">

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
          <div className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
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
              className="text-xs sm:text-sm font-semibold text-[#181716] hover:text-brand-primary hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* 3. Profile Photo Section (Dashed Border Card) */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#cbd5e1] p-3.5 bg-white">
            <div className="flex items-center gap-3.5">
              {/* Circular Avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full transition-transform hover:scale-105"
                aria-label="Upload profile photo"
              >
                <CreatorAvatar
                  src={profile?.photoDataUrl}
                  name={profile?.displayName || profile?.username || "Creator"}
                  className="h-11 w-11 rounded-full"
                  textClassName="text-sm font-extrabold text-white"
                  fallbackBgClass="bg-[#2d1a38]"
                />
              </button>

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
              className="rounded-xl border border-[#cbd5e1] bg-white px-3 sm:px-3.5 py-2 text-xs font-semibold text-[#181716] hover:bg-surface-soft transition-colors cursor-pointer shrink-0"
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

          {/* 5. What do you create? */}
          <CategorySelect
            value={profile?.category || selectedCategories.join(", ")}
            customValue={profile?.customCategory || customOtherText}
            error={errors.categories}
            max={3}
            onChange={(category, customCategory) => {
              const nextCategories = category
                ? category.split(",").map((item) => item.trim()).filter(Boolean)
                : [];
              setSelectedCategories(nextCategories);
              setCustomOtherText(customCategory || "");
              updateProfile({
                category: category || null,
                customCategory: customCategory || "",
              });
              if (errors.categories) {
                setErrors((prev) => ({ ...prev, categories: undefined }));
              }
            }}
          />

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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#151933] hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm h-12 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
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
