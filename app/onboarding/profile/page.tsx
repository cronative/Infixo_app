"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles, Check, RotateCcw, X } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { useCreator } from "@/contexts/CreatorContext";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { useToast } from "@/contexts/ToastContext";
import { debugLog, debugError } from "@/lib/debugLogger";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { generateAiBios } from "@/lib/aiBioGenerator";
import { resizeImageToDataUrl } from "@/lib/imageResize";

export default function ProfileStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, updateProfile } = useCreator();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    categories?: string;
  }>({});

  const selectedCategories = profile?.category
    ? profile.category
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : [];

  // AI Bio Suggestion State (Max 3 uses)
  const [aiUsesCount, setAiUsesCount] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<ReturnType<typeof generateAiBios>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBioIndex, setSelectedBioIndex] = useState<number | null>(null);

  const aiUsesLeft = Math.max(0, 3 - aiUsesCount);

  // Load remaining uses from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("onboarding_ai_bio_uses");
      if (stored) {
        setAiUsesCount(parseInt(stored, 10) || 0);
      }
    }
  }, []);

  function handleGenerateAiBio() {
    const displayName = (profile?.displayName || "").trim();
    if (!displayName) {
      setErrors((prev) => ({ ...prev, displayName: "Please enter your creator name first" }));
      showToast("Please enter your creator or display name first! ✍️", "error");
      return;
    }

    if (selectedCategories.length === 0) {
      setErrors((prev) => ({ ...prev, categories: "Please select at least 1 creator type" }));
      showToast("Please select your creator type first! 🏷️", "error");
      return;
    }

    if (aiUsesLeft <= 0) {
      showToast("You have reached the maximum 3 AI bio suggestions limit.", "info");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const results = generateAiBios({
        name: displayName,
        categories: selectedCategories,
        customCategory: profile?.customCategory || undefined,
        attemptIndex: aiUsesCount,
      });

      const nextCount = aiUsesCount + 1;
      setAiUsesCount(nextCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_ai_bio_uses", String(nextCount));
      }

      setAiSuggestions(results);
      setShowSuggestions(true);
      setSelectedBioIndex(null);
      setIsGenerating(false);
      showToast(`Generated 3 AI bio suggestions! (${3 - nextCount}/3 uses left) ✨`);
    }, 450);
  }

  function handleSelectBio(text: string, index: number) {
    updateProfile({ bio: text });
    setSelectedBioIndex(index);
    showToast("Bio applied! Feel free to edit or tweak it ✨");
  }

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

    resizeImageToDataUrl(file, 512).then((dataUrl) => {
      updateProfile({ photoDataUrl: dataUrl });
      showToast("Profile photo selected! 📸");
    }).catch(() => showToast("Could not read that image. Please try another.", "error"));
  }

  async function handleNext() {
    const displayName = (profile?.displayName || "").trim();
    const newErrors: typeof errors = {};

    if (!displayName) {
      newErrors.displayName = "Please enter your display name";
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = "Please select at least 1 creator type";
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
        customCategory: "",
      });

      OnboardingService.setStep("socials");
      showToast("Profile saved! Next: Connect your social accounts 🚀");
      router.push("/onboarding/socials");
    } catch (err: unknown) {
      debugError("ONBOARDING_PROFILE", "Failed to save profile:", err);
      showToast("Couldn't save profile details. Let's try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout step="profile">
      <div className="w-full max-w-[460px] mx-auto pt-0 sm:pt-1 pb-4">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 space-y-3 text-left shadow-xs">

          {/* 1. Header Section */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#043084]">
              STEP 2 OF 4 · YOUR PROFILE
            </span>
            <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Introduce yourself to your audience
            </h1>
            <p className="text-xs font-normal text-[#54514D] leading-relaxed">
              Add the essentials people and brands should understand about you at a glance.
            </p>
          </div>

          {/* 2. Claimed Username Box */}
          <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
            <div className="space-y-0.5">
              <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#64748b]">
                CLAIMED USERNAME
              </span>
              <span className="block text-xs sm:text-sm font-bold text-[#181716]">
                @{profile?.username || "username"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/onboarding/username")}
              className="text-xs font-semibold text-[#043084] hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* 3. Profile Photo Section */}
          <div className="flex items-center justify-between gap-2.5 rounded-xl border border-dashed border-[#cbd5e1] px-3 py-2 bg-white">
            <div className="flex items-center gap-2.5">
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
                  className="h-9 w-9 rounded-full"
                  textClassName="text-xs font-extrabold text-white"
                  fallbackBgClass="bg-[#043084]"
                />
              </button>

              {/* Text Information */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[#181716]">Profile photo</p>
                  <span className="text-[10px] font-medium text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.2 rounded">Optional</span>
                </div>
                <p className="text-[10.5px] text-[#64748b]">Square JPG or PNG · up to 5 MB</p>
              </div>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1 text-xs font-semibold text-[#181716] hover:bg-surface-soft transition-colors cursor-pointer shrink-0"
            >
              {profile?.photoDataUrl ? "Change" : "Upload"}
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
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="display-name"
                className="block text-xs font-semibold text-[#181716]"
              >
                Creator or display name <span className="text-red-500">*</span>
              </label>
              <span className="text-[10.5px] text-[#64748b]">Visible on your profile</span>
            </div>
            <div
              className={`flex h-10.5 sm:h-11 items-center rounded-xl border bg-white px-3 transition-all focus-within:border-[#043084] focus-within:ring-2 focus-within:ring-[#043084]/10 ${errors.displayName ? "border-[#ef4444]" : "border-[#cbd5e1]"
                }`}
            >
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
                className="h-full w-full bg-transparent text-xs sm:text-sm font-medium text-[#181716] outline-none placeholder:text-[#94a3b8]"
              />
            </div>
            {errors.displayName && (
              <p className="text-xs text-[#ef4444] font-medium pt-0.5">
                {errors.displayName}
              </p>
            )}
          </div>

          {/* 5. Creator profession/type */}
          <CategorySelect
            value={profile?.category || selectedCategories.join(", ")}
            customValue={profile?.customCategory || ""}
            error={errors.categories}
            max={3}
            onChange={(category, customCategory) => {
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <label
                htmlFor="short-bio"
                className="text-xs font-semibold text-[#181716]"
              >
                Short bio
              </label>
              <div className="flex items-center gap-1.5">
                {/* AI Bio Suggestion Button */}
                <button
                  type="button"
                  onClick={handleGenerateAiBio}
                  disabled={isGenerating || aiUsesLeft <= 0}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
                    aiUsesLeft <= 0
                      ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                      : "bg-[#eff6ff] text-[#043084] hover:bg-[#dbeafe] border border-[#bfdbfe]/80 active:scale-95 shadow-2xs"
                  }`}
                  title={
                    aiUsesLeft <= 0
                      ? "Maximum 3 AI suggestions reached"
                      : !profile?.displayName?.trim()
                      ? "Enter your creator name first to generate AI bios"
                      : selectedCategories.length === 0
                      ? "Select creator type first to generate AI bios"
                      : "Generate tailored bio ideas with AI"
                  }
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin text-[#043084]" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-[#043084]" />
                  )}
                  <span>
                    {isGenerating
                      ? "Generating..."
                      : aiUsesLeft > 0
                      ? `AI Bio (${aiUsesLeft}/3)`
                      : "AI limit reached"}
                  </span>
                </button>

                <span className="text-[11px] font-medium text-[#64748b]">
                  {(profile?.bio || "").length}/160
                </span>
              </div>
            </div>

            <textarea
              id="short-bio"
              rows={2}
              maxLength={160}
              value={profile?.bio || ""}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              placeholder="Tell followers and brands what makes your content worth following."
              className="w-full rounded-xl border border-[#cbd5e1] p-2.5 sm:p-3 text-xs sm:text-sm font-normal text-[#181716] placeholder:text-[#94a3b8] focus:border-[#043084] focus:ring-2 focus:ring-[#043084]/10 outline-none resize-none transition-all leading-relaxed"
            />

            {/* AI Generated Suggestions Box */}
            {showSuggestions && aiSuggestions.length > 0 && (
              <div className="rounded-xl border border-[#dbeafe] bg-gradient-to-b from-[#f8faff] to-[#eff6ff]/40 p-2.5 sm:p-3 space-y-2 transition-all">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Sparkles className="h-3 w-3 text-[#043084] shrink-0" />
                    <span className="text-xs font-bold text-[#043084]">
                      AI suggestions
                    </span>
                    {selectedCategories.length > 0 && (
                      <span className="text-[9.5px] font-semibold text-[#475569] bg-white px-1.5 py-0.2 rounded-md border border-[#cbd5e1]">
                        {selectedCategories.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md hover:bg-white/80 transition-colors"
                    title="Close suggestions"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {aiSuggestions.map((sug, idx) => {
                    const isSelected = selectedBioIndex === idx || profile?.bio === sug.text;
                    return (
                      <div
                        key={sug.id || idx}
                        onClick={() => handleSelectBio(sug.text, idx)}
                        className={`group relative flex flex-col gap-1 rounded-lg border p-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#043084] bg-white shadow-xs ring-1.5 ring-[#043084]/20"
                            : "border-[#e2e8f0] bg-white hover:border-[#bfdbfe] hover:bg-[#fafcff]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{sug.toneEmoji}</span>
                            <span className="text-[10.5px] font-bold text-[#043084]">
                              {sug.tone}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9.5px] font-medium text-[#64748b]">
                              {sug.text.length}/160
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.2 rounded transition-all ${
                                isSelected
                                  ? "bg-[#043084] text-white"
                                  : "bg-[#eff6ff] text-[#043084] group-hover:bg-[#043084] group-hover:text-white"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                                  <span>Applied</span>
                                </>
                              ) : (
                                <span>Use</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[#1e293b] leading-relaxed font-normal">
                          {sug.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#dbeafe]/70 text-[10.5px] text-[#64748b]">
                  <span>Tap any card to apply</span>
                  {aiUsesLeft > 0 ? (
                    <button
                      type="button"
                      onClick={handleGenerateAiBio}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1 font-semibold text-[#043084] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`h-2.5 w-2.5 ${isGenerating ? "animate-spin" : ""}`} />
                      <span>Regenerate ({aiUsesLeft}/3)</span>
                    </button>
                  ) : (
                    <span className="font-semibold text-amber-700">3/3 AI uses used</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 7. Save Profile & Continue Button */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm h-10.5 sm:h-11 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
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
