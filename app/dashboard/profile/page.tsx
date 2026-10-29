"use client";

import { useState, useRef, useMemo } from "react";
import {
  Camera,
  Sparkles,
  RefreshCw,
  User,
  CheckCircle2,
  Copy,
  Pencil,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { CreatorProfile } from "@/types";

const BIO_SUGGESTIONS = [
  "🎬 Creating cinematic vlogs & travel stories for curious minds.",
  "💡 Tech reviews, gadget teardowns & daily coding tips.",
  "🌿 Mindful living, wellness & aesthetic everyday routines.",
  "🍳 Authentic Indian recipes & street food explorations.",
  "🚀 Helping aspiring creators scale their digital presence.",
  "🎨 Digital art, motion design tutorials & creative workflows.",
];

export default function DashboardProfilePage() {
  const { profile, updateProfile } = useCreator();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snapshot, setSnapshot] = useState<Partial<CreatorProfile> | null>(null);
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

  const handleStartEdit = () => {
    setSnapshot({
      displayName: profile.displayName,
      bio: profile.bio,
      photoDataUrl: profile.photoDataUrl,
      category: profile.category,
      customCategory: profile.customCategory,
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (snapshot) {
      updateProfile(snapshot);
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleCopyUrl = async () => {
    const url = `https://inflixo.com/${handleStr}`;
    const ok = await copyToClipboard(url);
    showToast(ok ? "Profile link copied! 📋" : "Could not copy link", ok ? "success" : "error");
  };

  // Profile image upload handler
  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Please upload an image smaller than 5MB", "error");
      return;
    }
    resizeImageToDataUrl(file, 512).then((dataUrl) => {
      updateProfile({ photoDataUrl: dataUrl });
      showToast("Photo updated. Click Save changes to apply.");
    }).catch(() => showToast("Could not read that image. Please try another.", "error"));
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
      showToast("Profile updated");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("We couldn't update your profile. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        {...PAGE_COPY.profile}
        actions={
          isEditing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={submitting}
                className="dash-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="dash-btn-primary"
              >
                {submitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              className="dash-btn-primary inline-flex items-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit profile</span>
            </button>
          )
        }
      />

      {/* VIEW MODE: SectionCard "Your profile" */}
      {!isEditing ? (
        <SectionCard
          icon={<User className="h-4 w-4" />}
          title="Your profile"
          subtitle="This is how your creator identity appears across Inflixo."
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-(--success)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--success)" />
              Live
            </span>
          }
        >
          <div className="flex flex-col sm:flex-row items-start gap-5 pt-1">
            {/* Profile photo 72px (or initials) */}
            <div className="shrink-0">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={displayName || handleStr}
                className="w-[72px] h-[72px] rounded-full border-2 border-[#ECECF0] shadow-xs object-cover"
                textClassName="text-xl font-extrabold text-[#7A2253]"
                fallbackBgClass="bg-[#FAFAFB]"
              />
            </div>

            {/* Read-only details */}
            <div className="space-y-3 flex-1 min-w-0">
              {/* Display name 18px/600 */}
              <div>
                <h3 className="text-[18px] font-semibold text-[#18181B] leading-tight">
                  {displayName || "Your name"}
                </h3>

                {/* inflixo.com/username (copy icon) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="tap-scale inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B6B76] hover:text-[#7A2253] transition-colors cursor-pointer group"
                    title="Copy profile link"
                  >
                    <span>inflixo.com/{handleStr}</span>
                    <Copy className="h-3.5 w-3.5 text-[#94a3b8] group-hover:text-[#7A2253] transition-colors" />
                  </button>
                </div>
              </div>

              {/* Niche chips */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="h-6 inline-flex items-center rounded-[5px] bg-[#FAFAFB] border border-[#ECECF0] px-2 text-[12px] font-medium text-[#18181B]"
                    >
                      {cat}
                    </span>
                  ))}
                  {profile.customCategory && (
                    <span className="h-6 inline-flex items-center rounded-[5px] bg-[#F7EEF2] border border-[#F7EEF2] px-2 text-[12px] font-medium text-[#7A2253]">
                      {profile.customCategory}
                    </span>
                  )}
                </div>
              )}

              {/* Short bio */}
              <div className="pt-1">
                <h4 className="text-[12px] font-semibold text-[#6B6B76] mb-1">
                  Bio
                </h4>
                {profile.bio && profile.bio.trim() ? (
                  <p className="text-[13px] text-[#3F3F46] leading-relaxed max-w-xl">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-[12px] text-[#6B6B76] italic">No bio added yet.</p>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        /* EDIT MODE: Existing form */
        <div className="space-y-6">
          {/* SECTION 1 — PROFILE IDENTITY CARD */}
          <SectionCard
            icon={<User className="h-4 w-4" />}
            title="Profile identity"
            subtitle="This is how people will recognize you across Inflixo."
            action={
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-(--success)">
                <span className="h-1.5 w-1.5 rounded-full bg-(--success)" />
                Live
              </span>
            }
          >
            {/* 2-Column Desktop Structure */}
            <div className="grid grid-cols-1 md:grid-cols-10 gap-5 items-start pt-1">
              {/* Left: Profile photo */}
              <div className="md:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="relative group">
                  <CreatorAvatar
                    src={profile.photoDataUrl}
                    name={profile.displayName || profile.username || "Creator"}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-[#e2e8f0] shadow-xs"
                    textClassName="text-xl font-extrabold text-[#7A2253]"
                    fallbackBgClass="bg-[#f8fafc]"
                  />

                  {/* Hover / Camera overlay button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Upload photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-1 w-full flex flex-col items-center sm:items-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] px-4 py-2 text-xs font-semibold text-[#7A2253] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload photo</span>
                  </button>
                  <p className="text-[11px] text-[#64748b] leading-tight pt-0.5">
                    JPG or PNG, square (1:1), up to 5MB.
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
                  <label className="block text-xs sm:text-[13px] font-semibold text-[#0f172a] mb-1.5">
                    Display name <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-center h-11 rounded-[5px] border overflow-hidden transition-colors ${
                      errors.displayName
                        ? "border-[#C2414B] bg-rose-50/20 focus-within:border-[#C2414B]"
                        : "border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={displayName}
                      placeholder="e.g. Rahul Sharma"
                      onChange={(e) => {
                        updateProfile({ displayName: e.target.value });
                        if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: undefined }));
                      }}
                      className="flex-1 h-full px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                    />
                  </div>
                  {errors.displayName ? (
                    <p className="text-xs font-medium text-[#C2414B] mt-1">{errors.displayName}</p>
                  ) : (
                    <p className="text-[11px] text-[#64748b] mt-1">This name will be visible to your followers and brands.</p>
                  )}
                </div>

                {/* Profile URL */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-semibold text-[#0f172a] mb-1.5">
                    Profile URL <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center h-11 rounded-[5px] border border-[#e2e8f0] bg-[#f8fafc] overflow-hidden">
                    <span className="flex h-11 items-center px-3.5 border-r border-[#e2e8f0] bg-[#f1f5f9] text-xs sm:text-sm font-medium text-[#64748b] select-none">
                      inflixo.com/
                    </span>
                    <div className="flex-1 px-3.5 h-full flex items-center text-xs sm:text-sm font-semibold text-[#0f172a]">
                      {handleStr}
                    </div>
                    <span className="pr-3.5 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-50" />
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-1">
                    Your unique Inflixo profile address.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* SECTION 2 — CREATOR TYPE / PROFESSION CARD */}
          <section className="rounded-[5px] border border-[#ECECF0] bg-white p-4 shadow-none">
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
          <SectionCard
            icon={<Sparkles className="h-4 w-4" />}
            title="About your content"
            subtitle="Help followers and brands understand what you create."
            action={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSuggestBio}
                  className="dash-btn-secondary h-8! text-[13px] font-medium"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#7A2253]" />
                  <span>Suggest bio</span>
                </button>
                <span className="whitespace-nowrap text-[12px] text-[#6B6B76]">
                  {profile.bio ? profile.bio.length : 0} / 160
                </span>
              </div>
            }
          >
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#18181B]">
                Short bio <span className="text-red-500">*</span>
              </label>

              <textarea
                rows={3}
                maxLength={160}
                value={profile.bio || ""}
                placeholder="Write a clear introduction to your content and creator identity..."
                onChange={(e) => updateProfile({ bio: e.target.value })}
                className={`w-full rounded-[5px] border bg-white p-3 text-[13px] font-normal text-[#18181B] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:ring-1 focus:ring-[#7A2253] outline-none min-h-[88px] resize-y transition-colors ${
                  errors.bio ? "border-[#C2414B] bg-rose-50/20" : "border-[#ECECF0]"
                }`}
              />
              {errors.bio ? (
                <p className="text-[12px] font-medium text-[#C2414B]">{errors.bio}</p>
              ) : (
                <p className="text-[12px] text-[#6B6B76]">
                  Write a clear introduction to your content and creator identity.
                </p>
              )}
            </div>
          </SectionCard>

          {/* SECTION 4 — SAVE BEHAVIOUR */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={submitting}
              className="dash-btn-secondary"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="dash-btn-primary"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save changes</span>
              )}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
