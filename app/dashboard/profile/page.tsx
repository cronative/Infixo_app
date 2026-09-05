"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Sparkles,
  Check,
  Lock,
  ExternalLink,
  Search,
  X,
  Plus,
  ShieldCheck,
  ImagePlus,
  RefreshCw,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { CREATOR_TAXONOMY, getSubtypesForCategories } from "@/data/categories";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState<{
    displayName?: string;
    category?: string;
    bio?: string;
  }>({});

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || "";
  const initialCategory = profile.category || "";

  // Selected categories list
  const selectedCategories = useMemo(() => {
    return profile.category
      ? profile.category.split(",").map((c) => c.trim()).filter(Boolean)
      : [];
  }, [profile.category]);

  const isOtherSelected = selectedCategories.includes("Other");

  // Selected specialties list
  const selectedSpecialties = useMemo(() => {
    return profile.profession
      ? profile.profession.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  }, [profile.profession]);

  // Available specialties for the selected categories
  const availableSpecialties = useMemo(() => {
    return getSubtypesForCategories(profile.category);
  }, [profile.category]);

  // Filtered categories for search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CREATOR_TAXONOMY;
    const query = searchQuery.trim().toLowerCase();
    return CREATOR_TAXONOMY.filter(
      (item) =>
        item.category.toLowerCase().includes(query) ||
        item.subtypes.some((st) => st.toLowerCase().includes(query))
    );
  }, [searchQuery]);

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
      showToast("Profile photo selected! Save changes to apply. ✨");
    };
    reader.readAsDataURL(file);
  };

  // Toggle Category
  const toggleCategory = (catName: string) => {
    let updated: string[];
    if (selectedCategories.includes(catName)) {
      updated = selectedCategories.filter((c) => c !== catName);
    } else {
      if (selectedCategories.length >= 3) return;
      updated = [...selectedCategories, catName];
    }
    const updatedCustom = updated.includes("Other") ? profile.customCategory || "" : "";
    updateProfile({
      category: updated.length > 0 ? updated.join(", ") : null,
      customCategory: updatedCustom,
    });
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  // Toggle Specialty
  const toggleSpecialty = (specialty: string) => {
    let updated: string[];
    if (selectedSpecialties.includes(specialty)) {
      updated = selectedSpecialties.filter((s) => s !== specialty);
    } else {
      if (selectedSpecialties.length >= 5) return;
      updated = [...selectedSpecialties, specialty];
    }
    updateProfile({
      profession: updated.length > 0 ? updated.join(", ") : null,
    });
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
      newErrors.category = "Choose up to 3 categories.";
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
      showToast("Profile updated! ✨");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("We couldn't update your profile. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A] tracking-tight">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6872] font-medium mt-1">
            Manage the information that introduces you to followers and brands.
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-auto">
          <a
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-3.5 py-2 text-xs font-semibold text-[#17131A] transition-colors shadow-2xs"
          >
            <span>View Profile</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#803D63]" />
          </a>
        </div>
      </div>

      {/* SECTION 1 — PROFILE IDENTITY */}
      <section className="rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A]">
            Profile identity
          </h2>
          <p className="text-xs text-[#6F6872] font-medium mt-0.5">
            This is how people will recognize you across Inflixo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-1">
          {/* Left: Compact Circular Photo Upload */}
          <div className="md:col-span-4 flex flex-col items-center sm:items-start gap-3">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#ECE8EB] bg-[#FAF8FA] flex items-center justify-center shadow-2xs">
                {profile.photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoDataUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#6F6872] gap-1">
                    <ImagePlus className="h-6 w-6 text-[#803D63]" />
                    <span className="text-[10px] font-semibold text-[#803D63]">Upload Photo</span>
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Upload photo"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] hover:bg-[#F7EDF3] hover:text-[#803D63] px-3 py-1.5 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{profile.photoDataUrl ? "Change Photo" : "Upload Photo"}</span>
              </button>
              <p className="text-[11px] text-[#6F6872] leading-tight">
                Used across your public profile.
              </p>
              <p className="text-[10px] text-[#6F6872]/80">
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

          {/* Right: Display Name & Locked Handle */}
          <div className="md:col-span-8 space-y-4">
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#17131A]">
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
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:outline-none transition-colors ${
                  errors.displayName
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                    : "border-[#ECE8EB] bg-white focus:border-[#803D63] focus:ring-1 focus:ring-[#803D63]/20"
                }`}
              />
              {errors.displayName ? (
                <p className="text-[11px] font-semibold text-rose-600">{errors.displayName}</p>
              ) : (
                <p className="text-[11px] text-[#6F6872]">The name followers and brands will see.</p>
              )}
            </div>

            {/* Locked Handle Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#17131A]">
                  Creator handle
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16794A] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                  <span className="h-1 w-1 rounded-full bg-[#16794A]" />
                  Live
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#6F6872]">
                <span className="truncate">inflixo.com/{handleStr}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6F6872] bg-white border border-[#ECE8EB] px-2 py-0.5 rounded-md shrink-0">
                  <Lock className="h-2.5 w-2.5" />
                  Locked
                </span>
              </div>
              <p className="text-[11px] text-[#6F6872]">
                Your unique Inflixo profile address.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CREATOR CATEGORY */}
      <section className="rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A]">
              What do you create?
            </h2>
            <p className="text-xs text-[#6F6872] font-medium mt-0.5">
              Choose up to 3 categories that best represent your content.
            </p>
          </div>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#ECE8EB] shrink-0">
            {selectedCategories.length} of 3 selected
          </span>
        </div>

        {errors.category && (
          <p className="text-xs font-semibold text-rose-600">{errors.category}</p>
        )}

        {/* Selected Categories Display */}
        {selectedCategories.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6F6872]">
              Selected Categories:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat) => {
                const foundItem = CREATOR_TAXONOMY.find((i) => i.category === cat);
                return (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#F7EDF3] border border-[#803D63]/30 px-3 py-1.5 text-xs font-semibold text-[#803D63] shadow-2xs"
                  >
                    <span>{foundItem?.emoji || "✨"}</span>
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                      title={`Remove ${cat}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories"
            className="w-full rounded-xl border border-[#ECE8EB] bg-white pl-9 pr-3.5 py-2 text-xs text-[#17131A] placeholder:text-[#6F6872]/60 focus:outline-none focus:border-[#803D63] focus:ring-1 focus:ring-[#803D63]/20 transition-colors"
          />
        </div>

        {/* Categories Chips Container */}
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
          {filteredCategories.length === 0 ? (
            <p className="text-xs text-[#6F6872] p-2">No matching categories found.</p>
          ) : (
            filteredCategories.map((item) => {
              const isSelected = selectedCategories.includes(item.category);
              const isMaxReached = !isSelected && selectedCategories.length >= 3;

              return (
                <button
                  key={item.category}
                  type="button"
                  disabled={isMaxReached}
                  onClick={() => toggleCategory(item.category)}
                  className={`inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#F7EDF3] border border-[#803D63] text-[#803D63] font-semibold shadow-2xs"
                      : isMaxReached
                      ? "opacity-40 cursor-not-allowed bg-white border border-[#ECE8EB] text-[#6F6872]"
                      : "bg-white border border-[#ECE8EB] text-[#17131A] hover:border-[#803D63]/40 hover:bg-[#FAF8FA]"
                  }`}
                >
                  <span className="text-xs shrink-0">{item.emoji}</span>
                  <span className="truncate">{item.category}</span>
                  {isSelected ? (
                    <Check className="h-3 w-3 text-[#803D63] shrink-0" />
                  ) : (
                    <Plus className="h-3 w-3 text-[#6F6872] shrink-0 opacity-70" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {selectedCategories.length >= 3 && (
          <p className="text-[11px] font-medium text-[#6F6872]">
            You&apos;ve selected the maximum of 3 categories.
          </p>
        )}

        {/* Custom Input for "Other" Category */}
        {isOtherSelected && (
          <div className="rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 space-y-1.5">
            <label className="block text-xs font-bold text-[#17131A] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
              <span>What type of content do you create?</span>
            </label>
            <input
              type="text"
              maxLength={40}
              placeholder="e.g. Magic, Farming, ASMR, Collectibles"
              value={profile.customCategory || ""}
              onChange={(e) => updateProfile({ customCategory: e.target.value.slice(0, 40) })}
              className="w-full rounded-lg border border-[#ECE8EB] bg-white px-3 py-2 text-xs font-medium text-[#17131A] focus:outline-none focus:border-[#803D63]"
            />
          </div>
        )}
      </section>

      {/* SECTION 3 — CREATOR SPECIALTIES */}
      <section className="rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A]">
              Creator specialties
            </h2>
            <p className="text-xs text-[#6F6872] font-medium mt-0.5">
              Select up to 5 options that describe your creator style.
            </p>
          </div>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#ECE8EB] shrink-0">
            {selectedSpecialties.length} of 5 selected
          </span>
        </div>

        {availableSpecialties.length === 0 ? (
          <p className="text-xs text-[#6F6872] bg-[#FAF8FA] p-3.5 rounded-xl border border-[#ECE8EB]">
            Select a creator category above to see related specialties.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
            {availableSpecialties.map((st) => {
              const isSelected = selectedSpecialties.includes(st);
              const isMaxReached = !isSelected && selectedSpecialties.length >= 5;

              return (
                <button
                  key={st}
                  type="button"
                  disabled={isMaxReached}
                  onClick={() => toggleSpecialty(st)}
                  className={`inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#F7EDF3] border border-[#803D63] text-[#803D63] font-semibold shadow-2xs"
                      : isMaxReached
                      ? "opacity-40 cursor-not-allowed bg-white border border-[#ECE8EB] text-[#6F6872]"
                      : "bg-white border border-[#ECE8EB] text-[#17131A] hover:border-[#803D63]/40 hover:bg-[#FAF8FA]"
                  }`}
                >
                  <span className="truncate">{st}</span>
                  {isSelected ? (
                    <Check className="h-3 w-3 text-[#803D63] shrink-0" />
                  ) : (
                    <Plus className="h-3 w-3 text-[#6F6872] shrink-0 opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 4 — ABOUT YOUR CONTENT */}
      <section className="rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A]">
            About your content
          </h2>
          <p className="text-xs text-[#6F6872] font-medium mt-0.5">
            Help followers and brands understand what you create.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-[#17131A]">
                Short bio
              </label>
              <p className="text-[11px] text-[#6F6872]">
                Write a clear introduction to your content and creator identity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSuggestBio}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#803D63] bg-[#F7EDF3] hover:bg-[#F7EDF3]/80 border border-[#ECE8EB] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-[#803D63]" />
                <span>Suggest Bio</span>
              </button>
              <span className="text-[11px] font-medium text-[#6F6872]">
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
            className={`w-full rounded-xl border p-3 text-xs sm:text-sm font-medium text-[#17131A] placeholder:text-[#6F6872]/50 focus:outline-none transition-colors resize-y min-h-[84px] ${
              errors.bio
                ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                : "border-[#ECE8EB] bg-white focus:border-[#803D63] focus:ring-1 focus:ring-[#803D63]/20"
            }`}
          />
          {errors.bio && (
            <p className="text-[11px] font-semibold text-rose-600">{errors.bio}</p>
          )}
        </div>
      </section>

      {/* SECTION 5 — PROFILE ACTIONS */}
      <section className="rounded-2xl border border-[#ECE8EB] bg-white p-4 sm:p-5 flex items-center justify-between gap-3 shadow-2xs">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-4 py-2.5 text-xs font-semibold text-[#6F6872] hover:text-[#17131A] transition-colors cursor-pointer"
        >
          Discard Changes
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Profile</span>
          )}
        </button>
      </section>
    </div>
  );
}
