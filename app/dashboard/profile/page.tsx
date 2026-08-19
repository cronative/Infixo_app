"use client";

import { useState, useEffect } from "react";
import { User, AtSign, Tag, FileText, Check, Loader2, AlertCircle, Sparkles, Lock } from "lucide-react";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { BROAD_CATEGORIES, getProfessionsForCategory } from "@/data/categories";
import { slugifyUsername } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";
import { ProfileService } from "@/services/ProfileService";
import { authRepository } from "@/repositories/localRepository";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { SubtypeMultiSelect } from "@/components/ui/SubtypeMultiSelect";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const BIO_SUGGESTIONS = [
  "🎬 Creating cinematic vlogs & travel stories",
  "💡 Tech reviews, gadget teardowns & coding tips",
  "🌿 Mindful living, wellness & everyday routines",
  "🍳 Authentic recipes & street food explorations",
];

export default function DashboardProfilePage() {
  const { profile, updateProfile } = useCreator();
  const { showToast } = useToast();
  const isUsernameLocked = true;

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    username?: string;
    category?: string;
  }>({});

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message?: string } | null>(null);

  // Live debounced DB username uniqueness check (only if handle not locked)
  useEffect(() => {
    if (isUsernameLocked) {
      setUsernameStatus(null);
      return;
    }

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
  }, [profile.username, isUsernameLocked]);

  function handleSaveClick() {
    const newErrors: typeof errors = {};
    if (!profile.displayName.trim()) newErrors.displayName = "Display name is required";
    if (!profile.username.trim()) newErrors.username = "Choose a username";
    else if (profile.username.trim().length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!profile.category) newErrors.category = "Select a category";

    if (!isUsernameLocked && usernameStatus && !usernameStatus.available) {
      newErrors.username = usernameStatus.message || `@${profile.username} is already taken`;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fix the highlighted fields before saving 💡", "error");
      return;
    }

    // Open confirmation modal
    setIsConfirmModalOpen(true);
  }

  async function executeSaveToDb() {
    setSubmitting(true);
    try {
      if (!isUsernameLocked) {
        // Final live DB check before saving
        const email = authRepository.getPendingEmail() || "";
        const checkRes = await fetch(`/api/creator/check-username?username=${encodeURIComponent(profile.username)}&email=${encodeURIComponent(email)}`);
        const checkData = await checkRes.json();

        if (!checkData.available) {
          setErrors((prev) => ({ ...prev, username: checkData.error || `@${profile.username} is already taken` }));
          showToast(checkData.error || "This username is already taken by another creator! 💡", "error");
          setIsConfirmModalOpen(false);
          setSubmitting(false);
          return;
        }
      }

      // Save directly via POST /api/creator/profile
      await ProfileService.saveToDb(profile);
      setIsConfirmModalOpen(false);
      showToast("Your creator profile is updated & live! ✨🎉");
    } catch (err: any) {
      console.error("Failed to save profile changes:", err);
      showToast("Could not save profile changes. Please try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-8 py-4 sm:py-8 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-black text-inflixo-navy sm:text-3xl">Edit Profile</h1>
        <p className="mt-1 text-sm text-muted">
          Update your creator profile details. All changes sync directly to your live public link.
        </p>
      </div>

      <div className="space-y-6 rounded-3xl border border-inflixo-border bg-white p-6 shadow-xs">
        {/* Photo Upload Section */}
        <div>
          <label className="mb-2 block text-sm font-bold text-inflixo-navy">
            Profile Picture
          </label>
          <div className="flex items-center gap-5">
            <PhotoUpload value={profile.photoDataUrl} onChange={(v) => updateProfile({ photoDataUrl: v })} />
            <div className="text-xs text-muted space-y-1">
              <p className="font-semibold text-inflixo-navy">Upload high-res photo</p>
              <p>Square JPG or PNG</p>
              <p className="text-[11px] text-inflixo-purple font-medium">Shows on your live Inflixo profile card</p>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <Input
          label="Display name"
          name="displayName"
          placeholder="e.g. Tony Stark"
          leftIcon={<User className="h-4 w-4 text-inflixo-purple" />}
          value={profile.displayName}
          onChange={(e) => updateProfile({ displayName: e.target.value })}
          error={errors.displayName}
        />

        {/* Unique Username Handle (Locked once created) */}
        <div>
          <Input
            label="Unique handle / username"
            name="username"
            placeholder="username"
            prefix="inflixo.com/"
            disabled={isUsernameLocked}
            leftIcon={<AtSign className="h-4 w-4 text-inflixo-purple" />}
            value={profile.username}
            onChange={(e) => !isUsernameLocked && updateProfile({ username: slugifyUsername(e.target.value) })}
            error={errors.username}
            rightSlot={
              isUsernameLocked ? (
                <span className="flex items-center gap-1.5 rounded-full bg-slate-200/80 px-2.5 py-1 text-[11px] font-extrabold text-slate-600 border border-slate-300/80">
                  <Lock className="h-3 w-3 text-slate-600" />
                  Locked
                </span>
              ) : checkingUsername ? (
                <span className="flex items-center justify-center rounded-full bg-indigo-50 p-1 text-indigo-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              ) : usernameStatus?.available ? (
                <span className="flex items-center justify-center rounded-full bg-emerald-100 p-1 text-emerald-600">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
              ) : usernameStatus && !usernameStatus.available ? (
                <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Taken
                </span>
              ) : null
            }
          />
          {isUsernameLocked ? (
            <p className="mt-1.5 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-amber-500 shrink-0" />
              <span>Username handle is permanently locked to your account and cannot be changed.</span>
            </p>
          ) : profile.username && usernameStatus?.available ? (
            <p className="mt-1.5 text-xs text-muted flex items-center gap-1">
              Live link: <span className="font-semibold text-rose-600 underline">https://inflixo.com/{profile.username}</span>
            </p>
          ) : null}

          {/* Category & Profession Selectors */}
          <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
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
              <div className="pt-3 border-t border-slate-200/60">
                <SubtypeMultiSelect
                  category={profile.category}
                  value={profile.profession || null}
                  onChange={(prof) => {
                    updateProfile({ profession: prof });
                  }}
                  max={5}
                />
              </div>
            )}
          </div>
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
                  className="block w-full text-left rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:border-inflixo-purple/40 hover:bg-white hover:text-inflixo-navy transition-all"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100">
          <Button fullWidth size="lg" onClick={handleSaveClick}>
            Save Profile Changes
          </Button>
        </div>
      </div>

      {/* Confirmation Modal before saving */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeSaveToDb}
        loading={submitting}
        title="Publish Your New Look? ✨"
        description="Your updated bio, photo, and categories will go live instantly for your fanbase to see! Ready to make it official?"
        confirmText="Yes, Publish Changes ✨"
        cancelText="Keep Editing"
      />


    </div>
  );
}
