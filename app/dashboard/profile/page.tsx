"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  Lock,
  RefreshCw,
  UserRound,
  ExternalLink,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";

const BIO_SUGGESTIONS = [
  "🎬 Creating cinematic vlogs & travel stories for curious minds.",
  "💡 Tech reviews, gadget teardowns & daily coding tips.",
  "🌿 Mindful living, wellness & aesthetic everyday routines.",
  "🍳 Authentic Indian recipes & street food explorations.",
  "🚀 Helping aspiring creators scale their digital presence.",
  "🎨 Digital art, motion design tutorials & creative workflows.",
];

export default function DashboardProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useCreator();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    category?: string;
    bio?: string;
  }>({});

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || "";

  // Selected creator type/profession list
  const selectedCategories = useMemo(() => {
    return profile.category
      ? profile.category.split(",").map((c) => c.trim()).filter(Boolean)
      : [];
  }, [profile.category]);

  // Profile image upload handler
  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Please upload an image smaller than 5MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ photoDataUrl: reader.result as string });
      showToast("Profile photo updated! Click Save Changes to apply. ✨");
    };
    reader.readAsDataURL(file);
  };

  // Suggest Bio
  const handleSuggestBio = () => {
    const randomSug = BIO_SUGGESTIONS[Math.floor(Math.random() * BIO_SUGGESTIONS.length)];
    updateProfile({ bio: randomSug });
    showToast("Bio suggestion applied! ✨");
  };

  // Form Save
  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!displayName.trim()) {
      newErrors.displayName = "Enter your display name.";
    }
    if (selectedCategories.length === 0) {
      newErrors.category = "Choose at least 1 creator type that best describes you.";
    }
    if (profile.bio && profile.bio.length > 160) {
      newErrors.bio = "Bio must be 160 characters or fewer.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please complete the required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      await ProfileService.saveToDb(profile);
      showToast("Profile updated successfully! ✨");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("We couldn't update your profile. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-4.5 w-full pb-8 text-left">
      {/* 3. Page Header: Full-width divider + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Profile
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#043084]/10 px-2.5 py-0.5 text-xs font-bold text-[#043084]">
              <UserRound className="h-3 w-3" />
              <span>@{handleStr}</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Keep your creator identity clear, searchable, and ready to share.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#043084] shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            <span>Live Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#043084] px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-brand-hover cursor-pointer disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* SECTION 1 — PROFILE IDENTITY CARD */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Card Header with Live Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#043084]">
              Profile identity
            </h2>
            <p className="text-xs text-[#475569] font-normal mt-0.5">
              This is how people will recognize you across Inflixo.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17845B] bg-[#EAF7F0] px-2.5 py-0.5 rounded-full border border-[#17845B]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
            Live
          </span>
        </div>

        {/* 2-Column Desktop Structure */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-5 items-start pt-0.5">
          {/* Left: Profile photo */}
          <div className="md:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="relative group">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={profile.displayName || profile.username || "Creator"}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-[#e2e8f0] shadow-xs"
                textClassName="text-xl font-extrabold text-[#043084]"
                fallbackBgClass="bg-[#f8fafc]"
              />

              {/* Hover overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Upload photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2.5 space-y-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9] hover:text-[#043084] px-2.5 py-1 text-xs font-semibold text-[#043084] transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{profile.photoDataUrl ? "Change Photo" : "Upload Photo"}</span>
              </button>
              <p className="text-[11px] text-[#475569] leading-tight">
                Square JPG or PNG, up to 5MB.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files?.[0])}
            />
          </div>

          {/* Right: Display Name + Profile URL */}
          <div className="md:col-span-7 space-y-4">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-semibold text-[#043084] mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                placeholder="e.g. Nikunj Munjiyasara"
                onChange={(e) => {
                  updateProfile({ displayName: e.target.value });
                  if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: undefined }));
                }}
                className={`w-full h-9.5 sm:h-10 rounded-lg border px-3 text-xs sm:text-sm font-medium text-[#043084] placeholder:text-[#64748b]/50 focus:outline-none transition-colors ${errors.displayName
                  ? "border-[#C2414B] bg-rose-50/20 focus:border-[#C2414B]"
                  : "border-[#e2e8f0] bg-white focus:border-[#043084] focus:ring-2 focus:ring-[#043084]/10"
                  }`}
              />
              {errors.displayName ? (
                <p className="text-xs font-medium text-[#C2414B] mt-1">{errors.displayName}</p>
              ) : (
                <p className="text-[11px] text-[#64748b] mt-1">The name followers and brands will see.</p>
              )}
            </div>

            {/* Profile URL */}
            <div>
              <label className="block text-xs font-semibold text-[#043084] mb-1.5">
                Profile URL
              </label>
              <div className="flex items-center justify-between h-9.5 sm:h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-xs sm:text-sm font-medium text-[#043084]">
                <span className="truncate">inflixo.com/{handleStr}</span>
                <Lock className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Your unique Inflixo profile address.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CREATOR TYPE / PROFESSION CARD */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
        <CategorySelect
          value={profile.category || null}
          customValue={profile.customCategory || ""}
          error={errors.category}
          max={3}
          onChange={(category, customCategory) => {
            updateProfile({
              category: category || null,
              customCategory: customCategory || "",
            });
            setErrors((prev) => ({ ...prev, category: undefined }));
          }}
        />
      </section>

      {/* SECTION 3 — ABOUT YOUR CONTENT */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#043084]">
            About your content
          </h2>
          <p className="text-xs text-[#475569] font-normal mt-0.5">
            Help followers and brands understand what you create.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#043084]">
              Short bio
            </label>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSuggestBio}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#043084] bg-[#043084]/[0.08] hover:bg-brand-hover/15 border border-[#043084]/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-[#043084]" />
                <span>Suggest Bio</span>
              </button>
              <span className="text-[11px] text-[#64748b]">
                {profile.bio ? profile.bio.length : 0} of 160
              </span>
            </div>
          </div>

          <textarea
            rows={3}
            maxLength={160}
            value={profile.bio || ""}
            placeholder="Tell people what you create and what they can expect from your content..."
            onChange={(e) => updateProfile({ bio: e.target.value })}
            className={`w-full rounded-lg border p-3 text-xs sm:text-sm font-normal text-[#043084] placeholder:text-[#64748b]/50 focus:outline-none transition-colors resize-y min-h-[80px] ${errors.bio
              ? "border-[#C2414B] bg-rose-50/20 focus:border-[#C2414B]"
              : "border-[#e2e8f0] bg-white focus:border-[#043084] focus:ring-2 focus:ring-[#043084]/10"
              }`}
          />
          {errors.bio ? (
            <p className="text-xs font-medium text-[#C2414B]">{errors.bio}</p>
          ) : (
            <p className="text-[11px] text-[#64748b]">
              Write a clear introduction to your content and creator identity.
            </p>
          )}
        </div>
      </section>

      {/* SECTION 4 — SAVE BEHAVIOUR */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="h-9 px-4 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs sm:text-sm font-medium text-[#475569] hover:text-[#043084] transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[#043084] hover:bg-brand-hover text-xs sm:text-sm font-medium text-white transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-60"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </div>
  );
}
