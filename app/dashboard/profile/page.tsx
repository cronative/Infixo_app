"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Sparkles,
  Check,
  Lock,
  Search,
  Plus,
  ImagePlus,
  RefreshCw,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { CREATOR_TAXONOMY } from "@/data/categories";

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

  // Selected categories list
  const selectedCategories = useMemo(() => {
    return profile.category
      ? profile.category.split(",").map((c) => c.trim()).filter(Boolean)
      : [];
  }, [profile.category]);

  const isOtherSelected = selectedCategories.includes("Other");

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
      showToast("Profile photo updated! Click Save Changes to apply. ✨");
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
      showToast("Profile updated successfully! ✨");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("We couldn't update your profile. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12 text-left">
      {/* 3. Page Header: 28-30px font, 14-15px subtitle, 4px gap, no duplicate View Profile */}
      <div>
        <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#181716] leading-tight">
          My Profile
        </h1>
        <p className="text-sm sm:text-[15px] text-[#54514D] font-normal mt-1">
          Manage the information that introduces you to followers and brands.
        </p>
      </div>

      {/* 4 & 5 & 6 & 7 & 8: SECTION 1 — PROFILE IDENTITY CARD */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-xs space-y-5">
        {/* Card Header with Live Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#181716]">
              Profile identity
            </h2>
            <p className="text-xs sm:text-[13px] text-[#54514D] font-normal mt-0.5">
              This is how people will recognize you across Inflixo.
            </p>
          </div>
          {/* Live badge moved to Card Header per #6 */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17845B] bg-[#EAF7F0] px-2.5 py-1 rounded-full border border-[#17845B]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
            Live
          </span>
        </div>

        {/* 2-Column Desktop Structure (~30% Left, ~70% Right) */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-start pt-1">
          {/* Left ~30%: Profile photo (104-112px), Change Photo directly below */}
          <div className="md:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="relative group">
              <div className="w-[104px] h-[104px] sm:w-[110px] sm:h-[110px] rounded-full overflow-hidden border-2 border-[#E7E3DC] bg-[#FAF8F5] flex items-center justify-center shadow-xs">
                {profile.photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoDataUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#797570] gap-1">
                    <ImagePlus className="h-6 w-6 text-[#151933]" />
                    <span className="text-[10px] font-semibold text-[#151933]">Upload Photo</span>
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

            <div className="mt-3 space-y-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] hover:bg-[#151933]/[0.08] hover:text-[#151933] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{profile.photoDataUrl ? "Change Photo" : "Upload Photo"}</span>
              </button>
              <p className="text-xs text-[#54514D] leading-tight pt-1">
                Used across your public profile.
              </p>
              <p className="text-[11px] text-[#797570]">
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

          {/* Right ~70%: Display Name + Profile URL (Field gap: 20px) */}
          <div className="md:col-span-7 space-y-5">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-semibold text-[#181716] mb-2">
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
                className={`w-full h-11 rounded-xl border px-3.5 text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:outline-none transition-colors ${errors.displayName
                    ? "border-[#C2414B] bg-rose-50/20 focus:border-[#C2414B]"
                    : "border-[#E7E3DC] bg-white focus:border-[#151933] focus:ring-1 focus:ring-[#151933]/20"
                  }`}
              />
              {errors.displayName ? (
                <p className="text-xs font-medium text-[#C2414B] mt-1.5">{errors.displayName}</p>
              ) : (
                <p className="text-xs text-[#797570] mt-1.5">The name followers and brands will see.</p>
              )}
            </div>

            {/* 7 & 8: Profile URL (locked, non-input styling) */}
            <div>
              <label className="block text-xs font-semibold text-[#181716] mb-2">
                Profile URL
              </label>
              <div className="flex items-center justify-between h-11 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-3.5 text-sm font-medium text-[#181716]">
                <span className="truncate">inflixo.com/{handleStr}</span>
                <Lock className="h-4 w-4 text-[#797570] shrink-0" />
              </div>
              <p className="text-xs text-[#797570] mt-1.5">
                Your unique Inflixo profile address.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9, 10, 11, 12, 13, 14: SECTION 2 — CREATOR CATEGORIES CARD */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#181716]">
              Creator categories
            </h2>
            <p className="text-xs sm:text-[13px] text-[#54514D] font-normal mt-0.5">
              Choose up to 3 categories that describe your content.
            </p>
          </div>
          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/20 shrink-0">
            {selectedCategories.length} / 3 selected
          </span>
        </div>

        {errors.category && (
          <p className="text-xs font-medium text-[#C2414B]">{errors.category}</p>
        )}

        {/* 11: Search categories with 44px (h-11) height */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#797570]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full h-11 rounded-xl border border-[#E7E3DC] bg-white pl-10 pr-3.5 text-sm text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#151933] focus:ring-1 focus:ring-[#151933]/20 transition-colors"
          />
        </div>

        {/* 12, 13, 14: Categories Chips (Popular order, subtle purple for selected, uniform spacing) */}
        <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto p-1">
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
                  onClick={() => toggleCategory(item.category)}
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

        {selectedCategories.length >= 3 && (
          <p className="text-xs text-[#797570]">
            You&apos;ve selected the maximum of 3 categories.
          </p>
        )}

        {/* Custom Input for "Other" Category */}
        {isOtherSelected && (
          <div className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] p-3.5 space-y-2">
            <label className="block text-xs font-semibold text-[#181716] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#151933]" />
              <span>What type of content do you create?</span>
            </label>
            <input
              type="text"
              maxLength={40}
              placeholder="e.g. Magic, Farming, ASMR, Collectibles"
              value={profile.customCategory || ""}
              onChange={(e) => updateProfile({ customCategory: e.target.value.slice(0, 40) })}
              className="w-full h-11 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-sm font-medium text-[#181716] focus:outline-none focus:border-[#151933]"
            />
          </div>
        )}
      </section>

      {/* SECTION 3 — ABOUT YOUR CONTENT */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#181716]">
            About your content
          </h2>
          <p className="text-xs sm:text-[13px] text-[#54514D] font-normal mt-0.5">
            Help followers and brands understand what you create.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#181716]">
              Short bio
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSuggestBio}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#151933] bg-[#151933]/[0.08] hover:bg-[#151933]/15 border border-[#151933]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#151933]" />
                <span>Suggest Bio</span>
              </button>
              <span className="text-xs text-[#797570]">
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
            className={`w-full rounded-xl border p-3.5 text-sm font-normal text-[#181716] placeholder:text-[#797570]/50 focus:outline-none transition-colors resize-y min-h-[92px] ${errors.bio
                ? "border-[#C2414B] bg-rose-50/20 focus:border-[#C2414B]"
                : "border-[#E7E3DC] bg-white focus:border-[#151933] focus:ring-1 focus:ring-[#151933]/20"
              }`}
          />
          {errors.bio ? (
            <p className="text-xs font-medium text-[#C2414B]">{errors.bio}</p>
          ) : (
            <p className="text-xs text-[#797570]">
              Write a clear introduction to your content and creator identity.
            </p>
          )}
        </div>
      </section>

      {/* 15: SECTION 5 — SAVE BEHAVIOUR (Clear Save Changes button) */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="h-11 px-5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-sm font-medium text-[#54514D] hover:text-[#181716] transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-sm font-medium text-white transition-colors cursor-pointer shadow-xs disabled:opacity-60"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
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
