"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, AtSign, FileText, Sparkles, Copy, ExternalLink, LogOut } from "lucide-react";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { AuthService } from "@/services/AuthService";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { SubtypeMultiSelect } from "@/components/ui/SubtypeMultiSelect";
import { copyToClipboard } from "@/lib/copyToClipboard";

const BIO_SUGGESTIONS = [
  "🎬 Creating cinematic vlogs & travel stories for curious minds.",
  "💡 Tech reviews, gadget teardowns & daily coding tips.",
  "🌿 Mindful living, wellness & aesthetic everyday routines.",
  "🍳 Authentic Indian recipes & street food explorations.",
];

export default function DashboardProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useCreator();
  const { showToast } = useToast();
  const isUsernameLocked = true;

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    category?: string;
  }>({});

  const handleStr = profile.username || "nikzios30";
  const profileUrl = `inflixo.com/${handleStr}`;

  async function handleCopyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullLink = `${origin}/${handleStr}`;
    const success = await copyToClipboard(fullLink);
    if (success) {
      showToast("Profile link copied! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  }

  function handleSuggestBio() {
    const randomSug = BIO_SUGGESTIONS[Math.floor(Math.random() * BIO_SUGGESTIONS.length)];
    updateProfile({ bio: randomSug });
    showToast("AI Bio suggestion applied! ✨");
  }

  async function handleSave() {
    const newErrors: typeof errors = {};
    if (!profile.displayName.trim()) newErrors.displayName = "Display name is required";
    if (!profile.category) newErrors.category = "Select at least 1 category";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill in the required fields 💡", "error");
      return;
    }

    setSubmitting(true);
    try {
      await ProfileService.saveToDb(profile);
      showToast("Your creator profile changes are live! ✨");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("Could not save profile changes. Please try again!", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        
        {/* Top Navigation Action Group */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-lg font-black text-slate-900 truncate">
              Edit Profile
            </h1>
            {/* Handle Copy Pill */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-[#6366F1] hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
              title="Copy Profile Link"
            >
              <span>{profileUrl}</span>
              <Copy className="h-3 w-3 opacity-70" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#6366F1]" />
              <span>View Live Profile ↗</span>
            </a>
            <button
              type="button"
              onClick={() => {
                AuthService.logout();
                router.push("/login");
              }}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-2xs">
          
          {/* 1. Avatar Upload & Rendering */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <PhotoUpload
                value={profile.photoDataUrl}
                onChange={(v) => updateProfile({ photoDataUrl: v })}
                shape="circle"
                size={80}
              />
              <div className="text-xs text-slate-500 space-y-0.5">
                <p className="font-bold text-[#111827]">Upload high-res profile photo</p>
                <p>Square JPG or PNG, max 5MB</p>
                <p className="text-[11px] text-[#6366F1] font-semibold">Displays across your public page &amp; mobile cards</p>
              </div>
            </div>
          </div>

          {/* 2. Display Name & Locked Username Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name Input */}
            <Input
              label="Display Name"
              name="displayName"
              placeholder="e.g. Nikunj Munjiyasara"
              leftIcon={<User className="h-4 w-4 text-[#6366F1]" />}
              value={profile.displayName}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
              error={errors.displayName}
              className="bg-white border-[#E5E7EB] font-semibold text-[#111827] focus:border-[#6366F1]"
            />

            {/* Locked Handle Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Unique Handle (Locked)
                </label>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-md">
                  Locked
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 text-xs font-semibold text-slate-700">
                <AtSign className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">{handleStr}</span>
              </div>
            </div>
          </div>

          {/* 3. Creator Categories & Niches */}
          <div className="pt-2">
            <CategorySelect
              value={profile.category}
              customValue={profile.customCategory}
              onChange={(cat, customCat) => {
                updateProfile({ category: cat as any, customCategory: customCat, profession: null });
                setErrors((prev) => ({ ...prev, category: undefined }));
              }}
              error={errors.category}
              max={3}
            />

            {profile.category && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <SubtypeMultiSelect
                  category={profile.category}
                  value={profile.profession || null}
                  onChange={(prof) => updateProfile({ profession: prof })}
                  max={5}
                />
              </div>
            )}
          </div>

          {/* 4. Short Bio Textarea & AI Suggest Button */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#6366F1]" />
                <span>Short Bio</span>
              </label>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSuggestBio}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-[#6366F1] bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Suggest Bio</span>
                </button>

                <span className="text-xs font-medium text-slate-400">
                  {profile.bio ? profile.bio.length : 0}/160
                </span>
              </div>
            </div>

            <Textarea
              name="bio"
              placeholder="Tell your audience what you create..."
              rows={3}
              maxLength={160}
              value={profile.bio}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              className="bg-white border-[#E5E7EB] font-medium text-slate-900 focus:border-[#6366F1]"
            />
          </div>

          {/* 5. Form Save Action Bar */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2.5 text-xs font-medium text-[#4B5563] hover:text-slate-900 transition-colors cursor-pointer"
            >
              Discard / Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="tap-scale bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-xs px-8 py-2.5 rounded-xl transition-colors cursor-pointer shadow-none flex items-center gap-2"
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

